import ProviderHeader from './ProviderHeader'
import ProviderSidebar from './ProviderSidebar'

export default function ProviderShell({ userName, onExit, onSecurity, section, onSectionChange, children }) {
  return <div className="flex min-h-screen bg-[#fbf8f9] text-slate-900">
    <ProviderSidebar onExit={onExit} section={section} onSectionChange={onSectionChange} />
    <main className="min-w-0 flex-1"><ProviderHeader userName={userName} onExit={onExit} onSecurity={onSecurity} />
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-10">
        <div className="mb-8"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-500">Provider dashboard</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{section === 'bookings' ? 'Bookings' : section === 'employees' ? 'Employees' : section === 'duties' ? 'Assign employee' : section === 'profile' ? 'My profile' : 'Provider Organization'}</h1><p className="mt-2 text-sm text-slate-500">{section === 'bookings' ? 'Review and respond to customer appointment requests.' : section === 'employees' ? 'Invite employees and view their professional profiles.' : section === 'duties' ? 'Assign confirmed services to your employees.' : section === 'profile' ? 'Keep your personal account details up to date.' : 'Create your business profile and manage its services.'}</p></div>
        <nav className="mb-6 flex flex-wrap gap-2 lg:hidden" aria-label="Provider navigation">{['organization', 'bookings', 'employees', 'duties', 'profile'].map((item) => <button className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize ${section === item ? 'bg-rose-600 text-white' : 'border border-stone-200 bg-white text-slate-600'}`} type="button" onClick={() => onSectionChange(item)} key={item}>{item === 'duties' ? 'Assign employee' : item === 'profile' ? 'My profile' : item}</button>)}</nav>
        {children}
      </div>
    </main>
  </div>
}
