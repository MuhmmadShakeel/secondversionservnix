import { Router } from 'express'
import { browseServices, createService, deleteService, getService, listServices, updateService } from './ServiceController.js'
import { cancelBooking, createBooking, decideBooking, myBookings, receivedBookings } from './BookingController.js'

const router = Router()
router.get('/', listServices)
router.post('/', createService)
router.get('/browse', browseServices)
router.get('/bookings/mine', myBookings)
router.get('/bookings/received', receivedBookings)
router.patch('/bookings/:id/decision', decideBooking)
router.patch('/bookings/:id/cancel', cancelBooking)
router.post('/:id/bookings', createBooking)
router.get('/:id', getService)
router.put('/:id', updateService)
router.delete('/:id', deleteService)

export default router
