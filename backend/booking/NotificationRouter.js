import { Router } from 'express'
import pool from '../common/database/connection.js'
import { ApiError } from '../common/utils/ApiError.js'
import { uuidPattern } from './bookingSchedule.js'

const notificationRouter = Router()

notificationRouter.get('/', async (request, response, next) => {
  try {
    const result = await pool.query(
      `SELECT id, booking_id AS "bookingId", message,
         created_at AS "createdAt", read_at AS "readAt"
       FROM notifications WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 30`,
      [request.user.sub],
    )
    response.json({ notifications: result.rows })
  } catch (error) { next(error) }
})

notificationRouter.patch('/:id/read', async (request, response, next) => {
  try {
    if (!uuidPattern.test(request.params.id)) throw new ApiError(400, 'Invalid notification ID.')
    const result = await pool.query(
      'UPDATE notifications SET read_at = COALESCE(read_at, NOW()) WHERE id = $1 AND user_id = $2 RETURNING id',
      [request.params.id, request.user.sub],
    )
    if (!result.rowCount) throw new ApiError(404, 'Notification not found.')
    response.json({ message: 'Notification marked as read.' })
  } catch (error) { next(error) }
})

export default notificationRouter
