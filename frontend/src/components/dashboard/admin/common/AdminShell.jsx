import AdminHeader from './AdminHeader'
import AdminSidebar from './AdminSidebar'

const descriptions = {
  overview: 'A clear view of the platform and the work needing attention.',
  users: 'Manage customer, provider, and admin accounts.',
  organizations: 'Review provider organizations and manage their status.',
  bookings: 'View appointment requests and customer contact details.',
  profile: 'Keep your personal account details up to date.',
}

export default function AdminShell({ userName, onExit, onSecurity, section, onSectionChange, children }) {
  return <div className="flex min-h-screen bg-[#fbf8f9] text-slate-900">
    <AdminSidebar onExit={onExit} section={section} onSectionChange={onSectionChange} />
    <main className="min-w-0 flex-1"><AdminHeader userName={userName} onExit={onExit} onSecurity={onSecurity} />
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-10">
        <div className="mb-8"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Administration</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{section.charAt(0).toUpperCase() + section.slice(1)}</h1><p className="mt-2 text-sm text-slate-500">{descriptions[section]}</p></div>
        <nav className="mb-6 flex flex-wrap gap-2 lg:hidden" aria-label="Admin navigation">{['overview', 'users', 'organizations', 'bookings', 'profile'].map((item) => <button className={`rounded-lg px-3 py-2 text-sm font-semibold capitalize ${section === item ? 'bg-rose-600 text-white' : 'border border-stone-200 bg-white text-slate-600'}`} type="button" onClick={() => onSectionChange(item)} key={item}>{item === 'profile' ? 'My profile' : item}</button>)}</nav>
        {children}
      </div>
    </main>
  </div>
}
