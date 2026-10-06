import EmployeeHeader from './EmployeeHeader.jsx'
import EmployeeSidebar from './EmployeeSidebar.jsx'

export default function EmployeeShell({ user, section, onSectionChange, onExit, children }) {
  return <div className="flex min-h-screen bg-[#fbf8f9] text-slate-900"><EmployeeSidebar user={user} section={section} onSectionChange={onSectionChange} onExit={onExit} /><div className="min-w-0 flex-1"><EmployeeHeader user={user} onProfile={() => onSectionChange('profile')} onExit={onExit} /><main className="mx-auto max-w-6xl px-5 py-8 sm:px-9"><nav className="mb-7 flex flex-wrap gap-2 lg:hidden" aria-label="Employee sections">{[['overview', 'Overview'], ['duties', 'My duties'], ['profile', 'My profile']].map(([id, label]) => <button className={`rounded-xl px-4 py-2 text-sm font-semibold ${section === id ? 'bg-rose-600 text-white' : 'border border-stone-200 bg-white text-slate-600'}`} type="button" key={id} onClick={() => onSectionChange(id)}>{label}</button>)}</nav>{children}</main></div></div>
}
