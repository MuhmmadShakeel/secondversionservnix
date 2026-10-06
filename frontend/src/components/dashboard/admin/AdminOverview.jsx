import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { useDispatch } from 'react-redux'
import { organizationApi } from '../../../redux/Api/service-provider/OrganizationApi.js'
import {
  useDeleteAdminOrganizationMutation,
  useDeleteUserMutation,
  useGetAdminOrganizationsQuery,
  useGetUsersQuery,
  useUpdateAdminOrganizationMutation,
  useUpdateUserMutation,
} from '../../../redux/Api/admin/AdminApi.js'

const button = 'rounded-lg border border-stone-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-stone-50 disabled:opacity-50'
const field = 'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100'
const statuses = ['pending', 'active', 'suspended']
const organizationStatuses = ['pending', 'approved', 'rejected', 'suspended']
const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function errorMessage(error) {
  return error?.data?.message || 'The change could not be saved. Please try again.'
}

function ServiceTable({ services }) {
  return <div className="overflow-x-auto rounded-lg border border-rose-100 bg-white">
    <table className="w-full min-w-[360px] text-left text-sm">
      <thead className="bg-rose-50 text-xs font-semibold uppercase tracking-wide text-rose-800"><tr><th className="px-4 py-3">Service</th><th className="px-4 py-3">Duration</th><th className="px-4 py-3 text-right">Price</th></tr></thead>
      <tbody className="divide-y divide-stone-100">{services.length ? services.map((service) => <tr key={service.id}><td className="px-4 py-3 font-medium text-slate-900">{service.name}</td><td className="px-4 py-3 text-slate-600">{service.durationMinutes} min</td><td className="px-4 py-3 text-right text-slate-700">{service.price == null ? 'On request' : `Rs. ${Number(service.price).toLocaleString()}`}</td></tr>) : <tr><td className="px-4 py-4 text-slate-500" colSpan="3">No services added.</td></tr>}</tbody>
    </table>
  </div>
}

