import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { useGetEmployeeDirectoryQuery, useInviteProviderEmployeeMutation } from '../../../redux/Api/service-provider/ProviderEmployeeApi.js'

export default function EmployeeDirectory({ organizationId, organizationName, linkedEmployees }) {
  const { data, isLoading, error, refetch } = useGetEmployeeDirectoryQuery(undefined, { pollingInterval: 30000, refetchOnFocus: true })
  const [inviteEmployee, { isLoading: isInviting }] = useInviteProviderEmployeeMutation()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const linkedById = new Map(linkedEmployees.map((employee) => [employee.employeeId, employee]))
  const employees = (data?.employees || []).filter((employee) => `${employee.name} ${employee.jobTitle} ${employee.city}`.toLowerCase().includes(search.trim().toLowerCase()))

  async function invite() {
    if (!organizationId || !selected) return
    try {
      const result = await inviteEmployee({ organizationId, employeeId: selected.id }).unwrap()
      toast.success(result.message)
      setSelected(null)
    } catch (inviteError) {
      toast.error(inviteError.data?.message || 'Could not invite this employee.')
    }
  }

  return <section className="rounded-3xl border border-stone-200 bg-white p-7 shadow-sm sm:p-9">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-600">Discover employees</p><h3 className="mt-2 text-xl font-semibold text-slate-900">Available employee profiles</h3><p className="mt-1 text-sm text-slate-500">Review a completed profile before inviting the employee to {organizationName || 'your organization'}.</p></div><button className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-stone-50" type="button" onClick={refetch}>Refresh</button></div>
    <label className="mt-6 block max-w-md text-sm font-semibold text-slate-700">Search employees<input className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-rose-500" type="search" placeholder="Name, job title, or city" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
    {isLoading ? <p className="mt-6 text-sm text-slate-500">Loading profiles...</p> : error ? <p className="mt-6 text-sm text-rose-700">Could not load employee profiles. Try Refresh.</p> : employees.length ? <div className="mt-6 grid gap-4 lg:grid-cols-2">{employees.map((employee) => {
      const link = linkedById.get(employee.id)
      return <article className="rounded-2xl border border-stone-200 bg-stone-50/50 p-5" key={employee.id}><div className="flex items-center gap-3"><span className="grid size-12 shrink-0 place-items-center rounded-full bg-rose-100 text-base font-bold text-rose-700">{employee.name?.charAt(0)?.toUpperCase()}</span><div><h4 className="font-semibold text-slate-900">{employee.name}</h4><p className="mt-0.5 text-xs font-medium text-rose-700">{employee.jobTitle} ? {employee.city}</p></div></div>{employee.bio && <p className="mt-4 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{employee.bio}</p>}<div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-4"><span className={`text-xs font-semibold ${link?.status === 'accepted' ? 'text-emerald-700' : 'text-amber-700'}`}>{link?.status === 'accepted' ? 'On your team' : link ? 'Invitation pending' : 'Available to invite'}</span><button className="rounded-lg border border-rose-200 bg-white px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50" type="button" onClick={() => setSelected(employee)}>View profile</button></div></article>
    })}</div> : <p className="mt-6 rounded-2xl bg-stone-50 p-6 text-sm text-slate-500">{search ? 'No employees match your search.' : 'No completed employee profiles yet.'}</p>}
    {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null) }}><section className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="employee-profile-title"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-600">Employee profile</p><h2 id="employee-profile-title" className="mt-2 text-2xl font-semibold text-slate-900">{selected.name}</h2><p className="mt-1 text-sm text-slate-500">{selected.jobTitle} ? {selected.city}</p></div><button className="rounded-lg px-2 py-1 text-xl text-slate-500 hover:bg-stone-100" type="button" aria-label="Close profile" onClick={() => setSelected(null)}>?</button></div>{selected.bio && <p className="mt-5 whitespace-pre-wrap rounded-2xl bg-stone-50 p-4 text-sm leading-6 text-slate-700">{selected.bio}</p>}<div className="mt-5 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm"><p className="font-semibold text-rose-900">{organizationName || 'Selected organization'}</p><p className="mt-1 text-rose-800">{linkedById.has(selected.id) ? 'This employee already has an invitation or team link here.' : 'Send an invitation. The employee must accept it before their contact details are shared and duties can be assigned.'}</p></div><div className="mt-6 flex flex-wrap justify-end gap-3"><button className="rounded-xl border border-stone-200 px-5 py-2.5 text-sm font-semibold text-slate-600" type="button" onClick={() => setSelected(null)}>Close</button>{!linkedById.has(selected.id) && <button className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50" type="button" disabled={!organizationId || isInviting} onClick={invite}>{isInviting ? 'Sending...' : 'Invite to organization'}</button>}</div></section></div>}
  </section>
}
