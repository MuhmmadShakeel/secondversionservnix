const primaryButton = 'rounded-full bg-[#d93777] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#c52d69]'

export default function Navbar({ user, onHome, onSignup, onLogin, onLogout, onDashboard, onServices, onProfile }) {
  return (
    <header className="sticky top-0 z-10 flex h-[82px] items-center justify-between border-b border-[#f4e5eb] bg-white/95 px-[7vw] backdrop-blur">
      <a className="flex items-center gap-2 text-[21px] font-bold tracking-tight" href="/" onClick={(event) => { event.preventDefault(); onHome() }}>
        <span className="grid size-8 place-items-center rounded-xl bg-[#dd3f7d] font-display text-xl italic text-white">S</span>
        servnix
      </a>
      <nav className="hidden gap-7 text-sm text-[#70515f] md:flex">
        <a href="/#how-it-works">How it works</a><a href="/services" onClick={(event) => { event.preventDefault(); onServices() }}>Find services</a><a href="/#providers">For providers</a>
      </nav>
      <div className="flex items-center gap-3">
        {user ? <><span className="hidden text-sm font-semibold text-slate-700 sm:inline">Hi, {user.name?.split(' ')[0]}</span>{user.role === 'customer' ? <button className={primaryButton} type="button" onClick={onProfile}>My profile</button> : <button className={primaryButton} type="button" onClick={onDashboard}>Dashboard</button>}<button className="text-sm font-semibold text-slate-600 hover:text-slate-900" type="button" onClick={onLogout}>Log out</button></> : <><a className="text-sm text-[#6d4b5b] transition hover:text-[#cc326e]" href="/login" onClick={(event) => { event.preventDefault(); onLogin() }}>Log in</a><a className={primaryButton} href="/signup" onClick={(event) => { event.preventDefault(); onSignup() }}>Get started</a></>}
      </div>
    </header>
  )
}
