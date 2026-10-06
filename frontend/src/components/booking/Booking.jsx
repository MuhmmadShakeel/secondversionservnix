import { useState } from 'react'

const field = 'mt-2 w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-100'

export default function Booking({ user, service, scheduledAt, durationMinutes, quote, busy, onBack, onSubmit }) {
  const [details, setDetails] = useState({ fullName: user?.name || '', phone: '', address: '', city: '', instructions: '' })
  const update = (key) => (event) => setDetails((current) => ({ ...current, [key]: event.target.value }))

  return <form className="overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-xl shadow-rose-100/40" onSubmit={(event) => { event.preventDefault(); onSubmit(details) }}>
    <div className="bg-gradient-to-r from-rose-600 to-pink-500 px-7 py-7 text-white sm:px-9">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-100">Final step</p>
      <h2 className="mt-2 text-2xl font-semibold">Who should the provider contact?</h2>
      <p className="mt-2 text-sm text-rose-50">Share the details needed to prepare for your appointment.</p>
    </div>
    <div className="grid gap-5 p-7 sm:grid-cols-2 sm:p-9">
      <div className="rounded-2xl bg-rose-50 p-4 text-sm sm:col-span-2"><p className="font-semibold text-rose-900">{service.name} · {service.organization.businessName}</p><p className="mt-1 text-rose-700">{new Intl.DateTimeFormat('en-PK', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Karachi' }).format(new Date(`${scheduledAt}+05:00`))} PKT · {durationMinutes} minutes</p><p className="mt-1 font-semibold text-rose-900">Estimated service amount: {quote.price == null ? 'Price on request' : `Rs. ${Number(quote.price).toLocaleString()}`}</p></div>
      <label className="text-sm font-semibold text-slate-700">Full name<input className={field} autoComplete="name" maxLength="120" minLength="2" required value={details.fullName} onChange={update('fullName')} /></label>
      <label className="text-sm font-semibold text-slate-700">Phone number<input className={field} type="tel" autoComplete="tel" inputMode="tel" pattern="[+0-9() -]{7,30}" maxLength="30" required placeholder="03XX XXXXXXX" value={details.phone} onChange={update('phone')} /></label>
      <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Service address<input className={field} autoComplete="street-address" maxLength="300" minLength="5" required placeholder="House, street, area" value={details.address} onChange={update('address')} /></label>
      <label className="text-sm font-semibold text-slate-700">City<input className={field} autoComplete="address-level2" maxLength="100" minLength="2" required value={details.city} onChange={update('city')} /></label>
      <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Anything the provider should know? <span className="font-normal text-slate-400">Optional</span><textarea className={field} rows="3" maxLength="500" placeholder="Landmark, access instructions, or a short service note" value={details.instructions} onChange={update('instructions')} /></label>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-5 sm:col-span-2"><button className="rounded-xl border border-stone-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-stone-50" type="button" onClick={onBack}>Back to times</button><button className="rounded-xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50" disabled={busy}>{busy ? 'Requesting...' : 'Request appointment'}</button></div>
    </div>
  </form>
}
