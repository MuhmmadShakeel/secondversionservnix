import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { useCompleteProviderBookingMutation, useGetProviderBookingsQuery, useReviewProviderBookingMutation } from '../../../redux/Api/booking/BookingApi.js'
import CustomerDetails from '../../booking/CustomerDetails.jsx'
import BookingHistory from '../../booking/BookingHistory.jsx'

const timeFormatter = new Intl.DateTimeFormat('en-PK', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Karachi' })
const statusStyles = {
  pending: 'bg-amber-50 text-amber-800 ring-amber-200',
  confirmed: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  completed: 'bg-sky-50 text-sky-800 ring-sky-200',
  rejected: 'bg-rose-50 text-rose-800 ring-rose-200',
  cancelled: 'bg-stone-100 text-stone-700 ring-stone-200',
  expired: 'bg-stone-100 text-stone-700 ring-stone-200',
}

export default function ProviderAppointments() {
  const [busyId, setBusyId] = useState(null)
  const [filter, setFilter] = useState('pending')
  const [reviewing, setReviewing] = useState(null)
  const [reason, setReason] = useState('')
  const { data, isLoading, error, refetch } = useGetProviderBookingsQuery(undefined, { pollingInterval: 30000, refetchOnFocus: true })
  const [reviewBooking] = useReviewProviderBookingMutation()
  const [completeBooking] = useCompleteProviderBookingMutation()
  const bookings = data?.bookings || []
  const pendingCount = bookings.filter((booking) => booking.status === 'pending').length
  const visible = filter === 'all' ? bookings : bookings.filter((booking) => booking.status === filter)

  async function decide(id, decision) {
    setBusyId(id)
    try {
      const result = await reviewBooking({ id, decision, reason: reason.trim() }).unwrap()
      toast.success(result.message)
      setReviewing(null)
      setReason('')
    } catch (reviewError) {
      toast.error(reviewError.data?.message || 'Could not update this request. Please try again.')
    } finally {
      setBusyId(null)
    }
  }

  async function complete(id) {
    setBusyId(id)
    try {
      const result = await completeBooking(id).unwrap()
      toast.success(result.message)
    } catch (completionError) {
      toast.error(completionError.data?.message || 'Could not complete this appointment.')
    } finally {
      setBusyId(null)
    }
  }

  return <div className="space-y-5">
    <div className="grid gap-3 sm:grid-cols-3">{[
      ['Pending requests', pendingCount, 'bg-amber-50 text-amber-900'],
      ['Confirmed', bookings.filter((booking) => booking.status === 'confirmed').length, 'bg-emerald-50 text-emerald-900'],
      ['Total requests', bookings.length, 'bg-rose-50 text-rose-900'],
    ].map(([label, value, tone]) => <div className={`rounded-2xl border border-white p-5 shadow-sm ${tone}`} key={label}><p className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p></div>)}</div>
    <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 bg-gradient-to-r from-rose-50 to-white px-6 py-6">
      <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-600">Your bookings</p><h2 className="mt-2 text-xl font-semibold text-slate-900">Appointment requests</h2><p className="mt-1 text-sm text-slate-600">Review customer requests for your organization. Times are shown in Pakistan Standard Time.</p></div>
      <div className="flex items-center gap-3"><span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">{pendingCount} pending</span><button className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50" type="button" onClick={refetch}>Refresh</button></div>
    </div>
    <div className="flex flex-wrap gap-2 border-b border-stone-100 px-6 py-4" aria-label="Filter appointments">{['pending', 'confirmed', 'completed', 'rejected', 'expired', 'all'].map((item) => <button className={`rounded-full px-4 py-2 text-xs font-semibold capitalize transition ${filter === item ? 'bg-rose-600 text-white' : 'bg-stone-100 text-slate-600 hover:bg-rose-50'}`} type="button" onClick={() => setFilter(item)} aria-pressed={filter === item} key={item}>{item}{item === 'pending' ? ` (${pendingCount})` : ''}</button>)}</div>
    {isLoading ? <p className="px-6 py-10 text-sm text-slate-500">Loading appointments...</p> : error ? <p className="px-6 py-10 text-sm text-rose-700">Could not load appointments. Please try again.</p> : visible.length ? <div className="divide-y divide-stone-200">{visible.map((booking) => <article className="flex flex-wrap items-center justify-between gap-5 px-6 py-5" key={booking.id}>
      <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-slate-900">{booking.serviceName}</h3><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ${statusStyles[booking.status] || statusStyles.cancelled}`}>{booking.status}</span></div><p className="mt-1 text-xs font-medium text-rose-700">{booking.organizationName}</p><p className="mt-2 text-sm text-slate-600">{booking.customerName} - {booking.customerEmail}</p><p className="mt-1 text-sm text-slate-500">{timeFormatter.format(new Date(booking.scheduledAt))} PKT · {booking.durationMinutes} min · {booking.price == null ? 'Price on request' : `Rs. ${Number(booking.price).toLocaleString()}`}</p>{booking.decisionNote && <p className="mt-2 rounded-lg bg-stone-50 px-3 py-2 text-xs text-slate-700">Note sent to customer: {booking.decisionNote}</p>}</div>
      <CustomerDetails booking={booking} />
      {booking.status === 'pending' && <div className="flex flex-wrap gap-2"><button className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-rose-100 transition hover:bg-rose-700 disabled:opacity-50" type="button" disabled={busyId === booking.id} onClick={() => { setReviewing({ id: booking.id, decision: 'confirmed' }); setReason('') }}>Approve</button><button className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-stone-50 disabled:opacity-50" type="button" disabled={busyId === booking.id} onClick={() => { setReviewing({ id: booking.id, decision: 'rejected' }); setReason('') }}>Reject</button></div>}
      {booking.canComplete && <button className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:opacity-50" type="button" disabled={busyId === booking.id} onClick={() => complete(booking.id)}>{busyId === booking.id ? 'Completing...' : 'Mark completed'}</button>}
      {reviewing?.id === booking.id && <div className="w-full rounded-xl border border-rose-100 bg-rose-50/50 p-4"><label className="block text-sm font-semibold text-rose-900">{reviewing.decision === 'confirmed' ? 'Note for the customer' : 'Why are you rejecting this request?'}<textarea className="mt-2 block w-full rounded-lg border border-rose-200 bg-white p-3 text-sm outline-none focus:border-rose-500" maxLength="500" minLength="10" rows="2" value={reason} onChange={(event) => setReason(event.target.value)} placeholder={reviewing.decision === 'confirmed' ? 'Share arrival instructions or other helpful details' : 'Give the customer a clear reason'} /></label><div className="mt-3 flex gap-3"><button className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50" type="button" disabled={reason.trim().length < 10 || busyId === booking.id} onClick={() => decide(booking.id, reviewing.decision)}>{busyId === booking.id ? 'Sending...' : reviewing.decision === 'confirmed' ? 'Approve and send note' : 'Confirm rejection'}</button><button className="text-xs font-semibold text-slate-600" type="button" onClick={() => setReviewing(null)}>Cancel</button></div></div>}
      <BookingHistory bookingId={booking.id} />
    </article>)}</div> : <div className="px-6 py-12 text-center"><p className="font-semibold text-slate-900">No {filter === 'all' ? '' : filter} requests</p><p className="mt-1 text-sm text-slate-500">Requests in this view will appear here.</p></div>}
    </section>
  </div>
}
