import pool from '../common/database/connection.js'
import { ApiError } from '../common/utils/ApiError.js'
import { assertServiceTime, availableSlots, hasOverlap, lockOrganization, readService, uuidPattern, validateLocalDate, validateLocalDateTime } from './bookingSchedule.js'
import { notifyUser } from './notify.js'
import { calculatePrice, validateDuration } from './bookingPrice.js'

function bookingError(error) {
  if (['22007', '22008'].includes(error.code)) return new ApiError(400, 'Choose a valid calendar date and time.')
  if (error.constraint === 'appointments_active_customer_service_index') return new ApiError(409, 'You already have an active booking for this service.')
  if (error.constraint === 'appointments_active_service_slot_index') return new ApiError(409, 'That time has just been taken.')
  return error
}

function validateCustomerDetails(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ApiError(400, 'Enter your contact and address details.')
  const fields = [['fullName', 2, 120], ['phone', 7, 30], ['address', 5, 300], ['city', 2, 100]]
  const details = {}
  for (const [key, min, max] of fields) {
    if (typeof value[key] !== 'string' || value[key].trim().length < min || value[key].trim().length > max) {
      throw new ApiError(400, `Enter a valid ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}.`)
    }
    details[key] = value[key].trim()
  }
  if (!/^[+\d][\d\s()+-]{6,29}$/.test(details.phone)) throw new ApiError(400, 'Enter a valid phone number.')
  if (value.instructions != null && (typeof value.instructions !== 'string' || value.instructions.trim().length > 500)) {
    throw new ApiError(400, 'Notes must be 500 characters or fewer.')
  }
  details.instructions = value.instructions?.trim() || null
  return details
}

export async function getAvailability(request, response, next) {
  try {
    const date = validateLocalDate(request.query.date)
    const service = await readService(pool, request.query.serviceId, date)
    const durationMinutes = request.query.durationMinutes == null ? service.duration_minutes : validateDuration(request.query.durationMinutes)
    const slots = await availableSlots(pool, service, date, durationMinutes)
    response.json({ serviceId: service.id, date, durationMinutes, slots })
  } catch (error) { next(bookingError(error)) }
}

export async function getBookingQuote(request, response, next) {
  try {
    const { serviceId, scheduledAt } = request.query
    const durationMinutes = validateDuration(request.query.durationMinutes)
    validateLocalDateTime(scheduledAt)
    const service = await readService(pool, serviceId, scheduledAt.slice(0, 10))
    const instant = assertServiceTime(service, scheduledAt, durationMinutes)
    const available = !(await hasOverlap(pool, service.organization_id, instant, durationMinutes))
    response.json({ available, durationMinutes, price: calculatePrice(service.price, service.duration_minutes, durationMinutes), ratePrice: service.price, rateDurationMinutes: service.duration_minutes })
  } catch (error) { next(bookingError(error)) }
}

