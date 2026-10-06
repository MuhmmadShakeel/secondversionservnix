import Navbar from '../../components/common/Navbar'
import Footer from '../../components/common/Footer'
import Hero from '../../components/home/Hero'
import OrganizationDirectory from '../../components/home/OrganizationDirectory'

export default function HomePage({ user, onHome, onSignup, onLogin, onLogout, onDashboard, onServices, onProfile }) {
  return (
    <>
      <Navbar user={user} onHome={onHome} onSignup={onSignup} onLogin={onLogin} onLogout={onLogout} onDashboard={onDashboard} onServices={onServices} onProfile={onProfile} />
      <main>
        {user?.role === 'customer' && <div className="bg-slate-900 px-[7vw] py-3 text-sm text-white">Welcome back, <strong>{user.name?.split(' ')[0]}</strong>. Find an approved provider for your next home project.</div>}
        <Hero onSignup={onServices} onProviderSignup={onSignup} />
        <OrganizationDirectory onServices={onServices} />
      </main>
      <Footer />
    </>
  )
}
