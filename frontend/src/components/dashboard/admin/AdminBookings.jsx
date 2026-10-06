import { useGetAdminBookingsQuery } from '../../../redux/Api/admin/AdminApi.js'
import CustomerDetails from '../../booking/CustomerDetails.jsx'

const formatter = new Intl.DateTimeFormat('en-PK', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Karachi' })

export default function AdminBookings() {
  const { data, isLoading, error, refetch } = useGetAdminBookingsQuery(undefined, { pollingInterval: 30000, refetchOnFocus: true })
  const bookings = data?.bookings || []
  return <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-rose-50 to-white p-6"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-600">Platform appointments</p><h2 className="mt-2 text-xl font-semibold">Recent bookings</h2><p className="mt-1 text-sm text-slate-500">Service requests and the contact details supplied by each customer.</p></div><button className="rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700" type="button" onClick={refetch}>Refresh</button></div>
    {isLoading ? <p className="p-6 text-sm text-slate-500">Loading bookings...</p> : error ? <p className="p-6 text-sm text-rose-700">Could not load bookings.</p> : bookings.length ? <div className="grid gap-4 p-5 lg:grid-cols-2">{bookings.map((booking) => <article className="rounded-2xl border border-stone-200 p-5" key={booking.id}><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-slate-900">{booking.serviceName}</h3><p className="mt-1 text-sm text-slate-500">{booking.organizationName}</p></div><span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold capitalize text-rose-700">{booking.status}</span></div><p className="mt-3 text-sm text-slate-600">{formatter.format(new Date(booking.scheduledAt))} PKT · {booking.durationMinutes} min</p><CustomerDetails booking={booking} /></article>)}</div> : <p className="p-8 text-sm text-slate-500">No bookings yet.</p>}
  </section>
}
