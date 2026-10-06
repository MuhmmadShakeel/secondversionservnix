import ChangePassword from '../../components/common/ChangePassword.jsx'

export default function AccountSecurityPage({ onBack }) {
  return <main className="min-h-screen bg-[#fbf8f9] px-5 py-10 text-slate-900 sm:px-10"><div className="mx-auto max-w-3xl">
    <button className="text-sm font-semibold text-rose-700 hover:underline" type="button" onClick={onBack}>← Back to dashboard</button>
    <div className="mt-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-600">Your account</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Security settings</h1><p className="mt-3 text-sm text-slate-600">Manage access to your Servnix account.</p></div>
    <ChangePassword />
  </div></main>
}
