import { Icon } from '../common/Icon.jsx'
import { formatBudget } from './formatBudget.js'

export function RequirementCard({ item, mode, onView, onEdit, onDelete }) {
  return <article className="hiring-card">
    <div className="hiring-card-top"><span className="hiring-category">{item.category}</span><span className={`hiring-status ${item.status}`}>{item.status}</span></div>
    <h3>{item.title}</h3>
    <p>{item.description}</p>
    <div className="hiring-card-facts"><span><Icon name="bag" size={15}/>{formatBudget(item)}</span><span><Icon name="users" size={15}/>{item.proposalCount} {item.proposalCount === 1 ? 'proposal' : 'proposals'}</span></div>
    <div className="hiring-card-bottom"><span>Posted by {item.ownerName}{item.media?.length ? ` · ${item.media.length} attachment${item.media.length > 1 ? 's' : ''}` : ''}</span><button type="button" onClick={() => onView(item)}>View details <Icon name="arrow" size={15}/></button></div>
    {mode === 'mine' && <div className="hiring-owner-actions"><button type="button" onClick={() => onView(item)}>Review proposals</button>{item.status !== 'awarded' && <button type="button" onClick={() => onEdit(item)}>Edit</button>}<button type="button" className="danger-action" onClick={() => onDelete(item)}>Delete</button></div>}
  </article>
}
