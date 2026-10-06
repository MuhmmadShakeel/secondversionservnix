import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { useGetEmployeeInvitationsQuery, useRespondToEmployeeInvitationMutation } from '../../../redux/Api/employee/EmployeeApi.js'

export default function EmployeeInvitations() {
  const { data, isLoading, error, refetch } = useGetEmployeeInvitationsQuery()
  const [respond, { isLoading: isSaving }] = useRespondToEmployeeInvitationMutation()
  const [busyId, setBusyId] = useState(null)
  const invitations = data?.invitations || []

  async function decide(id, decision) {
    setBusyId(id)
    try {
      const result = await respond({ id, decision }).unwrap()
      toast.success(result.message)
    } catch (responseError) {
      toast.error(responseError.data?.message || 'Could not update this invitation.')
    } finally { setBusyId(null) }
  }

  return <section className="rounded-3xl border border-stone-200 bg-white p-7 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-600">Organizations</p><h2 className="mt-2 text-xl font-semibold text-slate-900">Your invitations</h2><p className="mt-1 text-sm text-slate-500">Organizations you chose at signup appear as joined. Accept other invitations to share your professional profile.</p></div><button className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-stone-50" type="button" onClick={refetch}>Refresh</button></div>{isLoading ? <p className="mt-6 text-sm text-slate-500">Loading invitations...</p> : error ? <p className="mt-6 text-sm text-rose-700">Could not load invitations.</p> : invitations.length ? <div className="mt-6 divide-y divide-stone-100 rounded-2xl border border-stone-200">{invitations.map((invitation) => <article className="flex flex-wrap items-center justify-between gap-4 p-4" key={invitation.id}><div><p className="font-semibold text-slate-900">{invitation.organizationName}</p><p className="mt-1 text-sm text-slate-500">{invitation.organizationAddress}</p><p className="mt-2 text-xs font-semibold text-rose-700">{invitation.status === 'accepted' ? 'Joined organization' : 'Invitation pending'}</p></div>{invitation.status === 'pending' && <div className="flex gap-2"><button className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50" type="button" disabled={isSaving && busyId === invitation.id} onClick={() => decide(invitation.id, 'accept')}>Accept</button><button className="rounded-lg border border-stone-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-stone-50 disabled:opacity-50" type="button" disabled={isSaving && busyId === invitation.id} onClick={() => decide(invitation.id, 'decline')}>Decline</button></div>}</article>)}</div> : <p className="mt-6 rounded-2xl bg-stone-50 p-6 text-sm text-slate-500">No organization invitations yet.</p>}</section>
}
