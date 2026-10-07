import pool from '../common/database/connection.js'
import { ApiError } from '../common/utils/ApiError.js'
import { serviceIdPattern, validateService } from './serviceValidation.js'

const columns = `id, owner_user_id AS "ownerUserId", title, category, description,
  price, experience_years AS "experienceYears", status,
  created_at AS "createdAt", updated_at AS "updatedAt"`

function serviceId(request) {
  if (!serviceIdPattern.test(request.params.id)) throw new ApiError(400, 'Choose a valid service.')
  return request.params.id
}

export async function listServices(request, response, next) {
  try {
    const result = await pool.query(`SELECT ${columns} FROM services WHERE owner_user_id = $1 ORDER BY updated_at DESC`, [request.user.id])
    response.json({ services: result.rows })
  } catch (error) { next(error) }
}

export async function browseServices(_request, response, next) {
  try {
    const result = await pool.query(
      `SELECT s.id, s.owner_user_id AS "ownerUserId", u.name AS "ownerName",
       s.title, s.category, s.description, s.price,
       s.experience_years AS "experienceYears", s.status,
       s.created_at AS "createdAt", s.updated_at AS "updatedAt"
       FROM services s JOIN users u ON u.id = s.owner_user_id
       WHERE s.status = 'active' ORDER BY s.updated_at DESC`,
    )
    response.json({ services: result.rows })
  } catch (error) { next(error) }
}

export async function getService(request, response, next) {
  try {
    const result = await pool.query(`SELECT ${columns} FROM services WHERE id = $1 AND owner_user_id = $2`, [serviceId(request), request.user.id])
    if (!result.rowCount) throw new ApiError(404, 'Service not found.')
    response.json({ service: result.rows[0] })
  } catch (error) { next(error) }
}

export async function createService(request, response, next) {
  try {
    const service = validateService(request.body)
    const result = await pool.query(
      `INSERT INTO services (owner_user_id, title, category, description, price, experience_years, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING ${columns}`,
      [request.user.id, service.title, service.category, service.description, service.price, service.experienceYears, service.status],
    )
    response.status(201).json({ service: result.rows[0] })
  } catch (error) { next(error) }
}

export async function updateService(request, response, next) {
  try {
    const id = serviceId(request)
    const service = validateService(request.body)
    const result = await pool.query(
      `UPDATE services SET title = $3, category = $4, description = $5, price = $6,
       experience_years = $7, status = $8, updated_at = NOW()
       WHERE id = $1 AND owner_user_id = $2 RETURNING ${columns}`,
      [id, request.user.id, service.title, service.category, service.description, service.price, service.experienceYears, service.status],
    )
    if (!result.rowCount) throw new ApiError(404, 'Service not found.')
    response.json({ service: result.rows[0] })
  } catch (error) { next(error) }
}

export async function deleteService(request, response, next) {
  try {
    const id = serviceId(request)
    const owned = await pool.query('SELECT 1 FROM services WHERE id = $1 AND owner_user_id = $2', [id, request.user.id])
    if (!owned.rowCount) throw new ApiError(404, 'Service not found.')
    const booked = await pool.query('SELECT 1 FROM service_bookings WHERE service_id = $1 LIMIT 1', [id])
    if (booked.rowCount) throw new ApiError(409, 'This service has booking history. Change it to Draft instead of deleting it.')
    const result = await pool.query('DELETE FROM services WHERE id = $1 AND owner_user_id = $2 RETURNING id', [id, request.user.id])
    if (!result.rowCount) throw new ApiError(404, 'Service not found.')
    response.status(204).end()
  } catch (error) {
    next(error.code === '23503' ? new ApiError(409, 'This service has booking history. Change it to Draft instead of deleting it.') : error)
  }
}
