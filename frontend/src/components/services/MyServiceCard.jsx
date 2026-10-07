import { Icon } from '../common/Icon.jsx'

const priceFormat = new Intl.NumberFormat('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })

export function MyServiceCard({ service, onEdit, onDelete }) {
  return <article className="service-card my-service-card">
    <div className="card-top"><span className="service-symbol purple"><Icon name="briefcase" size={22}/></span><span className={`status-pill ${service.status}`}>{service.status === 'active' ? 'Active' : 'Draft'}</span></div>
    <span className="card-kicker">{service.category}</span>
    <h3>{service.title}</h3>
    <p>{service.description}</p>
    <div className="my-service-meta"><span>Service ID: {service.id.slice(0, 8)}</span><span>{service.experienceYears} {service.experienceYears === 1 ? 'year' : 'years'} experience</span></div>
    <div className="service-card-footer"><strong>Rs. {priceFormat.format(Number(service.price))}</strong><div className="my-service-actions"><button type="button" onClick={() => onEdit(service)}><Icon name="edit" size={15}/>Edit</button><button type="button" className="danger-action" onClick={() => onDelete(service)}><Icon name="trash" size={15}/>Delete</button></div></div>
  </article>
}