export default function AdminOverview({ currentUserId, section, onSectionChange }) {
  const dispatch = useDispatch()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [draft, setDraft] = useState({})
  const [confirmDelete, setConfirmDelete] = useState(null)
  const { data: userData, isLoading: usersLoading, error: usersError } = useGetUsersQuery()
  const { data: organizationData, isLoading: organizationsLoading, error: organizationsError } = useGetAdminOrganizationsQuery(undefined, { pollingInterval: 30000, refetchOnFocus: true })
  const [updateUser, updatingUser] = useUpdateUserMutation()
  const [deleteUser, deletingUser] = useDeleteUserMutation()
  const [updateOrganization, updatingOrganization] = useUpdateAdminOrganizationMutation()
  const [deleteOrganization, deletingOrganization] = useDeleteAdminOrganizationMutation()
  const users = userData?.users || []
  const organizations = organizationData?.organizations || []
  const pending = organizations.filter((item) => item.status === 'pending')
  const visibleUsers = users.filter((item) => `${item.name} ${item.email} ${item.role}`.toLowerCase().includes(search.toLowerCase()))
  const visibleOrganizations = organizations.filter((item) => `${item.businessName} ${item.email} ${item.ownerName} ${item.services.map((service) => service.name).join(' ')}`.toLowerCase().includes(search.toLowerCase()))

  function beginEdit(kind, item) {
    setEditing(`${kind}:${item.id}`)
    setConfirmDelete(null)
    setDraft(kind === 'user'
      ? { name: item.name, email: item.email, role: item.role, status: item.status }
      : { businessName: item.businessName, email: item.email, phone: item.phone, address: item.address, description: item.description || '', status: item.status })
  }

  async function save(kind, id) {
    try {
      await (kind === 'user' ? updateUser({ id, ...draft }) : updateOrganization({ id, ...draft })).unwrap()
      dispatch(organizationApi.util.invalidateTags(['Organization']))
      toast.success(kind === 'user' ? 'User updated.' : 'Organization updated.')
      setEditing(null)
    } catch (error) { toast.error(errorMessage(error)) }
  }

  async function remove(kind, id) {
    try {
      await (kind === 'user' ? deleteUser(id) : deleteOrganization(id)).unwrap()
      dispatch(organizationApi.util.invalidateTags(['Organization']))
      toast.success(kind === 'user' ? 'User deleted.' : 'Organization deleted.')
      setConfirmDelete(null)
    } catch (error) { toast.error(errorMessage(error)) }
  }

  async function approve(item) {
    try {
      await updateOrganization({ id: item.id, status: 'approved' }).unwrap()
      dispatch(organizationApi.util.invalidateTags(['Organization']))
      toast.success(`${item.businessName} is now visible to customers.`)
    } catch (error) { toast.error(errorMessage(error)) }
  }

  async function reject(item) {
    try {
      await updateOrganization({ id: item.id, status: 'rejected' }).unwrap()
      dispatch(organizationApi.util.invalidateTags(['Organization']))
      toast.success(`${item.businessName} was rejected.`)
    } catch (error) { toast.error(errorMessage(error)) }
  }

  if (usersLoading || organizationsLoading) return <div className="rounded-xl border border-stone-200 bg-white p-8 text-sm text-slate-500">Loading platform data...</div>
  if (usersError || organizationsError) return <div className="rounded-xl border border-stone-200 bg-white p-8 text-sm text-slate-600">Could not load admin data. Please refresh the page.</div>

  return <div className="space-y-6">
    {section === 'overview' && <div className="grid gap-4 sm:grid-cols-3">
      {[
        ['Users', users.length],
        ['Organizations', organizations.length],
        ['Awaiting review', pending.length],
      ].map(([label, value]) => <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm" key={label}><p className="text-sm text-slate-500">{label}</p><p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p></div>)}
    </div>}
    {section !== 'overview' && <div className="flex justify-end"><input className={`${field} max-w-xs`} aria-label="Search records" placeholder={section === 'users' ? 'Search users' : 'Search organizations'} value={search} onChange={(event) => setSearch(event.target.value)} /></div>}

    {section === 'overview' && <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Organizations to review</h2><p className="mt-1 text-sm text-slate-500">Approve a provider to make their services visible to customers.</p></div><button className={button} type="button" onClick={() => onSectionChange('organizations')}>View all organizations</button></div>
      <div className="mt-5 divide-y divide-stone-200">{pending.length ? pending.map((item) => <div className="flex flex-wrap items-center justify-between gap-3 py-4" key={item.id}><div><p className="font-semibold">{item.businessName}</p><p className="mt-1 text-xs text-slate-500">{item.ownerName} · {item.serviceCount} services</p></div><button className={button} type="button" onClick={() => { onSectionChange('organizations'); beginEdit('organization', item) }}>Review</button></div>) : <p className="py-8 text-sm text-slate-500">No organizations are awaiting review.</p>}</div>
    </section>}

    {section === 'users' && <section className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm"><div className="border-b border-stone-200 px-6 py-5"><h2 className="text-lg font-semibold">Users</h2><p className="mt-1 text-sm text-slate-500">Manage account details, access, and status.</p></div>
      <div className="divide-y divide-stone-200">{visibleUsers.length ? visibleUsers.map((item) => <div className="px-6 py-5" key={item.id}>
        {editing === `user:${item.id}` ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="grid gap-1 text-xs font-medium text-slate-500">Name<input className={field} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
          <label className="grid gap-1 text-xs font-medium text-slate-500">Email<input className={field} type="email" value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} /></label>
          <label className="grid gap-1 text-xs font-medium text-slate-500">Role<select className={field} value={draft.role} onChange={(event) => setDraft({ ...draft, role: event.target.value })}><option value="customer">Customer</option><option value="service_provider">Service provider</option><option value="platform_admin">Platform admin</option></select></label>
          <label className="grid gap-1 text-xs font-medium text-slate-500">Status<select className={field} value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>
          <div className="flex gap-2 sm:col-span-2 lg:col-span-4"><button className={button} disabled={updatingUser.isLoading} type="button" onClick={() => save('user', item.id)}>Save changes</button><button className={button} type="button" onClick={() => setEditing(null)}>Cancel</button></div>
        </div> : <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">{item.name} {item.id === currentUserId && <span className="ml-2 text-xs font-normal text-slate-400">(you)</span>}</p><p className="mt-1 text-sm text-slate-500">{item.email}</p><p className="mt-1 text-xs capitalize text-slate-400">{item.role.replace('_', ' ')} · {item.status}</p></div><div className="flex gap-2"><button className={button} type="button" onClick={() => beginEdit('user', item)}>Edit</button>{item.id !== currentUserId && <button className={button} type="button" onClick={() => setConfirmDelete(`user:${item.id}`)}>Delete</button>}</div></div>}
        {confirmDelete === `user:${item.id}` && <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg bg-red-50 p-3 text-sm"><span className="text-red-800">Delete this user and their organization?</span><button className={button} disabled={deletingUser.isLoading} type="button" onClick={() => remove('user', item.id)}>Confirm delete</button><button className={button} type="button" onClick={() => setConfirmDelete(null)}>Cancel</button></div>}
      </div>) : <p className="px-6 py-10 text-sm text-slate-500">No users match your search.</p>}</div>
    </section>}

    {section === 'organizations' && <section className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm"><div className="border-b border-stone-200 px-6 py-5"><h2 className="text-lg font-semibold">Organizations</h2><p className="mt-1 text-sm text-slate-500">Review, update, and remove provider organizations.</p></div>
      <div className="divide-y divide-stone-200">{visibleOrganizations.length ? visibleOrganizations.map((item) => <div className="px-6 py-5" key={item.id}>
        {editing === `organization:${item.id}` ? <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-stone-50 p-4 sm:col-span-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Review services before approval</p><div className="mt-2 flex flex-wrap gap-2">{item.services.map((service) => <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-slate-700" key={service.id}>{service.name} · {service.durationMinutes} min</span>)}</div><p className="mt-3 text-xs text-slate-500">{item.availability.map((slot) => `${days[slot.dayOfWeek]} ${slot.startTime}–${slot.endTime}`).join(' · ')}</p></div>
          <label className="grid gap-1 text-xs font-medium text-slate-500">Business name<input className={field} value={draft.businessName} onChange={(event) => setDraft({ ...draft, businessName: event.target.value })} /></label>
          <label className="grid gap-1 text-xs font-medium text-slate-500">Business email<input className={field} type="email" value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} /></label>
          <label className="grid gap-1 text-xs font-medium text-slate-500">Status<select className={field} value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })}>{organizationStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
          <label className="grid gap-1 text-xs font-medium text-slate-500">Phone<input className={field} value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} /></label>
          <label className="grid gap-1 text-xs font-medium text-slate-500 sm:col-span-2">Address<input className={field} value={draft.address} onChange={(event) => setDraft({ ...draft, address: event.target.value })} /></label>
          <label className="grid gap-1 text-xs font-medium text-slate-500 sm:col-span-3">Description<textarea className={field} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label>
          <div className="flex gap-2 sm:col-span-3"><button className={button} disabled={updatingOrganization.isLoading} type="button" onClick={() => save('organization', item.id)}>Save changes</button><button className={button} type="button" onClick={() => setEditing(null)}>Cancel</button></div>
        </div> : <div className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">{item.businessName}</p><p className="mt-1 text-sm text-slate-500">{item.email} · {item.ownerName}</p><p className="mt-1 text-xs capitalize text-slate-400">{item.serviceCount} services · {item.status}</p></div><div className="flex flex-wrap gap-2">{item.status !== 'approved' && <button className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50" disabled={updatingOrganization.isLoading} type="button" onClick={() => approve(item)}>Approve</button>}{item.status === 'pending' && <button className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50" disabled={updatingOrganization.isLoading} type="button" onClick={() => reject(item)}>Reject</button>}<button className={button} type="button" onClick={() => beginEdit('organization', item)}>Edit / Review</button><button className={button} type="button" onClick={() => setConfirmDelete(`organization:${item.id}`)}>Delete</button></div></div><div className="rounded-xl border border-rose-100 bg-rose-50/40 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-rose-700">Services and availability</p><div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"><div><ServiceTable services={item.services} /></div><div><p className="text-sm text-slate-600">{item.address}</p><p className="mt-2 text-xs text-slate-500">{item.availability.map((slot) => `${days[slot.dayOfWeek]} ${slot.startTime}–${slot.endTime}`).join(' · ') || 'No opening hours'}</p></div></div></div></div>}
        {confirmDelete === `organization:${item.id}` && <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg bg-red-50 p-3 text-sm"><span className="text-red-800">Delete this organization and all its services?</span><button className={button} disabled={deletingOrganization.isLoading} type="button" onClick={() => remove('organization', item.id)}>Confirm delete</button><button className={button} type="button" onClick={() => setConfirmDelete(null)}>Cancel</button></div>}
      </div>) : <p className="px-6 py-10 text-sm text-slate-500">No organizations match your search.</p>}</div>
    </section>}
  </div>
}
