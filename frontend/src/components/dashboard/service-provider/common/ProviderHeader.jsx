export default function ProviderHeader({ userName, onExit, onSecurity }) {
  return <header className="flex min-h-20 items-center justify-between border-b border-stone-200 bg-white px-5 sm:px-10">
    <div><p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">Servnix</p><p className="mt-1 text-sm font-semibold text-slate-800">Provider workspace</p></div>
    <div className="flex items-center gap-3"><span className="hidden text-sm font-medium text-slate-600 sm:inline">{userName}</span><button className="rounded-lg px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50" type="button" onClick={onSecurity}>Security</button><button className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-stone-50" type="button" onClick={onExit}>Log out</button></div>
  </header>
}
