import { navigation } from '../../config/navigation.js'
import { Icon } from './Icon.jsx'

export function Sidebar({ activePage, onNavigate }) {
  return <aside className="sidebar" aria-label="Workspace sidebar">
    <button className="brand" type="button" onClick={() => onNavigate('overview')} aria-label="Servnix overview">
      <span className="brand-mark">S<span>.</span></span>
      <span>servnix<span className="brand-dot">.</span></span>
    </button>

    <div className="workspace-card">
      <span className="workspace-avatar">S</span>
      <span className="workspace-card-copy"><strong>My workspace</strong><small>All your activity in one place</small></span>
    </div>

    <div className="sidebar-navigation">
      <p className="nav-label">MENU</p>
      <nav className="side-nav" aria-label="Dashboard navigation">
        {navigation.map(({ id, label, icon }) => <button
          key={id}
          type="button"
          className={`nav-item ${activePage === id ? 'active' : ''}`}
          onClick={() => onNavigate(id)}
          aria-current={activePage === id ? 'page' : undefined}
        ><Icon name={icon} size={20} /><span>{label}</span><Icon name="chevron" size={15} className="nav-chevron" /></button>)}
      </nav>
    </div>

    <div className="sidebar-bottom">
      <span className="sidebar-tip-icon"><Icon name="spark" size={21} /></span>
      <strong>Ready to offer a service?</strong>
      <p>Add your skills, price and experience so people can find you.</p>
      <button type="button" onClick={() => onNavigate('services')}>View my services <Icon name="arrow" size={16} /></button>
    </div>
    <div className="sidebar-footer">Servnix workspace</div>
  </aside>
}
