import Navbar from '../../components/common/Navbar'
import Footer from '../../components/common/Footer'
import { useGetProfileQuery } from '../../redux/Api/auth/AuthApi.js'
import AccountProfile from '../../components/common/AccountProfile.jsx'
import CustomerBookings from '../../components/common/CustomerBookings.jsx'
import NotificationsPanel from '../../components/common/NotificationsPanel.jsx'
import ChangePassword from '../../components/common/ChangePassword.jsx'

export default function ProfilePage({ user, onHome, onSignup, onLogin, onLogout, onDashboard, onServices, onUserUpdate }) {
  const { data: profileData, isLoading: profileLoading, error: profileError } = useGetProfileQuery()
  const profile = profileData?.user || user

  return <>
    <Navbar user={user} onHome={onHome} onSignup={onSignup} onLogin={onLogin} onLogout={onLogout} onDashboard={onDashboard} onServices={onServices} onProfile={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
    <main className="min-h-screen bg-[#fbf8f9] px-5 py-12 text-slate-900 sm:px-10"><div className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Your account</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">My profile</h1><p className="mt-3 text-sm text-slate-600">Keep your details current and track every appointment request.</p></div><button className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-stone-50" type="button" onClick={onServices}>Explore services</button></div>
      {profileLoading ? <div className="rounded-xl border border-stone-200 bg-white p-8 text-sm text-slate-500">Loading profile...</div> : profileError ? <div className="rounded-xl border border-stone-200 bg-white p-8 text-sm text-slate-600">Could not load your profile. Please refresh the page.</div> : <AccountProfile user={profile} onUserUpdate={onUserUpdate} />}
      <ChangePassword />
      <CustomerBookings onServices={onServices} />
      <NotificationsPanel />
    </div></main>
    <Footer />
  </>
}
