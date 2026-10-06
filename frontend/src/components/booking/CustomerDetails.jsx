export default function CustomerDetails({ booking }) {
  return <div className="mt-4 w-full rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50/80 to-white p-4">
    <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-600">Customer details</p>
    <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
      <div><p className="text-xs text-slate-500">Contact</p><p className="font-semibold text-slate-900">{booking.contactName || booking.customerName}</p><a className="text-rose-700 hover:underline" href={`mailto:${booking.customerEmail}`}>{booking.customerEmail}</a></div>
      <div><p className="text-xs text-slate-500">Phone</p>{booking.contactPhone ? <a className="font-semibold text-rose-700 hover:underline" href={`tel:${booking.contactPhone}`}>{booking.contactPhone}</a> : <p className="text-slate-500">Not provided</p>}</div>
      <div className="sm:col-span-2"><p className="text-xs text-slate-500">Service address</p><p className="text-slate-800">{[booking.contactAddress, booking.contactCity].filter(Boolean).join(', ') || 'Not provided for this booking'}</p></div>
      {booking.contactInstructions && <div className="sm:col-span-2"><p className="text-xs text-slate-500">Appointment notes</p><p className="whitespace-pre-wrap text-slate-800">{booking.contactInstructions}</p></div>}
    </div>
  </div>
}
