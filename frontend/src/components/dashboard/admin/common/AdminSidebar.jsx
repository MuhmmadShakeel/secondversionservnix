const items = [
  { id: 'overview', label: 'Overview', number: '01' },
  { id: 'users', label: 'Users', number: '02' },
  { id: 'organizations', label: 'Organizations', number: '03' },
  { id: 'bookings', label: 'Bookings', number: '04' },
  { id: 'profile', label: 'My profile', number: '05' },
]

export default function AdminSidebar({ onExit, section, onSectionChange }) {
  return <aside className="hidden min-h-screen w-60 shrink-0 border-r border-stone-200 bg-white px-6 py-8 lg:block">
    <button className="flex items-center gap-3 text-xl font-bold tracking-tight text-slate-900" type="button" onClick={onExit}><span className="grid size-9 place-items-center rounded-lg bg-rose-600 text-sm font-semibold text-white shadow-sm shadow-rose-200">S</span>servnix</button>
    <p className="mt-14 text-xs font-semibold uppercase tracking-[0.18em] text-rose-500">Administration</p>
    <nav className="mt-4 space-y-1" aria-label="Admin navigation">{items.map((item) => <button className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-semibold transition ${section === item.id ? 'bg-rose-50 text-rose-800 ring-1 ring-rose-100' : 'text-slate-600 hover:bg-rose-50 hover:text-rose-800'}`} type="button" onClick={() => onSectionChange(item.id)} aria-current={section === item.id ? 'page' : undefined} key={item.id}><span className={`text-[11px] ${section === item.id ? 'text-rose-500' : 'text-slate-400'}`}>{item.number}</span>{item.label}</button>)}</nav>
    <div className="mt-12 border-t border-stone-200 pt-6"><button className="text-sm font-medium text-slate-500 transition hover:text-slate-900" type="button" onClick={onExit}>Log out</button></div>
  </aside>
}
