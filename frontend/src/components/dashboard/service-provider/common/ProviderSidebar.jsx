export default function ProviderSidebar({ onExit, section, onSectionChange }) {
  return <aside className="hidden min-h-screen w-60 shrink-0 border-r border-stone-200 bg-white px-6 py-8 lg:block">
    <button className="flex items-center gap-3 text-xl font-bold tracking-tight text-slate-900" type="button" onClick={onExit}><span className="grid size-9 place-items-center rounded-lg bg-rose-600 text-sm font-semibold text-white shadow-sm shadow-rose-200">S</span>servnix</button>
    <p className="mt-14 text-xs font-semibold uppercase tracking-[0.18em] text-rose-500">Provider workspace</p>
    <nav className="mt-4 space-y-1" aria-label="Provider navigation">{['organization', 'bookings', 'employees', 'duties', 'profile'].map((item) => <button className={`w-full rounded-lg px-4 py-3 text-left text-sm font-semibold capitalize transition ${section === item ? 'bg-rose-50 text-rose-800 ring-1 ring-rose-100' : 'text-slate-600 hover:bg-rose-50 hover:text-rose-800'}`} type="button" onClick={() => onSectionChange(item)} aria-current={section === item ? 'page' : undefined} key={item}>{item === 'duties' ? 'Assign employee' : item === 'profile' ? 'My profile' : item}</button>)}</nav>
    <button className="mt-8 text-sm text-slate-500 transition hover:text-slate-900" type="button" onClick={onExit}>Log out</button>
  </aside>
}
