import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { useForgotPasswordMutation, useResetPasswordMutation } from '../../redux/Api/auth/AuthApi.js'

const field = 'mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-100'

export default function PasswordRecovery({ onLogin }) {
  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [forgotPassword, forgotState] = useForgotPasswordMutation()
  const [resetPassword, resetState] = useResetPasswordMutation()

  async function requestCode(event) {
    event.preventDefault()
    setError('')
    try {
      await forgotPassword({ email: email.trim() }).unwrap()
      setStep('verify')
    } catch (failure) {
      setError(failure.data?.message || 'Could not send a verification code. Please try again.')
    }
  }

  async function savePassword(event) {
    event.preventDefault()
    setError('')
    if (password !== confirm) return setError('Passwords do not match.')
    try {
      await resetPassword({ email: email.trim(), code, password }).unwrap()
      setPassword('')
      setConfirm('')
      toast.success('Password updated. Sign in with your new password.')
      onLogin()
    } catch (failure) {
      setError(failure.data?.message || 'Could not update your password. Please try again.')
    }
  }

  return <section className="w-full overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_24px_70px_-38px_rgba(67,27,45,0.45)]">
    <div className="border-b border-slate-100 px-7 pb-7 pt-8 sm:px-9"><span className="grid size-12 place-items-center rounded-2xl bg-rose-50 text-rose-700" aria-hidden="true"><svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg></span><p className="mt-6 text-[11px] font-bold uppercase tracking-[0.18em] text-rose-600">Account recovery</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{step === 'email' ? 'Reset your password' : 'Check your email'}</h1><p className="mt-3 text-sm leading-6 text-slate-500">{step === 'email' ? 'Enter your account email to receive a one-time verification code.' : <>Enter the 8-digit code sent to <strong className="font-semibold text-slate-700">{email}</strong>, then choose a new password.</>}</p></div>
    <div className="px-7 py-7 sm:px-9"><div className="mb-7 flex items-center gap-3" aria-label="Recovery progress"><span className="flex items-center gap-2 text-xs font-semibold text-rose-700"><span className="grid size-6 place-items-center rounded-full bg-rose-600 text-white">1</span>Email</span><span className="h-px flex-1 bg-slate-200" /><span className={`flex items-center gap-2 text-xs font-semibold ${step === 'verify' ? 'text-rose-700' : 'text-slate-400'}`}><span className={`grid size-6 place-items-center rounded-full ${step === 'verify' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-500'}`}>2</span>Verify & reset</span></div>
      {step === 'email' ? <form className="space-y-5" onSubmit={requestCode}><label className="block text-sm font-semibold text-slate-700">Email address<input className={field} type="email" autoComplete="email" maxLength={255} placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>{error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800" role="alert">{error}</p>}<button className="w-full rounded-xl bg-rose-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60" disabled={forgotState.isLoading}>{forgotState.isLoading ? 'Sending code...' : 'Continue'}</button></form> : <form className="space-y-5" onSubmit={savePassword}><label className="block text-sm font-semibold text-slate-700">Verification code<input className={`${field} tracking-[0.25em]`} type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{8}" minLength={8} maxLength={8} placeholder="8-digit code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 8))} required /><span className="mt-2 block text-xs font-normal tracking-normal text-slate-500">The code expires after 20 minutes.</span></label><label className="block text-sm font-semibold text-slate-700">New password<input className={field} type="password" autoComplete="new-password" minLength={8} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} required /></label><label className="block text-sm font-semibold text-slate-700">Confirm new password<input className={field} type="password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} required /></label><p className="text-xs leading-5 text-slate-500">Use 8–128 characters with uppercase, lowercase, and a number.</p>{error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800" role="alert">{error}</p>}<button className="w-full rounded-xl bg-rose-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60" disabled={resetState.isLoading}>{resetState.isLoading ? 'Updating password...' : 'Reset password'}</button><button className="w-full text-center text-sm font-semibold text-rose-700 hover:text-rose-800" type="button" onClick={() => { setStep('email'); setCode(''); setError('') }}>Need a new code? Return to email</button></form>}
      <button className="mt-7 w-full border-t border-slate-100 pt-6 text-center text-sm font-semibold text-slate-600 transition hover:text-rose-700" type="button" onClick={onLogin}>Back to login</button>
    </div>
  </section>
}
