import { useState } from 'react'
import { useGetBookingHistoryQuery } from '../../redux/Api/booking/BookingApi.js'

const format = new Intl.DateTimeFormat('en-PK', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Karachi' })
const labels = { requested: 'Booking requested', confirmed: 'Approved', rejected: 'Rejected', rescheduled: 'Time changed', cancelled: 'Cancelled', expired: 'Request expired', completed: 'Completed' }

export default function BookingHistory({ bookingId }) {
  const [open, setOpen] = useState(false)
  const { data, isFetching, error } = useGetBookingHistoryQuery(bookingId, { skip: !open, refetchOnFocus: true })

  return <div className="w-full">
    <button className="text-xs font-semibold text-rose-700 hover:underline" type="button" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Hide history' : 'View history'}</button>
    {open && <div className="mt-3 rounded-xl border border-stone-200 bg-stone-50 p-4">
      {isFetching && !data ? <p className="text-xs text-slate-500">Loading history...</p> : error ? <p className="text-xs text-rose-700">Could not load history.</p> : <ol className="space-y-4 border-l-2 border-rose-200 pl-4">{data?.events?.map((event) => <li className="relative text-xs text-slate-600" key={event.id}>
        <span className="absolute -left-[23px] top-1 h-3 w-3 rounded-full border-2 border-white bg-rose-500" />
        <p className="font-semibold text-slate-900">{labels[event.eventType] || event.eventType} <span className="font-normal text-slate-500">by {event.actor}</span></p>
        <p className="mt-1">{format.format(new Date(event.createdAt))} PKT</p>
        {event.eventType === 'rescheduled' && <p className="mt-1">{format.format(new Date(event.previousScheduledAt))} → {format.format(new Date(event.newScheduledAt))} PKT</p>}
        {event.note && <p className="mt-1 text-slate-700">{event.note}</p>}
      </li>)}</ol>}
    </div>}
  </div>
}
