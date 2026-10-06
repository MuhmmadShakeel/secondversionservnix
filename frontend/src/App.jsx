import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import AOS from 'aos'
import 'aos/dist/aos.css'
import HomePage from './pages/customerpage/HomePage'
import ServicesPage from './pages/customerpage/ServicesPage'
import ProfilePage from './pages/customerpage/ProfilePage'
import AuthenticationPage from './pages/customerpage/AuthenticationPage'
import AccountSecurityPage from './pages/customerpage/AccountSecurityPage.jsx'
import ServiceProviderDashboardPage from './pages/dashboardpage/ServiceProviderDashboardPage'
import AdminDashboardPage from './pages/dashboardpage/AdminDashboardPage'
import EmployeeDashboardPage from './pages/dashboardpage/EmployeeDashboardPage'
import AdminShell from './components/dashboard/admin/common/AdminShell'
import ProviderShell from './components/dashboard/service-provider/common/ProviderShell'
import { authApi, clearSession, getAccessToken, getStoredUser, saveSession, useLogoutMutation } from './redux/Api/auth/AuthApi.js'
import { organizationApi } from './redux/Api/service-provider/OrganizationApi.js'
import { adminApi } from './redux/Api/admin/AdminApi.js'
import { bookingApi } from './redux/Api/booking/BookingApi.js'
import { notificationApi } from './redux/Api/notification/NotificationApi.js'
import { reviewApi } from './redux/Api/review/ReviewApi.js'
import { employeeApi } from './redux/Api/employee/EmployeeApi.js'
import { providerEmployeeApi } from './redux/Api/service-provider/ProviderEmployeeApi.js'
import { dutyApi } from './redux/Api/employee/DutyApi.js'

const routes = {
  home: '/',
  login: '/login',
  signup: '/signup',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  accountSecurity: '/account/security',
  services: '/services',
  profile: '/profile',
  provider: '/provider',
  admin: '/admin',
  employee: '/employee',
  employeeProfile: '/employee/profile',
  employeeDuties: '/employee/duties',
  organization: '/provider/organization',
  providerBookings: '/provider/bookings',
  providerEmployees: '/provider/employees',
  providerDuties: '/provider/duties',
  providerProfile: '/provider/profile',
}

function getCurrentPath() {
  return window.location.pathname.replace(/\/$/, '') || routes.home
}

