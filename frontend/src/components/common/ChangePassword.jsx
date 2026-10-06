import { useState } from 'react'
import { useChangePasswordMutation } from '../../redux/Api/auth/AuthApi.js'

const field = 'mt-2 w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-100'

export default function ChangePassword() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [changePassword, { isLoading }] = useChangePasswordMutation()

  async function submit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    if (form.newPassword !== form.confirmPassword) return setError('New passwords do not match.')
    try {
      const result = await changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword }).unwrap()
      setMessage(result.message)
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (failure) { setError(failure.data?.message || 'Could not change your password. Please try again.') }
  }

  return <section className="mt-7 overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-[#68213e] via-rose-700 to-pink-500 px-7 py-7 text-white sm:px-9">
      <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-100">Account security</p><h2 className="mt-2 text-2xl font-semibold">Change your password</h2><p className="mt-2 text-sm text-rose-50">Keep your account protected with a password only you know.</p></div>
      <span className="grid size-12 place-items-center rounded-2xl border border-white/25 bg-white/15 text-2xl" aria-hidden="true">✦</span>
    </div>
    <form className="grid gap-5 p-7 sm:p-9" onSubmit={submit}>
      <label className="text-sm font-semibold text-slate-700">Current password<input className={field} type="password" autoComplete="current-password" value={form.currentPassword} onChange={(event) => setForm({ ...form, currentPassword: event.target.value })} required /></label>
      <div className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-semibold text-slate-700">New password<input className={field} type="password" autoComplete="new-password" minLength="8" maxLength="128" value={form.newPassword} onChange={(event) => setForm({ ...form, newPassword: event.target.value })} required /></label><label className="text-sm font-semibold text-slate-700">Confirm new password<input className={field} type="password" autoComplete="new-password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} required /></label></div>
      <p className="text-xs text-slate-500">Use 8–128 characters with uppercase, lowercase, and a number. Other signed-in devices will be logged out.</p>
      {error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800" role="alert">{error}</p>}
      {message && <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800" role="status">{message}</p>}
      <div><button className="rounded-xl bg-rose-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-rose-100 transition hover:bg-rose-700 disabled:opacity-60" disabled={isLoading}>{isLoading ? 'Updating password...' : 'Update password'}</button></div>
    </form>
  </section>
}
