import pool from '../common/database/connection.js'
import { notifyUser } from './notify.js'

export async function expirePendingBookings() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await client.query(`
      WITH expired AS (
        UPDATE appointments SET status = 'expired', updated_at = NOW()
        WHERE status = 'pending' AND scheduled_at <= NOW()
        RETURNING id, customer_id, organization_id, service_name, scheduled_at
      ), history AS (
        INSERT INTO appointment_history
          (booking_id, event_type, previous_status, new_status, previous_scheduled_at, new_scheduled_at)
        SELECT id, 'expired', 'pending', 'expired', scheduled_at, scheduled_at FROM expired
        RETURNING booking_id
      )
      SELECT e.id, e.customer_id, e.service_name, o.owner_user_id
      FROM expired e
      JOIN history h ON h.booking_id = e.id
      LEFT JOIN organizations o ON o.id = e.organization_id
    `)
    for (const booking of result.rows) {
      await notifyUser(client, booking.customer_id, booking.id,
        `Your ${booking.service_name} booking request expired because it was not reviewed before the appointment time. You can book again.`)
      await notifyUser(client, booking.owner_user_id, booking.id,
        `The ${booking.service_name} booking request expired before you reviewed it.`)
    }
    await client.query('COMMIT')
    return result.rowCount
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function expirePendingBookingsBeforeRequest(_request, _response, next) {
  try {
    await expirePendingBookings()
    next()
  } catch (error) { next(error) }
}
