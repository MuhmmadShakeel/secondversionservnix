import { useState } from 'react'
import { Icon } from './Icon.jsx'

export function PrimaryButton({ children, icon = 'plus', onClick }) {
  return <button className="primary-button" type="button" onClick={onClick}><Icon name={icon} size={17} />{children}</button>
}

export function SectionTitle({ title, description, action, onAction }) {
  return <div className="section-title"><div><h2>{title}</h2>{description && <p>{description}</p>}</div>{action && <button className="link-button" onClick={onAction}>{action}<Icon name="arrow" size={16} /></button>}</div>
}

export function SearchBox({ value, onChange, placeholder = 'Search anything...' }) {
  return <label className="search-box"><Icon name="search" size={19} /><input aria-label="Search" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label>
}

export function EmptyState({ label = 'No matching results', detail = 'Try a different search or category.' }) {
  return <div className="empty-state"><span><Icon name="search" size={26} /></span><h3>{label}</h3><p>{detail}</p></div>
}

export function SurfaceModal({ title, children, onClose }) {
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="surface-modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}><div className="modal-heading"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close"><Icon name="close" /></button></div>{children}</section></div>
}

export function DraftForm({ kind, onClose }) {
  const [submitted, setSubmitted] = useState(false)
  const isRequirement = kind === 'requirement'
  const isProduct = kind === 'product'
  return <SurfaceModal title={isRequirement ? 'Post a requirement' : isProduct ? 'List a product' : 'Add a service'} onClose={onClose}>{submitted ? <div className="form-success"><span>✓</span><h3>UI preview complete</h3><p>This design is ready for the future save flow. No data has been submitted.</p><PrimaryButton icon="arrow" onClick={onClose}>Done</PrimaryButton></div> : <form className="draft-form" onSubmit={(event) => { event.preventDefault(); setSubmitted(true) }}><p className="form-intro">Add the details people need to understand your {isRequirement ? 'project' : isProduct ? 'product' : 'service'}.</p><label>{isRequirement ? 'Requirement title' : isProduct ? 'Product name' : 'Service title'}<input required placeholder={isRequirement ? 'e.g. Need a website designer' : isProduct ? 'e.g. Handmade ceramic vase' : 'e.g. Brand identity design'} /></label><label>Category<select required defaultValue=""><option value="" disabled>Select category</option><option>Design & Creative</option><option>Technology</option><option>Marketing</option><option>Home & Living</option><option>Other</option></select></label><div className="form-row"><label>{isRequirement ? 'Budget (Rs.)' : 'Price (Rs.)'}<input required type="number" min="0" placeholder="0" /></label>{!isRequirement && !isProduct && <label>Experience<input placeholder="e.g. 4 years" /></label>}</div><label>Description<textarea required rows="4" placeholder="Tell people a little more..." /></label><div className="media-upload-row"><label className="media-upload"><Icon name="image" size={18} />Photo<input type="file" accept="image/*" /></label><label className="media-upload"><Icon name="video" size={18} />Video<input type="file" accept="video/*" /></label><label className="media-upload"><Icon name="mic" size={18} />Voice pitch<input type="file" accept="audio/*" /></label></div><div className="form-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><PrimaryButton icon="arrow">Preview</PrimaryButton></div></form>}</SurfaceModal>
}
