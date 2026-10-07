import { useState } from 'react'
import { SurfaceModal } from '../common/UiParts.jsx'
import { Icon } from '../common/Icon.jsx'
import { authErrorMessage } from '../../redux/Api/auth/AuthApi.js'

const money = new Intl.NumberFormat('en-PK', { maximumFractionDigits: 2 })

export function BookingForm({ service, onClose, onSave, isSaving }) {
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setError('')
    const form = new FormData(event.currentTarget)
    try {
      await onSave({
        contactPhone: form.get('contactPhone').trim(),
        serviceAddress: form.get('serviceAddress').trim(),
        requestDetails: form.get('requestDetails').trim(),
        preferredDate: form.get('preferredDate') || null,
      })
    } catch (failure) { setError(authErrorMessage(failure)) }
  }

  return <SurfaceModal title="Book this service" onClose={onClose}>
    <div className="booking-service-summary"><span>BOOKING REQUEST</span><h3>{service.title}</h3><p>By {service.ownerName}</p><strong>Rs. {money.format(Number(service.price))}</strong><small>Service ID: {service.id}</small></div>
    <form className="service-form" onSubmit={submit}>
      <p className="form-intro">Share how the provider can reach you and what you need. The provider will review your request before it is confirmed.</p>
      <label>Contact number<input name="contactPhone" type="tel" minLength="7" maxLength="30" autoComplete="tel" placeholder="e.g. +92 300 1234567" required /></label>
      <label>Service address<input name="serviceAddress" minLength="10" maxLength="300" autoComplete="street-address" placeholder="Where should the service be delivered?" required /></label>
      <label>Booking details<textarea name="requestDetails" minLength="10" maxLength="2000" rows="4" placeholder="Describe the work, timing and any important instructions" required /></label>
      <label>Preferred date (optional)<input name="preferredDate" type="date" /></label>
      {error && <div className="auth-error" role="alert">{error}</div>}
      <div className="service-form-actions"><button className="secondary-button" type="button" onClick={onClose}>Cancel</button><button className="primary-button" type="submit" disabled={isSaving}><Icon name="arrow" size={17}/>{isSaving ? 'Sending...' : 'Send booking request'}</button></div>
    </form>
  </SurfaceModal>
}
