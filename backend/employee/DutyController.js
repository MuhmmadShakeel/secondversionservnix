import pool from '../common/database/connection.js'
import { ApiError } from '../common/utils/ApiError.js'

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function listProviderDuties(request, response, next) {
  try {
    const result = await pool.query(
      `SELECT a.id AS "bookingId", a.organization_id AS "organizationId",
         o.business_name AS "organizationName", a.service_name AS "serviceName",
         a.scheduled_at AS "scheduledAt", a.duration_minutes AS "durationMinutes",
         u.name AS "customerName", u.email AS "customerEmail",
         d.full_name AS "contactName", d.phone AS "contactPhone",
         d.address AS "contactAddress", d.city AS "contactCity",
         d.instructions AS "contactInstructions",
         duty.id AS "dutyId", duty.employee_user_id AS "employeeId",
         worker.name AS "employeeName", duty.assigned_at AS "assignedAt"
       FROM appointments a
       JOIN organizations o ON o.id = a.organization_id
       JOIN users u ON u.id = a.customer_id
       LEFT JOIN booking_customer_details d ON d.booking_id = a.id
       LEFT JOIN employee_duty_assignments duty ON duty.booking_id = a.id
       LEFT JOIN users worker ON worker.id = duty.employee_user_id
       WHERE o.owner_user_id = $1 AND a.status = 'confirmed' AND a.scheduled_at > NOW()
       ORDER BY a.scheduled_at DESC`,
      [request.user.sub],
    )
    response.json({ bookings: result.rows })
  } catch (error) { next(error) }
}

export async function assignDuty(request, response, next) {
  let client
  try {
    const { bookingId, employeeId } = request.body ?? {}
    if (!uuidPattern.test(bookingId || '')) throw new ApiError(400, 'Choose a booked service.')
    if (!uuidPattern.test(employeeId || '')) throw new ApiError(400, 'Choose an employee.')
    client = await pool.connect()
    await client.query('BEGIN')
    const bookingResult = await client.query(
      `SELECT a.id, a.organization_id, a.scheduled_at, a.duration_minutes
       FROM appointments a JOIN organizations o ON o.id = a.organization_id
       WHERE a.id = $1 AND o.owner_user_id = $2 AND a.status = 'confirmed' AND a.scheduled_at > NOW()
       FOR UPDATE OF a`,
      [bookingId, request.user.sub],
    )
    if (!bookingResult.rowCount) throw new ApiError(404, 'Confirmed booking not found for your organization.')
    const booking = bookingResult.rows[0]
    const employee = await client.query(
      `SELECT 1 FROM organization_employees link
       JOIN users u ON u.id = link.employee_user_id
       JOIN employee_profiles p ON p.user_id = u.id
       WHERE link.organization_id = $1 AND link.employee_user_id = $2
         AND link.status = 'accepted' AND u.role = 'employee'
         AND u.status <> 'suspended' AND p.phone IS NOT NULL
         AND p.city IS NOT NULL AND p.address IS NOT NULL AND p.job_title IS NOT NULL
       FOR SHARE OF link`,
      [booking.organization_id, employeeId],
    )
    if (!employee.rowCount) throw new ApiError(400, 'Choose a linked employee with a completed profile in this organization.')
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [employeeId])
    const conflict = await client.query(
      `SELECT 1 FROM employee_duty_assignments duty
       JOIN appointments booked ON booked.id = duty.booking_id
       WHERE duty.employee_user_id = $1 AND booked.id <> $2
         AND booked.status = 'confirmed'
         AND booked.scheduled_at < $3::timestamptz + $4::integer * INTERVAL '1 minute'
         AND booked.scheduled_at + booked.duration_minutes * INTERVAL '1 minute' > $3::timestamptz
       LIMIT 1`,
      [employeeId, bookingId, booking.scheduled_at, booking.duration_minutes],
    )
    if (conflict.rowCount) throw new ApiError(409, 'This employee already has a duty at that time.')
    const result = await client.query(
      `INSERT INTO employee_duty_assignments (booking_id, organization_id, employee_user_id, assigned_by_user_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (booking_id) DO UPDATE SET employee_user_id = EXCLUDED.employee_user_id,
         assigned_by_user_id = EXCLUDED.assigned_by_user_id, updated_at = NOW()
       RETURNING id, booking_id AS "bookingId", employee_user_id AS "employeeId"`,
      [bookingId, booking.organization_id, employeeId, request.user.sub],
    )
    await client.query('COMMIT')
    response.json({ duty: result.rows[0], message: 'Duty assigned to the employee.' })
  } catch (error) {
    if (client) await client.query('ROLLBACK')
    next(error)
  } finally { client?.release() }
}

export async function listEmployeeDuties(request, response, next) {
  try {
    const result = await pool.query(
      `SELECT duty.id, duty.assigned_at AS "assignedAt",
         o.business_name AS "organizationName", a.service_name AS "serviceName",
         a.scheduled_at AS "scheduledAt", a.duration_minutes AS "durationMinutes",
         u.name AS "customerName", u.email AS "customerEmail",
         d.full_name AS "contactName", d.phone AS "contactPhone",
         d.address AS "contactAddress", d.city AS "contactCity",
         d.instructions AS "contactInstructions"
       FROM employee_duty_assignments duty
       JOIN appointments a ON a.id = duty.booking_id
       JOIN organizations o ON o.id = duty.organization_id
       JOIN users u ON u.id = a.customer_id
       LEFT JOIN booking_customer_details d ON d.booking_id = a.id
       WHERE duty.employee_user_id = $1 AND a.status = 'confirmed'
       ORDER BY a.scheduled_at ASC`,
      [request.user.sub],
    )
    response.json({ duties: result.rows })
  } catch (error) { next(error) }
}
