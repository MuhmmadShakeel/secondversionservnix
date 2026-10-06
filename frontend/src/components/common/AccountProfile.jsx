import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { useGetProfileQuery, useUpdateProfileMutation } from '../../redux/Api/auth/AuthApi.js'

const inputClass = 'mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-100'

const roleNames = {
  customer: 'Customer',
  employee: 'Employee',
  service_provider: 'Service provider',
  platform_admin: 'Platform administrator',
}

export default function AccountProfile({ user, onUserUpdate }) {
  const { data, isLoading, error, refetch } = useGetProfileQuery()
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation()
  const profile = data?.user || user
  const [draft, setDraft] = useState(null)
  const details = draft || { name: profile?.name || '', email: profile?.email || '' }
  const isUnchanged = details.name.trim() === profile?.name && details.email.trim().toLowerCase() === profile?.email

  async function save(event) {
    event.preventDefault()
    try {
      const result = await updateProfile(details).unwrap()
      onUserUpdate?.(result.user)
      setDraft(null)
      toast.success(result.message || 'Profile updated.')
    } catch (failure) {
      toast.error(failure.data?.message || 'Could not update your profile.')
    }
  }

  if (isLoading && !data) return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading your profile...</div>
  if (error) return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-sm text-rose-800" role="alert">Could not load your profile. <button className="font-semibold underline" type="button" onClick={refetch}>Try again</button></div>

  const initials = profile?.name?.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'S'

  return <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_16px_45px_-32px_rgba(15,23,42,0.35)]">
    <div className="border-b border-slate-100 px-6 py-6 sm:px-8"><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-rose-600">Account settings</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Personal profile</h2><p className="mt-1.5 text-sm text-slate-500">Manage the details linked to your Servnix account.</p></div>
    <div className="grid lg:grid-cols-[minmax(250px,0.72fr)_minmax(0,1.28fr)]">
      <aside className="border-b border-slate-100 bg-[#faf8f7] px-6 py-8 sm:px-8 lg:border-b-0 lg:border-r"><div className="flex items-center gap-4 lg:block"><div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-[#542f41] text-xl font-semibold tracking-wide text-white shadow-md shadow-rose-100 lg:size-20 lg:text-2xl" aria-hidden="true">{initials}</div><div className="min-w-0 lg:mt-5"><p className="break-words text-lg font-semibold leading-snug text-slate-900">{profile?.name}</p><p className="mt-1 break-all text-sm text-slate-500">{profile?.email}</p></div></div><span className="mt-6 inline-flex items-center gap-2 rounded-full border border-rose-100 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700"><span className="size-1.5 rounded-full bg-rose-500" aria-hidden="true" />{roleNames[profile?.role] || 'Account'}</span><div className="mt-8 border-t border-slate-200/70 pt-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Your account</p><p className="mt-2 text-sm leading-6 text-slate-600">The name and email saved here are used across your workspace and bookings.</p></div></aside>
      <div className="px-6 py-8 sm:px-8"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-700" aria-hidden="true"><svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></svg></span><div><h3 className="text-lg font-semibold text-slate-900">Basic information</h3><p className="mt-1 text-sm leading-6 text-slate-500">Edit your personal details and save your changes.</p></div></div>
        <form className="mt-8" onSubmit={save}><div className="grid gap-6"><label className="block text-sm font-semibold text-slate-700">Full name<input className={inputClass} autoComplete="name" required minLength={2} maxLength={120} value={details.name} onChange={(event) => setDraft({ ...details, name: event.target.value })} /><span className="mt-2 block text-xs font-normal text-slate-500">This is how your name appears to other people on Servnix.</span></label><label className="block text-sm font-semibold text-slate-700">Email address<input className={inputClass} type="email" autoComplete="email" required maxLength={255} value={details.email} onChange={(event) => setDraft({ ...details, email: event.target.value })} /><span className="mt-2 block text-xs font-normal text-slate-500">Use an address you can access for account recovery.</span></label></div><div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6"><p className="text-xs text-slate-500">Your changes are saved to your account.</p><div className="flex items-center gap-3">{draft && !isUnchanged && <button className="rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50" type="button" onClick={() => setDraft(null)} disabled={isSaving}>Cancel</button>}<button className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:cursor-not-allowed disabled:opacity-50" disabled={isSaving || isUnchanged}>{isSaving ? 'Saving...' : 'Save changes'}</button></div></div></form>
      </div>
    </div>
  </section>
}
