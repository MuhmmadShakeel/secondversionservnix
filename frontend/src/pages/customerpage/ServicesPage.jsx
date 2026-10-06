import { useState } from 'react'
import { toast } from 'react-hot-toast'
import Navbar from '../../components/common/Navbar'
import Footer from '../../components/common/Footer'
import { useGetPublicOrganizationsQuery } from '../../redux/Api/service-provider/OrganizationApi.js'
import { useGetAvailableSlotsQuery, useGetBookingQuoteQuery, useGetMyBookingsQuery } from '../../redux/Api/booking/BookingApi.js'
import BookingPage from './BookingPage.jsx'

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const field = 'w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-100'
const todayInPakistan = () => new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString().slice(0, 10)
const priceLabel = (price, minutes) => price == null ? 'Price on request' : `Rs. ${Number(price).toLocaleString()} / ${minutes} min`
const timeLabel = (slot) => new Intl.DateTimeFormat('en-PK', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' }).format(new Date(`${slot}+05:00`))

export default function ServicesPage({ user, onHome, onSignup, onLogin, onLogout, onDashboard, onProfile, onRequireLogin }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [date, setDate] = useState(todayInPakistan)
  const [selectedSlot, setSelectedSlot] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [manualTime, setManualTime] = useState('')
  const { data, isLoading, error, refetch } = useGetPublicOrganizationsQuery(undefined, { pollingInterval: 30000 })
  const { data: bookingsData } = useGetMyBookingsQuery(undefined, { skip: user?.role !== 'customer', pollingInterval: 30000, refetchOnFocus: true })
  const validDuration = Number.isInteger(Number(durationMinutes)) && Number(durationMinutes) >= 15 && Number(durationMinutes) <= 480
  const { data: slotsData, isFetching: slotsLoading, error: slotsError } = useGetAvailableSlotsQuery({ serviceId: selected?.id, date, durationMinutes }, { skip: !selected || !date || !validDuration, pollingInterval: 30000, refetchOnFocus: true })
  const { data: quote, isFetching: quoteLoading, error: quoteError } = useGetBookingQuoteQuery({ serviceId: selected?.id, scheduledAt: selectedSlot, durationMinutes }, { skip: !selected || !selectedSlot || !validDuration, refetchOnFocus: true, pollingInterval: 30000 })
  const [showDetails, setShowDetails] = useState(false)
  const bookedServices = new Set((bookingsData?.bookings || []).filter((booking) => ['pending', 'confirmed'].includes(booking.status)).map((booking) => booking.serviceId).filter(Boolean))
  const services = (data?.organizations || []).flatMap((organization) => organization.services.map((service) => ({ ...service, organization })))
  const visible = services.filter((service) => `${service.name} ${service.organization.businessName} ${service.organization.address}`.toLowerCase().includes(search.toLowerCase()))

  function choose(service) {
    if (!user) { onRequireLogin(); return }
    if (user.role !== 'customer') { toast.error('Sign in with a customer account to book a service.'); return }
    setSelected(service)
    setDurationMinutes(service.durationMinutes)
    setManualTime('')
    setDate(todayInPakistan())
    setSelectedSlot('')
    setShowDetails(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }


  return <>
    <Navbar user={user} onHome={onHome} onSignup={onSignup} onLogin={onLogin} onLogout={onLogout} onDashboard={onDashboard} onServices={() => window.scrollTo({ top: 0, behavior: 'smooth' })} onProfile={onProfile} />
    <main className="min-h-screen bg-[#fbf8f9] px-5 py-12 text-slate-900 sm:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-3xl border border-rose-100 bg-gradient-to-br from-white via-white to-rose-50 px-7 py-10 sm:px-10"><p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-600">Servnix marketplace</p><h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Find the right service.</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">Explore approved local providers, compare their services, and choose an available appointment time.</p><p className="mt-5 text-xs font-semibold text-rose-700">{services.length} services available</p></div>
        {selected && !showDetails && <section className="mb-8 rounded-2xl border border-rose-200 bg-white p-6 shadow-sm sm:p-8"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-600">Request an appointment</p><h2 className="mt-2 text-2xl font-semibold">{selected.name}</h2><p className="mt-1 text-sm text-slate-600">{selected.organization.businessName} | {selected.durationMinutes} min | {priceLabel(selected.price, selected.durationMinutes)}</p></div><button className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-stone-50" type="button" onClick={() => setSelected(null)}>Close</button></div>
          <p className="mt-5 text-xs text-slate-500">Opening hours: {selected.organization.availability.map((slot) => `${dayNames[slot.dayOfWeek]} ${slot.startTime}-${slot.endTime}`).join(' | ')}</p>
          <div className="mt-6"><div className="grid gap-4 sm:grid-cols-2"><label className="block max-w-xs text-sm font-semibold">Choose a date<input className={`${field} mt-2`} type="date" min={todayInPakistan()} value={date} onChange={(event) => { setDate(event.target.value); setSelectedSlot(''); setManualTime('') }} required /></label><label className="block max-w-xs text-sm font-semibold">How many minutes?<input className={`${field} mt-2`} type="number" min="15" max="480" step="1" value={durationMinutes} onChange={(event) => { setDurationMinutes(event.target.value); setSelectedSlot(manualTime ? `${date}T${manualTime}` : '') }} required /></label></div>
            <p className="mt-6 text-sm font-semibold">Available times <span className="font-normal text-slate-500">(Pakistan Standard Time)</span></p>
            {slotsLoading ? <p className="mt-3 text-sm text-slate-500">Checking availability...</p> : slotsError ? <p className="mt-3 text-sm text-rose-700">Could not load times. Try another date.</p> : slotsData?.slots?.length ? <div className="mt-3 flex flex-wrap gap-2">{slotsData.slots.map((slot) => <button className={`rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${selectedSlot === slot ? 'border-rose-600 bg-rose-600 text-white' : 'border-rose-200 bg-rose-50 text-rose-800 hover:border-rose-400'}`} type="button" onClick={() => { setSelectedSlot(slot); setManualTime('') }} aria-pressed={selectedSlot === slot} key={slot}>{timeLabel(slot)}</button>)}</div> : <p className="mt-3 text-sm text-slate-500">No preset times available. You can try a manual time.</p>}
            <label className="mt-5 block max-w-xs text-sm font-semibold">Or enter a start time manually (PKT)<input className={`${field} mt-2`} type="time" step="60" value={manualTime} onChange={(event) => { setManualTime(event.target.value); setSelectedSlot(event.target.value ? `${date}T${event.target.value}` : '') }} /></label>
            {selectedSlot && (quoteLoading ? <p className="mt-4 text-sm text-slate-500">Checking time and amount...</p> : quoteError ? <p className="mt-4 text-sm text-rose-700">{quoteError.data?.message || 'Could not check this time.'}</p> : quote && <p className={`mt-4 text-sm font-semibold ${quote.available ? 'text-emerald-800' : 'text-rose-700'}`}>{quote.available ? `Available · ${durationMinutes} min · ${quote.price == null ? 'Price on request' : `Estimated amount Rs. ${Number(quote.price).toLocaleString()}`}` : 'This time overlaps another appointment. Choose a different time.'}</p>)}
            <div className="mt-7 flex flex-wrap items-center gap-4"><button className="rounded-lg bg-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-rose-100 hover:bg-rose-700 disabled:opacity-50" type="button" onClick={() => setShowDetails(true)} disabled={!selectedSlot || !quote?.available || quoteLoading || !validDuration}>Continue to details</button><span className="text-xs text-slate-500">Your request starts as pending until the provider approves it.</span></div>
          </div>
        </section>}
        {selected && showDetails && <div className="mb-8"><BookingPage user={user} service={selected} scheduledAt={selectedSlot} durationMinutes={Number(durationMinutes)} quote={quote} onBack={() => setShowDetails(false)} onComplete={() => { setSelected(null); setShowDetails(false); onProfile() }} /></div>}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><label className="block w-full max-w-xl"><span className="mb-2 block text-sm font-semibold text-slate-700">Search services</span><input className={field} type="search" placeholder="Service, provider, or location" value={search} onChange={(event) => setSearch(event.target.value)} /></label><button className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-stone-50" type="button" onClick={refetch}>Refresh services</button></div>
        {isLoading && <div className="rounded-xl border border-stone-200 bg-white p-8 text-sm text-slate-500">Loading services...</div>}
        {error && <div className="rounded-xl border border-rose-200 bg-white p-8 text-sm text-rose-700">Could not load services. Please try again.</div>}
        {!isLoading && !error && (visible.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{visible.map((service) => <article className="flex flex-col rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-rose-200 hover:shadow-lg hover:shadow-rose-100/60" key={service.id}>
          <div className="flex items-center justify-between gap-3"><p className="text-xs font-bold uppercase tracking-[0.14em] text-rose-600">{service.organization.businessName}</p>{service.organization.averageRating && <span className="text-xs font-semibold text-amber-700">★ {service.organization.averageRating} ({service.organization.reviewCount})</span>}</div><h2 className="mt-4 text-xl font-semibold">{service.name}</h2><p className="mt-2 text-sm text-slate-500">{service.organization.address}</p><div className="mt-auto flex items-center justify-between gap-3 border-t border-stone-100 pt-6 mt-7"><div><p className="text-sm font-semibold">{priceLabel(service.price, service.durationMinutes)}</p><p className="mt-1 text-xs text-slate-500">{service.durationMinutes} minutes</p></div><button className="rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:bg-stone-100 disabled:text-stone-500" type="button" disabled={bookedServices.has(service.id)} onClick={() => choose(service)}>{bookedServices.has(service.id) ? 'Active booking' : user ? 'View times' : 'Log in to book'}</button></div>
        </article>)}</div> : <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center text-sm text-slate-500">No services match your search.</div>)}
      </div>
    </main>
    <Footer />
  </>
}

