import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { useGetEmployeeProfileQuery, useSaveEmployeeProfileMutation } from '../../../redux/Api/employee/EmployeeApi.js'
import ChangePassword from '../../common/ChangePassword.jsx'
import AccountProfile from '../../common/AccountProfile.jsx'

const field = 'mt-2 w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-100'
export default function EmployeeProfile({ user, onUserUpdate }) {
  const { data, isLoading, error, refetch } = useGetEmployeeProfileQuery()
  const [saveProfile, { isLoading: isSaving }] = useSaveEmployeeProfileMutation()
  const [form, setForm] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const values = form || { phone: data?.profile?.phone || '', city: data?.profile?.city || '', address: data?.profile?.address || '', jobTitle: data?.profile?.jobTitle || '', bio: data?.profile?.bio || '' }

  async function submit(event) {
    event.preventDefault()
    try {
      const result = await saveProfile(values).unwrap()
      toast.success(result.message)
      setIsEditing(false)
      setForm(null)
    } catch (saveError) {
      toast.error(saveError.data?.message || 'Could not save your profile. Please try again.')
    }
  }

  const profile = data?.profile
  const showForm = !data?.isComplete || isEditing

  return <div className="space-y-7">
    <AccountProfile user={user} onUserUpdate={onUserUpdate} />
    {data?.profile?.organizationName && <div className="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4"><p className="text-xs font-bold uppercase tracking-[0.15em] text-rose-600">Selected organization</p><p className="mt-1 font-semibold text-slate-900">{data.profile.organizationName}</p></div>}
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm"><div><p className="text-sm font-semibold text-slate-900">Professional profile</p><p className="mt-1 text-sm text-slate-500">{data?.isComplete ? 'Your work details are ready and can be updated below.' : 'Add your contact and work details to get started.'}</p></div><span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${data?.isComplete ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>{data?.isComplete ? 'Complete' : 'Setup needed'}</span></div>
    {isLoading ? <div className="rounded-2xl bg-white p-8 text-sm text-slate-500">Loading your profile...</div> : error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6"><p className="text-sm text-rose-800">Could not load your profile.</p><button className="mt-3 text-sm font-semibold text-rose-700 underline" type="button" onClick={refetch}>Try again</button></div> : <section className="rounded-3xl border border-stone-200 bg-white p-7 shadow-sm sm:p-9"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-600">My profile</p><h2 className="mt-2 text-2xl font-semibold text-slate-900">Professional details</h2><p className="mt-1 text-sm text-slate-500">Your name and email come from your account.</p></div>{data?.isComplete && !isEditing && <button className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50" type="button" onClick={() => setIsEditing(true)}>Edit profile</button>}</div>
      {showForm ? <form className="mt-7 grid gap-5 sm:grid-cols-2" onSubmit={submit}><div className="grid gap-1 text-sm"><span className="font-semibold text-slate-700">Full name</span><span className="rounded-xl bg-stone-50 px-4 py-3 text-slate-600">{user.name}</span></div><div className="grid gap-1 text-sm"><span className="font-semibold text-slate-700">Email</span><span className="rounded-xl bg-stone-50 px-4 py-3 text-slate-600">{user.email}</span></div><label className="text-sm font-semibold text-slate-700">Phone number<input className={field} type="tel" autoComplete="tel" maxLength="30" required value={values.phone} onChange={(event) => setForm({ ...values, phone: event.target.value })} placeholder="03XX XXXXXXX" /></label><label className="text-sm font-semibold text-slate-700">City<input className={field} autoComplete="address-level2" maxLength="100" minLength="2" required value={values.city} onChange={(event) => setForm({ ...values, city: event.target.value })} /></label><label className="text-sm font-semibold text-slate-700 sm:col-span-2">Address<input className={field} autoComplete="street-address" maxLength="300" minLength="5" required value={values.address} onChange={(event) => setForm({ ...values, address: event.target.value })} /></label><label className="text-sm font-semibold text-slate-700 sm:col-span-2">Job title<input className={field} maxLength="120" minLength="2" required value={values.jobTitle} onChange={(event) => setForm({ ...values, jobTitle: event.target.value })} placeholder="For example, electrician or cleaning specialist" /></label><label className="text-sm font-semibold text-slate-700 sm:col-span-2">About me <span className="font-normal text-slate-400">Optional</span><textarea className={field} rows="4" maxLength="1000" value={values.bio} onChange={(event) => setForm({ ...values, bio: event.target.value })} placeholder="Share your experience and strengths" /></label><div className="flex flex-wrap justify-end gap-3 border-t border-stone-100 pt-5 sm:col-span-2">{data?.isComplete && <button className="rounded-xl border border-stone-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-stone-50" type="button" onClick={() => { setIsEditing(false); setForm(null) }}>Cancel</button>}<button className="rounded-xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save profile'}</button></div></form> : <div className="mt-7 grid gap-5 text-sm sm:grid-cols-2">{[['Full name', profile.name], ['Email', profile.email], ['Phone', profile.phone], ['City', profile.city], ['Address', profile.address], ['Job title', profile.jobTitle]].map(([label, value]) => <div className="rounded-xl bg-stone-50 p-4" key={label}><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 font-medium text-slate-900">{value}</p></div>)}{profile.bio && <div className="rounded-xl bg-stone-50 p-4 sm:col-span-2"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">About me</p><p className="mt-2 whitespace-pre-wrap text-slate-800">{profile.bio}</p></div>}</div>}
    </section>}
    <ChangePassword />
  </div>
}
