import { Router } from 'express'
import pool from '../common/database/connection.js'
import { ApiError } from '../common/utils/ApiError.js'
import { authenticate } from '../common/middleware/auth.middleware.js'
import { allowRoles } from '../common/middleware/role.middleware.js'
import { uuidPattern } from '../booking/bookingSchedule.js'

const reviewRouter = Router()

reviewRouter.get('/organization/:id', async (request, response, next) => {
  try {
    if (!uuidPattern.test(request.params.id)) throw new ApiError(400, 'Invalid organization ID.')
    const result = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.created_at AS "createdAt", u.name AS "customerName"
       FROM organization_reviews r JOIN users u ON u.id = r.customer_id
       JOIN organizations o ON o.id = r.organization_id
       WHERE r.organization_id = $1 AND o.status = 'approved'
       ORDER BY r.created_at DESC LIMIT 50`,
      [request.params.id],
    )
    response.json({ reviews: result.rows })
  } catch (error) { next(error) }
})

reviewRouter.post('/', authenticate, allowRoles('customer'), async (request, response, next) => {
  try {
    const { bookingId, rating, comment = '' } = request.body ?? {}
    if (!uuidPattern.test(bookingId || '')) throw new ApiError(400, 'Invalid booking ID.')
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new ApiError(400, 'Choose a rating from 1 to 5.')
    if (typeof comment !== 'string' || comment.trim().length > 1000) throw new ApiError(400, 'Review must be under 1,000 characters.')
    const result = await pool.query(
      `INSERT INTO organization_reviews (booking_id, organization_id, customer_id, rating, comment)
       SELECT a.id, a.organization_id, a.customer_id, $3, $4
       FROM appointments a WHERE a.id = $1 AND a.customer_id = $2
         AND a.status = 'completed' AND a.organization_id IS NOT NULL
       RETURNING id`,
      [bookingId, request.user.sub, rating, comment.trim()],
    )
    if (!result.rowCount) throw new ApiError(409, 'Reviews are available after the provider marks the appointment completed.')
    response.status(201).json({ review: result.rows[0], message: 'Thank you for your review.' })
  } catch (error) {
    next(error.constraint === 'organization_reviews_booking_id_key' ? new ApiError(409, 'You have already reviewed this booking.') : error)
  }
})

export default reviewRouter
