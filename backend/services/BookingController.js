import pool from '../common/database/connection.js'
import { ApiError } from '../common/utils/ApiError.js'
import { serviceIdPattern } from './serviceValidation.js'
import { validateBooking } from './bookingValidation.js'

const bookingColumns = `b.id, b.service_id AS "serviceId", b.buyer_user_id AS "buyerUserId",
  b.owner_user_id AS "ownerUserId", b.service_title AS "serviceTitle",
  b.agreed_price AS "agreedPrice", b.contact_phone AS "contactPhone",
  b.service_address AS "serviceAddress", b.request_details AS "requestDetails",
  b.preferred_date AS "preferredDate", b.status,
  b.created_at AS "createdAt", b.updated_at AS "updatedAt",
  buyer.name AS "buyerName", owner.name AS "ownerName"`

const bookingFrom = `FROM service_bookings b
  JOIN users buyer ON buyer.id = b.buyer_user_id
  JOIN users owner ON owner.id = b.owner_user_id`

function validId(id) {
  if (!serviceIdPattern.test(id || '')) throw new ApiError(400, 'Choose a valid booking or service.')
  return id
}

async function readBooking(id, userId) {
  const result = await pool.query(
    `SELECT ${bookingColumns} ${bookingFrom} WHERE b.id = $1 AND (b.buyer_user_id = $2 OR b.owner_user_id = $2)`,
    [id, userId],
  )
  if (!result.rowCount) throw new ApiError(404, 'Booking not found.')
  return result.rows[0]
}

export async function createBooking(request, response, next) {
  let client
  try {
    const id = validId(request.params.id)
    const details = validateBooking(request.body)
    client = await pool.connect()
    await client.query('BEGIN')
    const service = await client.query('SELECT id, owner_user_id, title, price, status FROM services WHERE id = $1 FOR UPDATE', [id])
    if (!service.rowCount || service.rows[0].status !== 'active') throw new ApiError(404, 'Active service not found.')
    if (service.rows[0].owner_user_id === request.user.id) throw new ApiError(403, 'You cannot book your own service.')
    const pending = await client.query(
      "SELECT 1 FROM service_bookings WHERE service_id = $1 AND buyer_user_id = $2 AND status = 'pending'",
      [id, request.user.id],
    )
    if (pending.rowCount) throw new ApiError(409, 'You already have a pending booking for this service.')
    const item = service.rows[0]
    const result = await client.query(
      `INSERT INTO service_bookings
       (service_id, buyer_user_id, owner_user_id, service_title, agreed_price, contact_phone, service_address, request_details, preferred_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [item.id, request.user.id, item.owner_user_id, item.title, item.price, details.contactPhone, details.serviceAddress, details.requestDetails, details.preferredDate],
    )
    await client.query('COMMIT')
    response.status(201).json({ booking: await readBooking(result.rows[0].id, request.user.id) })
  } catch (error) {
    if (client) await client.query('ROLLBACK')
    next(error.code === '23505' ? new ApiError(409, 'You already have a pending booking for this service.') : error)
  } finally { client?.release() }
}

export async function myBookings(request, response, next) {
  try {
    const result = await pool.query(`SELECT ${bookingColumns} ${bookingFrom} WHERE b.buyer_user_id = $1 ORDER BY b.created_at DESC`, [request.user.id])
    response.json({ bookings: result.rows })
  } catch (error) { next(error) }
}

export async function receivedBookings(request, response, next) {
  try {
    const result = await pool.query(`SELECT ${bookingColumns} ${bookingFrom} WHERE b.owner_user_id = $1 ORDER BY b.created_at DESC`, [request.user.id])
    response.json({ bookings: result.rows })
  } catch (error) { next(error) }
}

export async function decideBooking(request, response, next) {
  try {
    const id = validId(request.params.id)
    const status = request.body?.status
    if (!request.body || Object.keys(request.body).length !== 1 || !['approved', 'rejected'].includes(status)) {
      throw new ApiError(400, 'Choose Approve or Reject.')
    }
    const result = await pool.query(
      `UPDATE service_bookings SET status = $3, updated_at = NOW()
       WHERE id = $1 AND owner_user_id = $2 AND status = 'pending' RETURNING id`,
      [id, request.user.id, status],
    )
    if (!result.rowCount) throw new ApiError(404, 'Pending booking not found.')
    response.json({ booking: await readBooking(id, request.user.id) })
  } catch (error) { next(error) }
}

export async function cancelBooking(request, response, next) {
  try {
    const id = validId(request.params.id)
    const result = await pool.query(
      `UPDATE service_bookings SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1 AND buyer_user_id = $2 AND status = 'pending' RETURNING id`,
      [id, request.user.id],
    )
    if (!result.rowCount) throw new ApiError(404, 'Pending booking not found.')
    response.json({ booking: await readBooking(id, request.user.id) })
  } catch (error) { next(error) }
}
