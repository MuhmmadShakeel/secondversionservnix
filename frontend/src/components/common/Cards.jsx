import { Icon } from './Icon.jsx'

export function ServiceCard({ service }) {
  return <article className="service-card"><div className="card-top"><span className={`service-symbol ${service.tone}`}>{service.icon}</span><span className={`status-pill ${service.status.toLowerCase()}`}>{service.status}</span></div><span className="card-kicker">{service.category}</span><h3>{service.title}</h3><p>{service.detail}</p><div className="service-card-footer"><div><strong>{service.price}</strong><small>{service.unit}</small></div><span className="card-meta">{service.experience}</span></div></article>
}

export function JobCard({ job }) {
  return <article className="job-card"><div className="job-card-top"><span className={`job-avatar ${job.tone}`}>{job.initials}</span><span className="job-posted"><Icon name="clock" size={14}/>{job.posted}</span></div><span className="card-kicker">{job.category}</span><h3>{job.title}</h3><p>{job.description}</p><div className="job-card-footer"><strong>{job.budget}</strong><span>{job.bids} proposals</span></div></article>
}

export function ProductCard({ product }) {
  return <article className="product-card"><div className={`product-art ${product.tone}`}><span>{product.icon}</span></div><div className="product-info"><span className="card-kicker">{product.category}</span><h3>{product.title}</h3><p>by {product.seller}</p><strong>{product.price}</strong></div></article>
}
