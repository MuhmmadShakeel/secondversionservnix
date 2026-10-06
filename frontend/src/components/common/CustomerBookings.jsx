import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { useCancelBookingMutation, useGetAvailableSlotsQuery, useGetMyBookingsQuery, useRescheduleBookingMutation } from '../../redux/Api/booking/BookingApi.js'
import { useCreateReviewMutation } from '../../redux/Api/review/ReviewApi.js'
import BookingHistory from '../booking/BookingHistory.jsx'

const formatter = new Intl.DateTimeFormat('en-PK', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Karachi' })
const statusStyles = { pending: 'bg-amber-50 text-amber-800', confirmed: 'bg-emerald-50 text-emerald-800', completed: 'bg-sky-50 text-sky-800', rejected: 'bg-rose-50 text-rose-800', cancelled: 'bg-stone-100 text-stone-700', expired: 'bg-stone-100 text-stone-700' }
const todayInPakistan = () => new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString().slice(0, 10)
const timeLabel = (slot) => new Intl.DateTimeFormat('en-PK', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' }).format(new Date(`${slot}+05:00`))

function BookingRow({ booking }) {
  const [mode, setMode] = useState(null)
  const [date, setDate] = useState(todayInPakistan)
  const [slot, setSlot] = useState('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const { data: slotsData, isFetching: slotsLoading, error: slotsError } = useGetAvailableSlotsQuery({ serviceId: booking.serviceId, date, durationMinutes: booking.durationMinutes }, { skip: mode !== 'reschedule' || !booking.serviceId, pollingInterval: 30000, refetchOnFocus: true })
  const [cancelBooking, cancelState] = useCancelBookingMutation()
  const [rescheduleBooking, rescheduleState] = useRescheduleBookingMutation()
  const [createReview, reviewState] = useCreateReviewMutation()
  const upcoming = new Date(booking.scheduledAt) > new Date()
  const active = ['pending', 'confirmed'].includes(booking.status)
  const canReview = booking.canReview && !booking.reviewRating

  async function cancel() {
    try { const result = await cancelBooking(booking.id).unwrap(); toast.success(result.message); setMode(null) }
    catch (error) { toast.error(error.data?.message || 'Could not cancel this booking.') }
  }

  async function reschedule(event) {
    event.preventDefault()
    if (!slot) return
    try { const result = await rescheduleBooking({ id: booking.id, scheduledAt: slot }).unwrap(); toast.success(result.message); setMode(null) }
    catch (error) { toast.error(error.data?.message || 'Could not request a new time.') }
  }

  async function review(event) {
    event.preventDefault()
    try { const result = await createReview({ bookingId: booking.id, rating: Number(rating), comment }).unwrap(); toast.success(result.message); setMode(null) }
    catch (error) { toast.error(error.data?.message || 'Could not submit the review.') }
  }

  return <article className="px-6 py-5">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-semibold text-slate-900">{booking.serviceName}</p><p className="mt-1 text-sm text-slate-500">{booking.organizationName}</p><p className="mt-2 text-sm text-slate-700">{formatter.format(new Date(booking.scheduledAt))} PKT | {booking.durationMinutes} min | {booking.price == null ? 'Price on request' : `Rs. ${Number(booking.price).toLocaleString()}`}</p>{booking.decisionNote && <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-800">Provider note: {booking.decisionNote}</p>}</div><span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyles[booking.status] || statusStyles.cancelled}`}>{booking.status}</span></div>
    {booking.status === 'expired' && <p className="mt-3 text-xs text-slate-600">The provider did not review this request before its start time. You can book this service again.</p>}
    <div className="mt-4 flex flex-wrap gap-2">{active && upcoming && <><button className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50" type="button" onClick={() => setMode(mode === 'reschedule' ? null : 'reschedule')}>Change time</button><button className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-stone-50" type="button" onClick={() => setMode(mode === 'cancel' ? null : 'cancel')}>Cancel booking</button></>}{canReview && <button className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50" type="button" onClick={() => setMode(mode === 'review' ? null : 'review')}>Write a review</button>}{booking.reviewRating && <span className="text-xs font-semibold text-amber-700">Your rating: {booking.reviewRating}/5</span>}</div>
    {mode === 'cancel' && <div className="mt-4 rounded-xl bg-stone-50 p-4"><p className="text-sm text-slate-700">Cancel this appointment? Its time will become available again.</p><div className="mt-3 flex gap-2"><button className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50" type="button" disabled={cancelState.isLoading} onClick={cancel}>Confirm cancellation</button><button className="text-xs font-semibold text-slate-600" type="button" onClick={() => setMode(null)}>Keep booking</button></div></div>}
    {mode === 'reschedule' && <form className="mt-4 rounded-xl border border-rose-100 bg-rose-50/40 p-4" onSubmit={reschedule}><label className="text-sm font-semibold">Choose a new date<input className="mt-2 block rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm" type="date" min={todayInPakistan()} value={date} onChange={(event) => { setDate(event.target.value); setSlot('') }} required /></label><div className="mt-3 flex flex-wrap gap-2">{slotsLoading ? <p className="text-sm text-slate-500">Checking times...</p> : slotsError ? <p className="text-sm text-rose-700">Could not load times. Try another date.</p> : slotsData?.slots?.length ? slotsData.slots.map((item) => <button className={`rounded-lg border px-3 py-2 text-xs font-semibold ${slot === item ? 'border-rose-600 bg-rose-600 text-white' : 'border-rose-200 bg-white text-rose-700'}`} type="button" onClick={() => setSlot(item)} key={item}>{timeLabel(item)}</button>) : <p className="text-sm text-slate-500">No free times on this date.</p>}</div><button className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50" disabled={!slot || rescheduleState.isLoading}>Request new time</button></form>}
    {mode === 'review' && <form className="mt-4 grid gap-3 rounded-xl border border-rose-100 bg-rose-50/40 p-4" onSubmit={review}><label className="text-sm font-semibold">Rating<select className="ml-3 rounded-lg border border-stone-200 bg-white px-3 py-2" value={rating} onChange={(event) => setRating(event.target.value)}>{[5, 4, 3, 2, 1].map((value) => <option value={value} key={value}>{value} stars</option>)}</select></label><label className="text-sm font-semibold">Your experience<textarea className="mt-2 block w-full rounded-lg border border-stone-200 bg-white p-3 text-sm" maxLength="1000" rows="3" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="What went well?" /></label><button className="w-fit rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50" disabled={reviewState.isLoading}>Post review</button></form>}
    <div className="mt-4"><BookingHistory bookingId={booking.id} /></div>
  </article>
}

export default function CustomerBookings({ onServices }) {
  const { data, isLoading, error } = useGetMyBookingsQuery(undefined, { pollingInterval: 30000, refetchOnFocus: true })
  const bookings = data?.bookings || []
  return <section className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"><div className="border-b border-stone-200 px-6 py-5"><h2 className="text-xl font-semibold">My appointments</h2><p className="mt-1 text-sm text-slate-500">Track requests, change a time, or review a completed service.</p></div>{isLoading ? <p className="px-6 py-8 text-sm text-slate-500">Loading appointments...</p> : error ? <p className="px-6 py-8 text-sm text-rose-700">Could not load appointments.</p> : bookings.length ? <div className="divide-y divide-stone-200">{bookings.map((booking) => <BookingRow booking={booking} key={booking.id} />)}</div> : <div className="px-6 py-12 text-center"><p className="font-semibold">No appointments yet</p><p className="mt-2 text-sm text-slate-500">Your requests will appear here after you book.</p><button className="mt-4 text-sm font-semibold text-rose-700 underline" type="button" onClick={onServices}>Find a service</button></div>}</section>
}

