import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { useUpdateProfileMutation } from '../../redux/Api/auth/AuthApi.js'

const field = 'w-full rounded-lg border border-stone-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100'

export default function CustomerProfile({ profile, onUserUpdate }) {
  const [details, setDetails] = useState({ name: profile.name, email: profile.email })
  const [updateProfile, updateState] = useUpdateProfileMutation()

  async function save(event) {
    event.preventDefault()
    try {
      const result = await updateProfile(details).unwrap()
      onUserUpdate(result.user)
      toast.success(result.message || 'Profile updated.')
    } catch (error) { toast.error(error.data?.message || 'Could not update your profile.') }
  }

  return <form className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm" onSubmit={save}>
    <div className="mb-6"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Account</p><h2 className="mt-2 text-xl font-semibold">Profile details</h2></div>
    <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-semibold">Full name<input className={field} required minLength="2" value={details.name} onChange={(event) => setDetails({ ...details, name: event.target.value })} /></label><label className="grid gap-2 text-sm font-semibold">Email address<input className={field} type="email" required value={details.email} onChange={(event) => setDetails({ ...details, email: event.target.value })} /></label></div>
    <div className="mt-6 flex items-center justify-between gap-3"><span className="text-xs text-slate-500">Account type: {profile.role.replace('_', ' ')}</span><button className="rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50" disabled={updateState.isLoading}>{updateState.isLoading ? 'Saving...' : 'Save profile'}</button></div>
  </form>
}

