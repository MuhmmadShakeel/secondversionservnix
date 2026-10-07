import { useState } from 'react'
import { SurfaceModal } from '../common/UiParts.jsx'
import { Icon } from '../common/Icon.jsx'
import { authErrorMessage } from '../../redux/Api/auth/AuthApi.js'

export function ProposalForm({ requirement, proposal, onSave, onClose, isSaving }) {
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setError('')
    const form = new FormData(event.currentTarget)
    try {
      await onSave({ coverLetter: form.get('coverLetter').trim(), bidAmount: form.get('bidAmount'), deliveryDays: Number(form.get('deliveryDays')) })
    } catch (failure) { setError(authErrorMessage(failure)) }
  }

  return <SurfaceModal title={proposal ? 'Edit proposal' : 'Send a proposal'} onClose={onClose}>
    <form className="hiring-form" onSubmit={submit}>
      <p className="form-intro">{proposal ? 'Update your offer while this project is open.' : `Tell the client how you would approach “${requirement?.title}”.`}</p>
      <label>Your proposal<textarea name="coverLetter" defaultValue={proposal?.coverLetter || ''} minLength="30" maxLength="3000" rows="6" placeholder="Explain your approach, relevant experience and what you will deliver..." required /></label>
      <div className="hiring-form-row"><label>Your bid (Rs.)<input name="bidAmount" type="number" min="0" max="9999999999.99" step="0.01" defaultValue={proposal?.bidAmount ?? ''} required /></label><label>Delivery time (days)<input name="deliveryDays" type="number" min="1" max="365" step="1" defaultValue={proposal?.deliveryDays ?? ''} required /></label></div>
      {error && <div className="auth-error" role="alert">{error}</div>}
      <div className="service-form-actions"><button className="secondary-button" type="button" onClick={onClose}>Cancel</button><button className="primary-button" type="submit" disabled={isSaving}><Icon name="arrow" size={17}/>{isSaving ? 'Sending…' : proposal ? 'Save proposal' : 'Send proposal'}</button></div>
    </form>
  </SurfaceModal>
}
