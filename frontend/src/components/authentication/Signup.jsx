import { useState } from 'react'
import toast from 'react-hot-toast'
import { Icon } from '../common/Icon.jsx'
import { authErrorMessage, useSignupMutation } from '../../redux/Api/auth/AuthApi.js'

export default function Signup({ onSwitch, onRegistered }) {
  const [signup, { isLoading }] = useSignupMutation()
  const [error, setError] = useState('')
  const [visible, setVisible] = useState(false)

  function showError(message) {
    setError(message)
    toast.error(message)
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    const form = new FormData(event.currentTarget)
    const password = form.get('password')
    if (password !== form.get('confirmPassword')) return showError('Passwords do not match.')
    if (password.length < 8 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
      return showError('Use at least 8 characters with uppercase, lowercase and a number.')
    }
    try {
      const result = await signup({ name: form.get('name').trim(), email: form.get('email').trim(), password }).unwrap()
      toast.success('Account created successfully. Please log in.')
      onRegistered(result.user.email)
    } catch (failure) { showError(authErrorMessage(failure)) }
  }

  return <div className="auth-panel">
    <p className="auth-lead">One account to offer your skills, hire talent and explore the mart.</p>
    <form onSubmit={submit}>
      <label>Full name<input name="name" type="text" autoComplete="name" minLength="2" maxLength="120" placeholder="Your full name" required /></label>
      <label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
      <label>Password<span className="password-field"><input name="password" type={visible ? 'text' : 'password'} autoComplete="new-password" minLength="8" placeholder="Create a strong password" required /><button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? 'Hide password' : 'Show password'}><Icon name={visible ? 'eyeOff' : 'eye'} size={18}/></button></span></label>
      <p className="password-hint">At least 8 characters, with uppercase, lowercase and a number.</p>
      <label>Confirm password<input name="confirmPassword" type={visible ? 'text' : 'password'} autoComplete="new-password" placeholder="Enter password again" required /></label>
      {error && <div className="auth-error" role="alert">{error}</div>}
      <button className="primary-button auth-submit" type="submit" disabled={isLoading}>{isLoading ? 'Creating account…' : 'Create account'}<Icon name="arrow" size={17}/></button>
    </form>
    <div className="auth-divider"><span>Already a member?</span></div>
    <button className="auth-switch" type="button" onClick={onSwitch}>Log in instead <Icon name="arrow" size={16}/></button>
  </div>
}