export default function App() {
  const dispatch = useDispatch()
  const [logout] = useLogoutMutation()
  const [currentPath, setCurrentPath] = useState(getCurrentPath)
  const [dashboardUser, setDashboardUser] = useState(getStoredUser)
  const [adminSection, setAdminSection] = useState('overview')
  const [postLoginRoute, setPostLoginRoute] = useState(null)

  useEffect(() => {
    AOS.init({ duration: 700, once: true, offset: 50, easing: 'ease-out-cubic' })
  }, [])

  useEffect(() => {
    const syncPath = () => setCurrentPath(getCurrentPath())
    window.addEventListener('popstate', syncPath)
    return () => window.removeEventListener('popstate', syncPath)
  }, [])

  useEffect(() => {
    if (window.location.pathname.replace(/\/$/, '') === '/customer') {
      window.history.replaceState({}, '', routes.home)
    }
  }, [])

  useEffect(() => {
    let active = true
    async function refreshAccount() {
      const token = getAccessToken()
      if (!token) return
      try {
        const response = await fetch('/v1/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        if (response.status === 401) {
          if (active) {
            clearSession()
            setDashboardUser(null)
            dispatch(authApi.util.resetApiState())
            dispatch(organizationApi.util.resetApiState())
            dispatch(adminApi.util.resetApiState())
            dispatch(bookingApi.util.resetApiState())
            dispatch(notificationApi.util.resetApiState())
            dispatch(reviewApi.util.resetApiState())
            dispatch(employeeApi.util.resetApiState())
            dispatch(providerEmployeeApi.util.resetApiState())
            dispatch(dutyApi.util.resetApiState())
            if (![routes.login, routes.signup, routes.forgotPassword, routes.resetPassword].includes(getCurrentPath())) {
              window.history.replaceState({}, '', routes.login)
              setCurrentPath(routes.login)
            }
          }
          return
        }
        if (!response.ok) return
        const { user } = await response.json()
        if (active && user) {
          saveSession({ token, user })
          setDashboardUser(user)
        }
      } catch { /* Keep the current view when the connection is temporarily unavailable. */ }
    }
    refreshAccount()
    window.addEventListener('focus', refreshAccount)
    return () => { active = false; window.removeEventListener('focus', refreshAccount) }
  }, [dispatch])

  function navigate(path) {
    if (getCurrentPath() !== path) window.history.pushState({}, '', path)
    setCurrentPath(path)
  }

  const showHome = () => navigate(routes.home)
  const showLogin = () => navigate(routes.login)
  const showSignup = () => navigate(routes.signup)
  const showForgotPassword = () => navigate(routes.forgotPassword)
  const showServices = () => navigate(routes.services)
  const showProfile = () => navigate(routes.profile)
  const requireLoginForBooking = () => { setPostLoginRoute(routes.services); showLogin() }
  const updateCurrentUser = (user) => {
    saveSession({ token: getAccessToken(), user })
    setDashboardUser(user)
  }
  const signOut = async () => {
    try { await logout().unwrap() } catch { /* Clear the local session even if the server is unavailable. */ }
    clearSession()
    dispatch(authApi.util.resetApiState())
    dispatch(organizationApi.util.resetApiState())
    dispatch(adminApi.util.resetApiState())
    dispatch(bookingApi.util.resetApiState())
    dispatch(notificationApi.util.resetApiState())
    dispatch(reviewApi.util.resetApiState())
    dispatch(employeeApi.util.resetApiState())
    dispatch(providerEmployeeApi.util.resetApiState())
    dispatch(dutyApi.util.resetApiState())
    setDashboardUser(null)
    showHome()
  }

  const showDashboard = (user) => {
    setDashboardUser(user)
    if (user.role === 'platform_admin') {
      navigate(routes.admin)
      return
    }

    if (user.role === 'service_provider') {
      navigate(routes.provider)
      return
    }

    if (user.role === 'employee') {
      navigate(routes.employee)
      return
    }

    navigate(postLoginRoute || routes.home)
    setPostLoginRoute(null)
  }

  const commonPageProps = { user: dashboardUser, onHome: showHome, onSignup: showSignup, onLogin: showLogin, onLogout: signOut,
    onDashboard: () => navigate(dashboardUser?.role === 'platform_admin' ? routes.admin : dashboardUser?.role === 'employee' ? routes.employee : routes.provider),
    onServices: showServices, onProfile: showProfile }

  if ([routes.login, routes.signup, routes.forgotPassword, routes.resetPassword].includes(currentPath)) {
    const mode = currentPath === routes.signup ? 'signup' : currentPath === routes.forgotPassword ? 'forgot' : currentPath === routes.resetPassword ? 'reset' : 'login'
    return <AuthenticationPage mode={mode} onBack={showHome} onLogin={showLogin} onSignup={showSignup} onForgotPassword={showForgotPassword} onAuthenticated={showDashboard} />
  }
  if ([routes.provider, routes.organization, routes.providerBookings, routes.providerEmployees, routes.providerDuties, routes.providerProfile, routes.admin, routes.employee, routes.employeeProfile, routes.employeeDuties, routes.profile, routes.accountSecurity].includes(currentPath) && (!getAccessToken() || !dashboardUser)) {
    return <AuthenticationPage mode="login" onBack={showHome} onLogin={showLogin} onSignup={showSignup} onForgotPassword={showForgotPassword} onAuthenticated={showDashboard} />
  }
  if (currentPath === routes.accountSecurity) return <AccountSecurityPage onBack={() => navigate(dashboardUser.role === 'platform_admin' ? routes.admin : dashboardUser.role === 'employee' ? routes.employeeProfile : dashboardUser.role === 'customer' ? routes.profile : routes.provider)} />
  if (currentPath === routes.admin && dashboardUser.role !== 'platform_admin') return <HomePage {...commonPageProps} />
  if ([routes.employee, routes.employeeProfile, routes.employeeDuties].includes(currentPath) && dashboardUser.role !== 'employee') return <HomePage {...commonPageProps} />
  if ([routes.provider, routes.organization, routes.providerBookings, routes.providerEmployees, routes.providerDuties, routes.providerProfile].includes(currentPath) && dashboardUser.role !== 'service_provider') return <HomePage {...commonPageProps} />
  if (currentPath === routes.profile && dashboardUser.role !== 'customer') return <HomePage {...commonPageProps} />
  if ([routes.provider, routes.organization, routes.providerBookings, routes.providerEmployees, routes.providerDuties, routes.providerProfile].includes(currentPath)) {
    const providerSection = currentPath === routes.providerBookings ? 'bookings' : currentPath === routes.providerEmployees ? 'employees' : currentPath === routes.providerDuties ? 'duties' : currentPath === routes.providerProfile ? 'profile' : 'organization'
    return <ProviderShell userName={dashboardUser?.name || 'Service provider'} onExit={signOut} onSecurity={() => navigate(routes.accountSecurity)} section={providerSection} onSectionChange={(section) => navigate(section === 'bookings' ? routes.providerBookings : section === 'employees' ? routes.providerEmployees : section === 'duties' ? routes.providerDuties : section === 'profile' ? routes.providerProfile : routes.organization)}><ServiceProviderDashboardPage section={providerSection} user={dashboardUser} onUserUpdate={updateCurrentUser} /></ProviderShell>
  }
  if (currentPath === routes.admin) return <AdminShell userName={dashboardUser?.name || 'Administrator'} onExit={signOut} onSecurity={() => navigate(routes.accountSecurity)} section={adminSection} onSectionChange={setAdminSection}><AdminDashboardPage currentUserId={dashboardUser?.id} section={adminSection} onSectionChange={setAdminSection} user={dashboardUser} onUserUpdate={updateCurrentUser} /></AdminShell>
  if ([routes.employee, routes.employeeProfile, routes.employeeDuties].includes(currentPath)) return <EmployeeDashboardPage user={dashboardUser} section={currentPath === routes.employeeProfile ? 'profile' : currentPath === routes.employeeDuties ? 'duties' : 'overview'} onSectionChange={(section) => navigate(section === 'profile' ? routes.employeeProfile : section === 'duties' ? routes.employeeDuties : routes.employee)} onExit={signOut} onUserUpdate={updateCurrentUser} />
  if (currentPath === routes.services) return <ServicesPage {...commonPageProps} onRequireLogin={requireLoginForBooking} />
  if (currentPath === routes.profile) return <ProfilePage {...commonPageProps} onUserUpdate={updateCurrentUser} />
  return <HomePage {...commonPageProps} />
}
