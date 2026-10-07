import { useState } from 'react'
import { Icon } from '../common/Icon.jsx'
import { authErrorMessage, useForgotPasswordMutation, useResetPasswordMutation } from '../../redux/Api/auth/AuthApi.js'

export default function PasswordRecovery({ token, onBack, onReset }) {
  const [forgotPassword, { isLoading: sending }] = useForgotPasswordMutation()
  const [resetPassword, { isLoading: resetting }] = useResetPasswordMutation()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [visible, setVisible] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    const form = new FormData(event.currentTarget)
    try {
      if (token) {
        const password = form.get('password')
        if (password !== form.get('confirmPassword')) return setError('Passwords do not match.')
        const result = await resetPassword({ token, password }).unwrap()
        setMessage(result.message)
        onReset()
      } else {
        const result = await forgotPassword(form.get('email').trim()).unwrap()
        setMessage(result.message)
      }
    } catch (failure) { setError(authErrorMessage(failure)) }
  }

  return <div className="auth-panel">
    <p className="auth-lead">{token ? 'Choose a new password to secure your account.' : 'Enter your email and we will send you a link to reset your password.'}</p>
    {!message && <form onSubmit={submit}>
      {token ? <><label>New password<span className="password-field"><input name="password" type={visible ? 'text' : 'password'} autoComplete="new-password" minLength="8" placeholder="New password" required /><button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? 'Hide password' : 'Show password'}><Icon name={visible ? 'eyeOff' : 'eye'} size={18}/></button></span></label><p className="password-hint">At least 8 characters, with uppercase, lowercase and a number.</p><label>Confirm password<input name="confirmPassword" type={visible ? 'text' : 'password'} autoComplete="new-password" placeholder="Repeat new password" required /></label></> : <label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>}
      {error && <div className="auth-error" role="alert">{error}</div>}
      <button className="primary-button auth-submit" type="submit" disabled={sending || resetting}>{sending || resetting ? 'Please wait…' : token ? 'Reset password' : 'Send reset link'}<Icon name="arrow" size={17}/></button>
    </form>}
    {message && <div className="auth-success" role="status"><span>✓</span><p>{message}</p></div>}
    <button className="auth-back" type="button" onClick={onBack}><Icon name="arrow" size={15}/>Back to login</button>
  </div>
}
