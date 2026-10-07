import { useState } from 'react'
import { Icon } from '../common/Icon.jsx'
import { SurfaceModal } from '../common/UiParts.jsx'
import { authErrorMessage } from '../../redux/Api/auth/AuthApi.js'

export function ServiceForm({ service, onClose, onSave, isSaving }) {
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setError('')
    const form = new FormData(event.currentTarget)
    const details = {
      title: form.get('title').trim(),
      category: form.get('category').trim(),
      description: form.get('description').trim(),
      price: form.get('price'),
      experienceYears: Number(form.get('experienceYears')),
      status: form.get('status'),
    }
    try { await onSave(details) } catch (failure) { setError(authErrorMessage(failure)) }
  }

  return <SurfaceModal title={service ? 'Edit service' : 'Add a service'} onClose={onClose}>
    <form className="service-form" onSubmit={submit}>
      <p className="form-intro">Give people a clear picture of what you offer. You can change these details later.</p>
      <label>Service title<input name="title" defaultValue={service?.title || ''} minLength="3" maxLength="120" placeholder="e.g. Brand identity design" required /></label>
      <label>Category<input name="category" defaultValue={service?.category || ''} minLength="2" maxLength="80" list="service-categories" placeholder="Choose or enter a category" required /><datalist id="service-categories"><option value="Design & Creative"/><option value="Technology"/><option value="Writing"/><option value="Marketing"/><option value="Home Services"/><option value="Education"/></datalist></label>
      <label>Description<textarea name="description" defaultValue={service?.description || ''} minLength="10" maxLength="2000" rows="5" placeholder="What will the client receive? What makes your service valuable?" required /></label>
      <div className="service-form-row"><label>Price (Rs.)<input name="price" type="number" min="0" max="9999999999.99" step="0.01" defaultValue={service?.price ?? ''} placeholder="0.00" required /></label><label>Experience (years)<input name="experienceYears" type="number" min="0" max="60" step="1" defaultValue={service?.experienceYears ?? 0} required /></label></div>
      <label>Status<select name="status" defaultValue={service?.status || 'draft'}><option value="draft">Draft</option><option value="active">Active</option></select></label>
      {error && <div className="auth-error" role="alert">{error}</div>}
      <div className="service-form-actions"><button className="secondary-button" type="button" onClick={onClose}>Cancel</button><button className="primary-button" type="submit" disabled={isSaving}><Icon name="check" size={17}/>{isSaving ? 'Saving…' : service ? 'Save changes' : 'Create service'}</button></div>
    </form>
  </SurfaceModal>
}
