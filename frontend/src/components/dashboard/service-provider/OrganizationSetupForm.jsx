import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { useCreateOrganizationMutation, useDeleteOrganizationMutation, useGetMyOrganizationsQuery, useUpdateOrganizationMutation } from '../../../redux/Api/service-provider/OrganizationApi.js'
import { getStoredUser } from '../../../redux/Api/auth/AuthApi.js'

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const blankService = () => ({ name: '', durationMinutes: 60, price: '' })
const defaultAvailability = () => days.map((day, dayOfWeek) => ({ day, dayOfWeek, active: dayOfWeek > 0 && dayOfWeek < 6, startTime: '09:00', endTime: '18:00' }))
const field = 'w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-100'

function OrganizationForm({ organization, organizations, selectOrganization, editOrganization, editingId, detailId, showOrganizationDetails, requestDelete, loadError, refetch, isFetching }) {
  const [createOrganization, createState] = useCreateOrganizationMutation()
  const [updateOrganization, updateState] = useUpdateOrganizationMutation()
  const [showForm, setShowForm] = useState(editingId === organization?.id)
  const [creating, setCreating] = useState(false)
  const [showDetails, setShowDetails] = useState(detailId === organization?.id)
  const [details, setDetails] = useState(() => ({ businessName: organization?.businessName || '', email: organization?.email || getStoredUser()?.email || '', phone: organization?.phone || '', address: organization?.address || '', description: organization?.description || '' }))
  const [services, setServices] = useState(() => organization?.services?.length ? organization.services.map(({ id, name, durationMinutes, price }) => ({ id, name, durationMinutes, price: price ?? '' })) : [blankService()])
  const [availability, setAvailability] = useState(() => organization
    ? defaultAvailability().map((day) => {
      const saved = organization.availability?.find((slot) => slot.dayOfWeek === day.dayOfWeek)
      return saved ? { ...day, active: true, startTime: saved.startTime, endTime: saved.endTime } : { ...day, active: false }
    })
    : defaultAvailability())

  const changeService = (index, key, value) => setServices((current) => current.map((item, at) => at === index ? { ...item, [key]: value } : item))
  const changeDay = (index, key, value) => setAvailability((current) => current.map((item, at) => at === index ? { ...item, [key]: value } : item))

  function openForm(newOrganization = false) {
    setCreating(newOrganization)
    if (newOrganization) {
      setDetails({ businessName: '', email: getStoredUser()?.email || '', phone: '', address: '', description: '' })
      setServices([blankService()])
      setAvailability(defaultAvailability())
    }
    setShowForm(true)
    requestAnimationFrame(() => document.getElementById('organization-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  async function submit(event) {
    event.preventDefault()
    const body = {
      ...details,
      services: services.map((item) => ({ ...(item.id ? { id: item.id } : {}), name: item.name, durationMinutes: Number(item.durationMinutes), price: item.price === '' ? '' : Number(item.price) })),
      availability: availability.filter((item) => item.active).map(({ dayOfWeek, startTime, endTime }) => ({ dayOfWeek, startTime, endTime })),
    }
    try {
      const result = await (organization && !creating ? updateOrganization({ id: organization.id, body }) : createOrganization(body)).unwrap()
      toast.success(result.message || 'Organization saved.')
      setShowForm(false)
      if (creating) selectOrganization(result.organization.id)
      editOrganization(null)
    } catch (saveError) {
      toast.error(saveError.data?.message || 'Could not save the organization. Check your connection and try again.')
    }
  }

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Organization workspace</p><h2 className="mt-2 text-xl font-semibold text-slate-900">Your organizations</h2><p className="mt-1 text-sm text-slate-500">Manage each business, its services, and opening hours.</p></div>
      <button className="rounded-lg bg-rose-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-rose-200 transition hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600" type="button" onClick={() => openForm(true)}>+ Create organization</button>
    </div>
    {loadError && <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4"><div><p className="font-semibold text-amber-950">Could not load organization data</p><p className="mt-1 text-sm text-amber-900">The backend may be unavailable. You can fill in the form, then try saving when it reconnects.</p></div><button className="rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-950 disabled:opacity-50" type="button" onClick={refetch} disabled={isFetching}>{isFetching ? 'Retrying...' : 'Retry connection'}</button></div>}
    <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="border-b border-stone-200 px-6 py-5"><h3 className="text-lg font-semibold">Organization list</h3><p className="mt-1 text-sm text-slate-500">Your business record and its current status.</p></div>
<div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-stone-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-6 py-4 font-semibold">Organization</th><th className="px-6 py-4 font-semibold">Status</th><th className="px-6 py-4 font-semibold">Services</th><th className="px-6 py-4 font-semibold">Open days</th><th className="px-6 py-4 text-right font-semibold">Action</th></tr></thead><tbody>{organizations.length ? organizations.map((item) => <tr className="border-t border-stone-100" key={item.id}><td className="px-6 py-5"><p className="font-semibold text-slate-900">{item.businessName}</p><p className="mt-1 text-xs text-slate-500">{item.email}</p></td><td className="px-6 py-5"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">{item.status}</span></td><td className="px-6 py-5">{item.services?.length || 0}</td><td className="px-6 py-5">{item.availability?.length || 0}</td><td className="px-6 py-5 text-right"><div className="flex justify-end gap-2"><button className="rounded-lg border border-stone-300 px-3 py-2 font-semibold text-slate-800 hover:bg-stone-50" type="button" onClick={() => { showOrganizationDetails(item.id); editOrganization(null); selectOrganization(item.id); setShowDetails(true) }}>Details</button><button className="rounded-lg border border-rose-200 px-3 py-2 font-semibold text-rose-700 hover:bg-rose-50" type="button" onClick={() => { showOrganizationDetails(null); editOrganization(item.id); selectOrganization(item.id); if (item.id === organization?.id) openForm(false) }}>Edit</button><button className="rounded-lg border border-red-200 px-3 py-2 font-semibold text-red-700 transition hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600" type="button" aria-label={`Delete ${item.businessName}`} onClick={() => requestDelete({ id: item.id, businessName: item.businessName })}>Delete</button></div></td></tr>) : <tr><td className="px-6 py-10 text-center text-slate-500" colSpan="5">No organization yet. Use Create organization to add one.</td></tr>}</tbody></table></div>
    </section>
    {organization && showDetails && <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Organization details</p><h3 className="mt-2 text-2xl font-semibold">{organization.businessName}</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{organization.description || 'No description added yet.'}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">{organization.status}</span></div>
      <div className="mt-6 grid gap-4 border-y border-stone-200 py-5 text-sm sm:grid-cols-2"><div><p className="text-xs font-semibold uppercase text-slate-400">Email</p><p className="mt-1">{organization.email}</p></div><div><p className="text-xs font-semibold uppercase text-slate-400">Phone</p><p className="mt-1">{organization.phone}</p></div><div className="sm:col-span-2"><p className="text-xs font-semibold uppercase text-slate-400">Address</p><p className="mt-1">{organization.address}</p></div></div>
      <h4 className="mt-6 font-semibold">Services</h4><div className="mt-3 divide-y divide-stone-100 rounded-lg border border-stone-200">{organization.services?.map((service) => <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm" key={service.id}><span className="font-medium">{service.name}</span><span className="text-slate-500">{service.durationMinutes} min | {service.price == null ? 'Price on request' : `Rs. ${Number(service.price).toLocaleString()}`}</span></div>)}</div>
      <h4 className="mt-6 font-semibold">Opening hours</h4><div className="mt-3 flex flex-wrap gap-2">{organization.availability?.map((slot) => <span className="rounded-lg bg-stone-100 px-3 py-2 text-xs font-medium" key={slot.dayOfWeek}>{days[slot.dayOfWeek]} | {slot.startTime}-{slot.endTime}</span>)}</div>
      {organization.status === 'pending' && <p className="mt-6 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Awaiting admin approval. Customers will see your services after approval.</p>}
      <button className="mt-6 rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50" type="button" onClick={() => openForm(false)}>Edit organization</button>
    </section>}
    {showForm && <form id="organization-form" className="scroll-mt-8 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-lg shadow-stone-200/60" onSubmit={submit}>
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 px-6 py-6 sm:px-8">
      <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Your business</p><h2 className="mt-2 text-xl font-semibold text-slate-900">{organization && !creating ? organization.businessName : 'Create your organization'}</h2><p className="mt-1 text-sm text-slate-500">Set up services and opening hours for this organization.</p></div>
      {organization && !creating && <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">{organization.status}</span>}
    </div>
    <div className="space-y-10 px-6 py-8 sm:px-8">
      <section><div className="mb-5"><h3 className="text-base font-semibold">Organization details</h3><p className="mt-1 text-sm text-slate-500">The information customers will see about your business.</p></div>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium">Business name<input className={field} required value={details.businessName} onChange={(event) => setDetails({ ...details, businessName: event.target.value })} /></label>
          <label className="grid gap-2 text-sm font-medium">Business email<input className={field} type="email" required value={details.email} onChange={(event) => setDetails({ ...details, email: event.target.value })} /></label>
          <label className="grid gap-2 text-sm font-medium">Phone<input className={field} required value={details.phone} onChange={(event) => setDetails({ ...details, phone: event.target.value })} /></label>
          <label className="grid gap-2 text-sm font-medium sm:col-span-2">Address<input className={field} required value={details.address} onChange={(event) => setDetails({ ...details, address: event.target.value })} /></label>
          <label className="grid gap-2 text-sm font-medium sm:col-span-2">Description<textarea className={`${field} min-h-24 resize-y`} value={details.description} onChange={(event) => setDetails({ ...details, description: event.target.value })} /></label>
        </div>
      </section>
      <section className="border-t border-stone-200 pt-8"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-base font-semibold">Services</h3><p className="mt-1 text-sm text-slate-500">Add the services offered by this organization.</p></div><button className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold hover:bg-stone-50" type="button" onClick={() => setServices([...services, blankService()])}>+ Add service</button></div>
        <div className="space-y-3">{services.map((service, index) => <div className="grid gap-3 rounded-lg border border-stone-200 bg-stone-50 p-4 sm:grid-cols-[1fr_110px_120px_auto]" key={index}>
          <label className="grid gap-1 text-xs font-medium text-slate-500">Service name<input className={field} required value={service.name} onChange={(event) => changeService(index, 'name', event.target.value)} /></label>
          <label className="grid gap-1 text-xs font-medium text-slate-500">Minutes<input className={field} type="number" min="15" max="480" required value={service.durationMinutes} onChange={(event) => changeService(index, 'durationMinutes', event.target.value)} /></label>
          <label className="grid gap-1 text-xs font-medium text-slate-500">Price for these minutes (Rs.)<input className={field} type="number" min="0" step="0.01" value={service.price} onChange={(event) => changeService(index, 'price', event.target.value)} /></label>
          <button className="self-end px-2 py-3 text-sm font-medium text-slate-500 hover:text-slate-900 disabled:opacity-30" type="button" disabled={services.length === 1} onClick={() => setServices(services.filter((_, at) => at !== index))}>Remove</button>
        </div>)}</div>
      </section>
      <section className="border-t border-stone-200 pt-8"><h3 className="text-base font-semibold">Opening hours</h3><p className="mt-1 text-sm text-slate-500">Choose when customers can request appointments.</p>
        <div className="mt-5 divide-y divide-stone-200 rounded-lg border border-stone-200">{availability.map((slot, index) => <div className="grid items-center gap-3 p-3 sm:grid-cols-[1fr_130px_130px]" key={slot.dayOfWeek}>
          <label className="flex items-center gap-3 text-sm font-medium"><input className="accent-slate-900" type="checkbox" checked={slot.active} onChange={(event) => changeDay(index, 'active', event.target.checked)} />{slot.day}</label>
          <input className={field} aria-label={`${slot.day} opening time`} type="time" disabled={!slot.active} value={slot.startTime} onChange={(event) => changeDay(index, 'startTime', event.target.value)} />
          <input className={field} aria-label={`${slot.day} closing time`} type="time" disabled={!slot.active} value={slot.endTime} onChange={(event) => changeDay(index, 'endTime', event.target.value)} />
        </div>)}</div>
      </section>
    </div>
    <div className="flex flex-wrap justify-end gap-3 border-t border-stone-200 bg-rose-50/40 px-6 py-5 sm:px-8"><button className="rounded-lg border border-stone-300 px-6 py-3 text-sm font-semibold text-slate-600 hover:bg-white" type="button" onClick={() => setShowForm(false)}>Cancel</button><button className="rounded-lg bg-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-rose-200 transition hover:bg-rose-700 disabled:opacity-50" disabled={createState.isLoading || updateState.isLoading}>{createState.isLoading || updateState.isLoading ? 'Saving...' : organization && !creating ? 'Save changes' : 'Create organization'}</button></div>
    </form>}
  </div>
}

export default function OrganizationSetupForm() {
  const [selectedId, selectOrganization] = useState(null)
  const [editingId, editOrganization] = useState(null)
  const [detailId, showOrganizationDetails] = useState(null)
  const [deleteTarget, requestDelete] = useState(null)
  const [deleteOrganization, deleteState] = useDeleteOrganizationMutation()
  const { data, isLoading, isFetching, error, refetch } = useGetMyOrganizationsQuery()
  async function confirmDelete() {
    if (!deleteTarget) return
    try {
      await deleteOrganization(deleteTarget.id).unwrap()
      toast.success(`${deleteTarget.businessName} deleted.`)
      requestDelete(null)
      if (selectedId === deleteTarget.id) selectOrganization(null)
      if (editingId === deleteTarget.id) editOrganization(null)
      if (detailId === deleteTarget.id) showOrganizationDetails(null)
    } catch (deleteError) {
      toast.error(deleteError.data?.message || 'Could not delete the organization. Please try again.')
    }
  }
  if (isLoading) return <div className="rounded-xl border border-stone-200 bg-white p-8 text-sm text-slate-500">Loading organization...</div>
  const organizations = data?.organizations || []
  const organization = organizations.find((item) => item.id === selectedId) || organizations[0] || null
  return <>
    <OrganizationForm key={`${organization?.id || 'new'}-${editingId || ''}`} organization={organization} organizations={organizations} selectOrganization={selectOrganization} editOrganization={editOrganization} editingId={editingId} detailId={detailId} showOrganizationDetails={showOrganizationDetails} requestDelete={requestDelete} loadError={error} refetch={refetch} isFetching={isFetching} />
    {deleteTarget && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !deleteState.isLoading) requestDelete(null) }}><section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" role="alertdialog" aria-modal="true" aria-labelledby="delete-organization-title" aria-describedby="delete-organization-description"><div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-xl text-rose-700" aria-hidden="true">!</div><h2 id="delete-organization-title" className="text-xl font-semibold text-slate-900">Delete {deleteTarget.businessName}?</h2><p id="delete-organization-description" className="mt-2 text-sm leading-6 text-slate-600">This permanently removes this organization, its services, and opening hours. Your provider account and other organizations remain available.</p><div className="mt-6 flex flex-wrap justify-end gap-3"><button className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-stone-50 disabled:opacity-50" type="button" disabled={deleteState.isLoading} onClick={() => requestDelete(null)}>Cancel</button><button className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800 disabled:opacity-50" type="button" disabled={deleteState.isLoading} onClick={confirmDelete}>{deleteState.isLoading ? 'Deleting...' : 'Delete organization'}</button></div></section></div>}
  </>
}
