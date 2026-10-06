import { Router } from 'express'
import { cancelBooking, completeBooking, createBooking, getBookingHistory, getBookingQuote, getMyBookings, getProviderBookings, rescheduleBooking, reviewBooking } from './BookingController.js'
import { allowRoles } from '../common/middleware/role.middleware.js'

const bookingRouter = Router()
bookingRouter.get('/me', allowRoles('customer'), getMyBookings)
bookingRouter.patch('/me/:id/cancel', allowRoles('customer'), cancelBooking)
bookingRouter.patch('/me/:id/reschedule', allowRoles('customer'), rescheduleBooking)
bookingRouter.get('/provider', allowRoles('service_provider'), getProviderBookings)
bookingRouter.get('/quote', allowRoles('customer'), getBookingQuote)
bookingRouter.get('/:id/history', allowRoles('customer', 'service_provider'), getBookingHistory)
bookingRouter.patch('/provider/:id/status', allowRoles('service_provider'), reviewBooking)
bookingRouter.patch('/provider/:id/complete', allowRoles('service_provider'), completeBooking)
bookingRouter.post('/', allowRoles('customer'), createBooking)

export default bookingRouter