export async function createBooking(request, response, next) {
  let client
  try {
    const { serviceId, scheduledAt } = request.body ?? {}
    const details = validateCustomerDetails(request.body?.customerDetails)
    validateLocalDateTime(scheduledAt)
    client = await pool.connect()
    await client.query('BEGIN')
    const service = await readService(client, serviceId, scheduledAt.slice(0, 10))
    const durationMinutes = request.body?.durationMinutes == null ? service.duration_minutes : validateDuration(request.body.durationMinutes)
    const instant = assertServiceTime(service, scheduledAt, durationMinutes)
    await lockOrganization(client, service.organization_id)
    const existing = await client.query(
      "SELECT 1 FROM appointments WHERE customer_id = $1 AND service_id = $2 AND status IN ('pending', 'confirmed')",
      [request.user.sub, serviceId],
    )
    if (existing.rowCount) throw new ApiError(409, 'You already have an active booking for this service.')
    if (await hasOverlap(client, service.organization_id, instant, durationMinutes)) {
      throw new ApiError(409, 'That time overlaps another appointment. Choose another slot.')
    }
    const result = await client.query(
      `INSERT INTO appointments
         (customer_id, organization_id, service_id, organization_name, service_name, duration_minutes, price, scheduled_at, rate_duration_minutes, rate_price)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, organization_name AS "organizationName", service_name AS "serviceName",
         scheduled_at AS "scheduledAt", duration_minutes AS "durationMinutes", price, status`,
      [request.user.sub, service.organization_id, service.id, service.business_name, service.name, durationMinutes,
        calculatePrice(service.price, service.duration_minutes, durationMinutes), instant, service.duration_minutes, service.price],
    )
    await client.query(
      `INSERT INTO booking_customer_details (booking_id, full_name, phone, address, city, instructions)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [result.rows[0].id, details.fullName, details.phone, details.address, details.city, details.instructions],
    )
    await notifyUser(client, service.owner_user_id, result.rows[0].id, `New booking request for ${service.name}.`)
    await client.query('COMMIT')
    response.status(201).json({ booking: result.rows[0], message: 'Appointment requested. You can view it in your profile.' })
  } catch (error) {
    if (client) await client.query('ROLLBACK')
    next(bookingError(error))
  } finally { client?.release() }
}

export async function getMyBookings(request, response, next) {
  try {
    const result = await pool.query(
      `SELECT a.id, a.service_id AS "serviceId", a.organization_name AS "organizationName",
         a.service_name AS "serviceName", a.duration_minutes AS "durationMinutes", a.price,
         a.scheduled_at AS "scheduledAt", a.status, a.decision_note AS "decisionNote",
         a.created_at AS "createdAt", r.rating AS "reviewRating",
         d.full_name AS "contactName", d.phone AS "contactPhone", d.address AS "contactAddress", d.city AS "contactCity", d.instructions AS "contactInstructions",
         (a.organization_id IS NOT NULL AND a.status = 'completed') AS "canReview"
       FROM appointments a LEFT JOIN organization_reviews r ON r.booking_id = a.id
       LEFT JOIN booking_customer_details d ON d.booking_id = a.id
       WHERE a.customer_id = $1 ORDER BY a.scheduled_at DESC`,
      [request.user.sub],
    )
    response.json({ bookings: result.rows })
  } catch (error) { next(error) }
}

export async function getProviderBookings(request, response, next) {
  try {
    const result = await pool.query(
      `SELECT a.id, a.organization_name AS "organizationName", a.service_name AS "serviceName", a.scheduled_at AS "scheduledAt",
         a.status, a.decision_note AS "decisionNote", a.duration_minutes AS "durationMinutes", a.price,
         (a.status = 'confirmed' AND a.scheduled_at + a.duration_minutes * INTERVAL '1 minute' <= NOW()) AS "canComplete",
         u.name AS "customerName", u.email AS "customerEmail",
         d.full_name AS "contactName", d.phone AS "contactPhone", d.address AS "contactAddress", d.city AS "contactCity", d.instructions AS "contactInstructions"
       FROM appointments a
       JOIN organizations o ON o.id = a.organization_id
       JOIN users u ON u.id = a.customer_id
       LEFT JOIN booking_customer_details d ON d.booking_id = a.id
       WHERE o.owner_user_id = $1
       ORDER BY CASE WHEN a.status = 'pending' THEN 0 ELSE 1 END, a.scheduled_at DESC`,
      [request.user.sub],
    )
    response.json({ bookings: result.rows })
  } catch (error) { next(error) }
}

export async function getAdminBookings(_request, response, next) {
  try {
    const result = await pool.query(
      `SELECT a.id, a.organization_name AS "organizationName", a.service_name AS "serviceName",
         a.scheduled_at AS "scheduledAt", a.status, a.duration_minutes AS "durationMinutes",
         u.name AS "customerName", u.email AS "customerEmail",
         d.full_name AS "contactName", d.phone AS "contactPhone", d.address AS "contactAddress", d.city AS "contactCity", d.instructions AS "contactInstructions"
       FROM appointments a JOIN users u ON u.id = a.customer_id
       LEFT JOIN booking_customer_details d ON d.booking_id = a.id
       ORDER BY a.created_at DESC LIMIT 200`,
    )
    response.json({ bookings: result.rows })
  } catch (error) { next(error) }
}

export async function getBookingHistory(request, response, next) {
  try {
    if (!uuidPattern.test(request.params.id)) throw new ApiError(400, 'Invalid booking ID.')
    const booking = await pool.query(
      `SELECT a.id, a.customer_id, a.created_at, a.scheduled_at, o.owner_user_id
       FROM appointments a LEFT JOIN organizations o ON o.id = a.organization_id
       WHERE a.id = $1 AND (a.customer_id = $2 OR o.owner_user_id = $2)`,
      [request.params.id, request.user.sub],
    )
    if (!booking.rowCount) throw new ApiError(404, 'Booking not found.')
    const row = booking.rows[0]
    const history = await pool.query(
      `SELECT id, event_type AS "eventType", previous_status AS "previousStatus",
         new_status AS "newStatus", previous_scheduled_at AS "previousScheduledAt",
         new_scheduled_at AS "newScheduledAt", note, created_at AS "createdAt",
         CASE WHEN actor_user_id = $2 THEN 'Customer'
              WHEN actor_user_id = $3 THEN 'Provider'
              ELSE 'System' END AS actor
       FROM appointment_history WHERE booking_id = $1 ORDER BY created_at, id`,
      [row.id, row.customer_id, row.owner_user_id],
    )
    response.json({ events: [
      { id: `requested-${row.id}`, eventType: 'requested', actor: 'Customer', createdAt: row.created_at, newScheduledAt: history.rows[0]?.previousScheduledAt || row.scheduled_at },
      ...history.rows,
    ] })
  } catch (error) { next(error) }
}

export async function reviewBooking(request, response, next) {
  let client
  try {
    const { id } = request.params
    const { decision, reason } = request.body ?? {}
    if (!uuidPattern.test(id)) throw new ApiError(400, 'Invalid booking ID.')
    if (!['confirmed', 'rejected'].includes(decision)) throw new ApiError(400, 'Choose Approve or Reject.')
    if (reason !== undefined && (typeof reason !== 'string' || reason.trim().length > 500)) throw new ApiError(400, 'Reason must be under 500 characters.')
    if (!reason || reason.trim().length < 10) throw new ApiError(400, decision === 'confirmed' ? 'Please include a note for the customer.' : 'Please provide a brief rejection reason.')
    client = await pool.connect()
    await client.query('BEGIN')
    const result = await client.query(
      `UPDATE appointments a SET status = $3, decision_note = $4, updated_at = NOW()
       FROM organizations o
       WHERE a.id = $1 AND a.organization_id = o.id
         AND o.owner_user_id = $2 AND a.status = 'pending' AND a.scheduled_at > NOW()
       RETURNING a.id, a.status, a.customer_id, a.service_name, a.scheduled_at`,
      [id, request.user.sub, decision, reason?.trim() || null],
    )
    if (!result.rowCount) throw new ApiError(404, 'Pending booking not found for your organization.')
    const booking = result.rows[0]
    await client.query(
      `INSERT INTO appointment_history
         (booking_id, actor_user_id, event_type, previous_status, new_status,
          previous_scheduled_at, new_scheduled_at, note)
       VALUES ($1, $2, $3, 'pending', $3, $4, $4, $5)`,
      [booking.id, request.user.sub, decision, booking.scheduled_at, reason.trim()],
    )
    await notifyUser(client, booking.customer_id, booking.id,
      decision === 'confirmed' ? `Your ${booking.service_name} booking was approved. ${reason.trim().slice(0, 120)}` : `Your ${booking.service_name} booking was rejected. ${reason.trim().slice(0, 120)}`)
    await client.query('COMMIT')
    response.json({ booking: { id: booking.id, status: booking.status }, message: decision === 'confirmed' ? 'Booking approved.' : 'Booking rejected.' })
  } catch (error) {
    if (client) await client.query('ROLLBACK')
    next(error)
  } finally { client?.release() }
}

export async function completeBooking(request, response, next) {
  let client
  try {
    if (!uuidPattern.test(request.params.id)) throw new ApiError(400, 'Invalid booking ID.')
    client = await pool.connect()
    await client.query('BEGIN')
    const result = await client.query(
      `UPDATE appointments a SET status = 'completed', updated_at = NOW()
       FROM organizations o
       WHERE a.id = $1 AND a.organization_id = o.id
         AND o.owner_user_id = $2 AND a.status = 'confirmed'
         AND a.scheduled_at + a.duration_minutes * INTERVAL '1 minute' <= NOW()
       RETURNING a.id, a.customer_id, a.service_name, a.scheduled_at`,
      [request.params.id, request.user.sub],
    )
    if (!result.rowCount) throw new ApiError(409, 'Only a finished, confirmed booking can be marked completed.')
    const booking = result.rows[0]
    await client.query(
      `INSERT INTO appointment_history
         (booking_id, actor_user_id, event_type, previous_status, new_status,
          previous_scheduled_at, new_scheduled_at)
       VALUES ($1, $2, 'completed', 'confirmed', 'completed', $3, $3)`,
      [booking.id, request.user.sub, booking.scheduled_at],
    )
    await notifyUser(client, booking.customer_id, booking.id, `Your ${booking.service_name} appointment has been marked completed. You can now leave a review.`)
    await client.query('COMMIT')
    response.json({ booking: { id: booking.id, status: 'completed' }, message: 'Appointment marked completed.' })
  } catch (error) {
    if (client) await client.query('ROLLBACK')
    next(error)
  } finally { client?.release() }
}

export async function cancelBooking(request, response, next) {
  let client
  try {
    if (!uuidPattern.test(request.params.id)) throw new ApiError(400, 'Invalid booking ID.')
    client = await pool.connect()
    await client.query('BEGIN')
    const result = await client.query(
      `WITH previous AS (
         SELECT id, status, scheduled_at FROM appointments
         WHERE id = $1 AND customer_id = $2 AND status IN ('pending', 'confirmed')
           AND scheduled_at > NOW() FOR UPDATE
       ), changed AS (
         UPDATE appointments a SET status = 'cancelled', updated_at = NOW()
         FROM previous p WHERE a.id = p.id
         RETURNING a.id, a.service_name, a.organization_id, p.status AS previous_status, p.scheduled_at
       ) SELECT * FROM changed`,
      [request.params.id, request.user.sub],
    )
    if (!result.rowCount) throw new ApiError(409, 'This booking cannot be cancelled.')
    const booking = result.rows[0]
    const assignment = await client.query('SELECT employee_user_id FROM employee_duty_assignments WHERE booking_id = $1', [booking.id])
    await client.query(
      `INSERT INTO appointment_history
         (booking_id, actor_user_id, event_type, previous_status, new_status,
          previous_scheduled_at, new_scheduled_at, previous_employee_user_id)
       VALUES ($1, $2, 'cancelled', $3, 'cancelled', $4, $4, $5)`,
      [booking.id, request.user.sub, booking.previous_status, booking.scheduled_at, assignment.rows[0]?.employee_user_id ?? null],
    )
    const owner = await client.query('SELECT owner_user_id FROM organizations WHERE id = $1', [booking.organization_id])
    await notifyUser(client, owner.rows[0]?.owner_user_id, booking.id, `A customer cancelled the ${booking.service_name} booking.`)
    await client.query('COMMIT')
    response.json({ message: 'Booking cancelled.' })
  } catch (error) {
    if (client) await client.query('ROLLBACK')
    next(error)
  } finally { client?.release() }
}

export async function rescheduleBooking(request, response, next) {
  let client
  try {
    if (!uuidPattern.test(request.params.id)) throw new ApiError(400, 'Invalid booking ID.')
    const scheduledAt = request.body?.scheduledAt
    const instant = validateLocalDateTime(scheduledAt)
    client = await pool.connect()
    await client.query('BEGIN')
    const bookingResult = await client.query(
      `SELECT id, service_id, organization_id, service_name, status, scheduled_at, duration_minutes FROM appointments
       WHERE id = $1 AND customer_id = $2 AND status IN ('pending', 'confirmed')
         AND scheduled_at > NOW() FOR UPDATE`,
      [request.params.id, request.user.sub],
    )
    if (!bookingResult.rowCount || !bookingResult.rows[0].service_id) throw new ApiError(409, 'This booking cannot be rescheduled.')
    const booking = bookingResult.rows[0]
    const service = await readService(client, booking.service_id, scheduledAt.slice(0, 10))
    assertServiceTime(service, scheduledAt, booking.duration_minutes)
    await lockOrganization(client, service.organization_id)
    if (await hasOverlap(client, service.organization_id, instant, booking.duration_minutes, booking.id)) {
      throw new ApiError(409, 'That time overlaps another appointment. Choose another slot.')
    }
    const assignment = await client.query('SELECT employee_user_id FROM employee_duty_assignments WHERE booking_id = $1', [booking.id])
    await client.query('DELETE FROM employee_duty_assignments WHERE booking_id = $1', [booking.id])
    const result = await client.query(
      `UPDATE appointments SET scheduled_at = $2, status = 'pending', decision_note = NULL,
         updated_at = NOW() WHERE id = $1
       RETURNING id, scheduled_at AS "scheduledAt", status`,
      [booking.id, instant],
    )
    await client.query(
      `INSERT INTO appointment_history
         (booking_id, actor_user_id, event_type, previous_status, new_status,
          previous_scheduled_at, new_scheduled_at, previous_employee_user_id)
       VALUES ($1, $2, 'rescheduled', $3, 'pending', $4, $5, $6)`,
      [booking.id, request.user.sub, booking.status, booking.scheduled_at, instant, assignment.rows[0]?.employee_user_id ?? null],
    )
    await notifyUser(client, service.owner_user_id, booking.id, `A customer rescheduled ${booking.service_name}; please review the new time.`)
    await client.query('COMMIT')
    response.json({ booking: result.rows[0], message: 'New time requested. Waiting for provider approval.' })
  } catch (error) {
    if (client) await client.query('ROLLBACK')
    next(bookingError(error))
  } finally { client?.release() }
}
