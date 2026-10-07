import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import toast from 'react-hot-toast'
import { Icon } from './Icon.jsx'
import { SurfaceModal } from './UiParts.jsx'
import Login from '../authentication/Login.jsx'
import Signup from '../authentication/Signup.jsx'
import PasswordRecovery from '../authentication/PasswordRecovery.jsx'
import { authApi, clearSession, getAccessToken, getStoredUser, saveSession, useLogoutMutation, useMeQuery } from '../../redux/Api/auth/AuthApi.js'
import { serviceApi } from '../../redux/Api/service/ServiceApi.js'
import { hiringApi } from '../../redux/Api/hiring/HiringApi.js'
import { productApi } from '../../redux/Api/product/ProductApi.js'

const resetTokenFromUrl = () => new URLSearchParams(window.location.search).get('token') || ''

export function Navbar() {
  const dispatch = useDispatch()
  const [token, setToken] = useState(getAccessToken)
  const [localUser, setLocalUser] = useState(getStoredUser)
  const [resetToken, setResetToken] = useState(resetTokenFromUrl)
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [panel, setPanel] = useState(() => resetTokenFromUrl() ? 'recovery' : null)
  const [logout, { isLoading: loggingOut }] = useLogoutMutation()
  const { data, error } = useMeQuery(token, { skip: !token })
  const user = token && error?.status !== 401 ? data?.user || localUser : null

  useEffect(() => {
    if (error?.status === 401) clearSession()
  }, [error])

  function authenticated(session) {
    dispatch(serviceApi.util.resetApiState())
    dispatch(hiringApi.util.resetApiState())
    dispatch(productApi.util.resetApiState())
    saveSession(session)
    setToken(session.token)
    setLocalUser(session.user)
    setRegisteredEmail('')
    setPanel(null)
  }

  function registered(email) {
    setRegisteredEmail(email)
    setPanel('login')
  }

  async function signOut() {
    let serverSignedOut = false
    try {
      await logout(token).unwrap()
      serverSignedOut = true
    } catch { /* Still clear the local session if the server cannot be reached. */ }
    clearSession()
    setToken(null)
    setLocalUser(null)
    setPanel(null)
    dispatch(authApi.util.resetApiState())
    dispatch(serviceApi.util.resetApiState())
    dispatch(hiringApi.util.resetApiState())
    dispatch(productApi.util.resetApiState())
    if (serverSignedOut) toast.success('You have logged out.')
    else toast.error('Signed out on this device. The server could not confirm logout.')
  }

  function clearResetLink() {
    window.history.replaceState({}, '', window.location.pathname)
    setResetToken('')
  }

  const title = panel === 'signup' ? 'Join Servnix' : panel === 'login' ? 'Welcome back' : panel === 'recovery' ? resetToken ? 'Set a new password' : 'Reset your password' : 'Your profile'

  return <>
    <header className="topbar">
      <div className="topbar-left"><span className="topbar-greeting">Your marketplace, all in one place.</span></div>
      <div className="topbar-actions">
        {user ? <><span className="topbar-user">Hi, {user.name.split(' ')[0]}</span><button className="logout-button" type="button" onClick={signOut} disabled={loggingOut}>{loggingOut ? 'Logging out…' : 'Log out'}</button></> : <><button className="text-button" type="button" onClick={() => setPanel('login')}>Log in</button>{!registeredEmail && <button className="signup-button" type="button" onClick={() => setPanel('signup')}>Sign up <Icon name="arrow" size={16} /></button>}</>}
        <button className="profile-button" type="button" aria-label="Profile" onClick={() => setPanel('profile')}><Icon name="user" size={19} /></button>
      </div>
    </header>
    {panel && <SurfaceModal title={title} onClose={() => { if (resetToken) clearResetLink(); setPanel(null) }}>
      {panel === 'login' && <Login onSwitch={() => setPanel('signup')} onForgot={() => setPanel('recovery')} onAuthenticated={authenticated} registeredEmail={registeredEmail} />}
      {panel === 'signup' && <Signup onSwitch={() => setPanel('login')} onRegistered={registered} />}
      {panel === 'recovery' && <PasswordRecovery token={resetToken} onBack={() => { clearResetLink(); setPanel('login') }} onReset={clearResetLink} />}
      {panel === 'profile' && (user ? <div className="profile-preview"><span><Icon name="user" size={28}/></span><h3>{user.name}</h3><p>{user.email}</p><button className="secondary-button" type="button" onClick={signOut} disabled={loggingOut}>{loggingOut ? 'Logging out…' : 'Log out'}</button></div> : <div className="profile-preview"><span><Icon name="user" size={28}/></span><h3>Your workspace is ready</h3><p>{registeredEmail ? 'Your account is ready. Log in to continue.' : 'Log in or create an account to make this dashboard yours.'}</p><button className="primary-button" type="button" onClick={() => setPanel(registeredEmail ? 'login' : 'signup')}>{registeredEmail ? 'Log in' : 'Get started'} <Icon name="arrow" size={16}/></button></div>)}
    </SurfaceModal>}
  </>
}
