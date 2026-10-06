import { ApiError } from '../common/utils/ApiError.js'

export const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const datePattern = /^\d{4}-\d{2}-\d{2}$/
const localTimePattern = /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/

export function validateLocalDate(date) {
  if (typeof date !== 'string' || !datePattern.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`)) || new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date) {
    throw new ApiError(400, 'Choose a valid calendar date.')
  }
  return date
}

export function validateLocalDateTime(value) {
  if (typeof value !== 'string' || !localTimePattern.test(value)) throw new ApiError(400, 'Choose a valid date and time.')
  validateLocalDate(value.slice(0, 10))
  return new Date(`${value}+05:00`)
}

export async function readService(client, serviceId, localDate) {
  if (!uuidPattern.test(serviceId || '')) throw new ApiError(400, 'Choose a valid service.')
  const result = await client.query(
    `SELECT s.id, s.name, s.duration_minutes, s.price,
       o.id AS organization_id, o.business_name, o.owner_user_id,
       a.start_time, a.end_time
     FROM organization_services s
     JOIN organizations o ON o.id = s.organization_id
     JOIN users owner ON owner.id = o.owner_user_id
     LEFT JOIN organization_availability a
       ON a.organization_id = o.id AND a.day_of_week = EXTRACT(DOW FROM $2::date)
     WHERE s.id = $1 AND o.status = 'approved' AND owner.role = 'service_provider'
       AND owner.status <> 'suspended'`,
    [serviceId, localDate],
  )
  if (!result.rowCount) throw new ApiError(404, 'This service is no longer available.')
  return result.rows[0]
}

export function assertServiceTime(service, scheduledAt, durationMinutes = service.duration_minutes) {
  const instant = validateLocalDateTime(scheduledAt)
  if (instant <= new Date()) throw new ApiError(400, 'Choose a future appointment time.')
  const time = scheduledAt.slice(11)
  if (!service.start_time || !service.end_time) throw new ApiError(400, 'The provider is closed on that day.')
  const start = service.start_time.slice(0, 5)
  const end = service.end_time.slice(0, 5)
  if (time < start || time >= end) throw new ApiError(400, 'Choose a time within the provider opening hours.')
  const [hour, minute] = time.split(':').map(Number)
  const [closingHour, closingMinute] = end.split(':').map(Number)
  if (hour * 60 + minute + durationMinutes > closingHour * 60 + closingMinute) {
    throw new ApiError(400, 'This service would finish after the provider closes.')
  }
  return instant
}

export async function lockOrganization(client, organizationId) {
  await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [organizationId])
}

export async function hasOverlap(client, organizationId, instant, durationMinutes, excludeBookingId = null) {
  const result = await client.query(
    `SELECT 1 FROM appointments
     WHERE organization_id = $1 AND status IN ('pending', 'confirmed')
       AND ($4::uuid IS NULL OR id <> $4)
       AND scheduled_at < $2::timestamptz + $3::integer * INTERVAL '1 minute'
       AND scheduled_at + duration_minutes * INTERVAL '1 minute' > $2::timestamptz
     LIMIT 1`,
    [organizationId, instant, durationMinutes, excludeBookingId],
  )
  return result.rowCount > 0
}

export async function availableSlots(client, service, date, durationMinutes = service.duration_minutes) {
  if (!service.start_time || !service.end_time) return []
  const [startHour, startMinute] = service.start_time.slice(0, 5).split(':').map(Number)
  const [endHour, endMinute] = service.end_time.slice(0, 5).split(':').map(Number)
  const startMinutes = startHour * 60 + startMinute
  const endMinutes = endHour * 60 + endMinute
  const dayStart = new Date(`${date}T00:00:00+05:00`)
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
  const result = await client.query(
    `SELECT scheduled_at, duration_minutes FROM appointments
     WHERE organization_id = $1 AND status IN ('pending', 'confirmed')
       AND scheduled_at < $3 AND scheduled_at + duration_minutes * INTERVAL '1 minute' > $2`,
    [service.organization_id, dayStart, dayEnd],
  )
  const slots = []
  for (let minuteOfDay = startMinutes; minuteOfDay + durationMinutes <= endMinutes; minuteOfDay += 30) {
    const hour = String(Math.floor(minuteOfDay / 60)).padStart(2, '0')
    const minute = String(minuteOfDay % 60).padStart(2, '0')
    const local = `${date}T${hour}:${minute}`
    const instant = new Date(`${local}+05:00`)
    if (instant <= new Date()) continue
    const endsAt = instant.getTime() + durationMinutes * 60000
    const blocked = result.rows.some((booking) => {
      const bookedStart = new Date(booking.scheduled_at).getTime()
      return bookedStart < endsAt && bookedStart + booking.duration_minutes * 60000 > instant.getTime()
    })
    if (!blocked) slots.push(local)
  }
  return slots
}
