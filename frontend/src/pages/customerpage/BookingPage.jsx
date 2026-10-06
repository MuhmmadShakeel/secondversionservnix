import { toast } from 'react-hot-toast'
import Booking from '../../components/booking/Booking.jsx'
import { useCreateBookingMutation } from '../../redux/Api/booking/BookingApi.js'

export default function BookingPage({ user, service, scheduledAt, durationMinutes, quote, onBack, onComplete }) {
  const [createBooking, { isLoading }] = useCreateBookingMutation()

  async function submit(customerDetails) {
    try {
      await createBooking({ serviceId: service.id, scheduledAt, durationMinutes, customerDetails }).unwrap()
      toast.success('Appointment requested. Your provider will review it.')
      onComplete()
    } catch (error) {
      toast.error(error.data?.message || 'Could not book this service. Please choose another time.')
    }
  }

  return <Booking user={user} service={service} scheduledAt={scheduledAt} durationMinutes={durationMinutes} quote={quote} busy={isLoading} onBack={onBack} onSubmit={submit} />
}
