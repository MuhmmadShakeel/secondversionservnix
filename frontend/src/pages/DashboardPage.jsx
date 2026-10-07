import { Icon } from '../components/common/Icon.jsx'
import { PrimaryButton, SectionTitle } from '../components/common/UiParts.jsx'
import { JobCard, ProductCard } from '../components/common/Cards.jsx'
import { jobs, products } from '../data/mockData.js'

const stats = [
  { label: 'My services', value: '03', note: '2 active listings', icon: 'briefcase', tone: 'purple' },
  { label: 'Open requirements', value: '02', note: 'Finding the right fit', icon: 'users', tone: 'blue' },
  { label: 'Active bids', value: '05', note: 'Across your activity', icon: 'arrows', tone: 'orange' },
]

export function DashboardPage({ onNavigate }) {
  return <><div className="hero-panel" data-aos="fade-up"><div className="hero-copy"><span className="hero-eyebrow"><Icon name="spark" size={15}/> YOUR WORKSPACE</span><h1>Good things happen<br/>when we <em>connect.</em></h1><p>Offer what you do best, find the right people, and discover something new. It all starts here.</p><div className="hero-actions"><PrimaryButton icon="plus" onClick={() => onNavigate('services')}>Add a service</PrimaryButton><button className="hero-secondary" onClick={() => onNavigate('listings')}>Explore listings <Icon name="arrow" size={17}/></button></div></div><div className="hero-visual" aria-hidden="true"><div className="orb orb-one"/><div className="orb orb-two"/><div className="float-card float-card-one"><span className="float-icon">✳</span><span><strong>Make it happen</strong><small>Find your next opportunity</small></span></div><div className="float-card float-card-two"><span className="float-avatars"><i>A</i><i>M</i><i>+</i></span><span>People are connecting</span></div></div></div>
    <div className="stats-grid" data-aos="fade-up" data-aos-delay="60">{stats.map((stat) => <div className="stat-card" key={stat.label}><div className="stat-head"><span>{stat.label}</span><span className={`stat-icon ${stat.tone}`}><Icon name={stat.icon} size={20}/></span></div><strong>{stat.value}</strong><small>{stat.note}</small></div>)}</div>
    <section className="content-section" data-aos="fade-up"><SectionTitle title="Your next opportunity" description="Fresh requirements from people ready to work together." action="View all jobs" onAction={() => onNavigate('hiring')}/><div className="job-grid">{jobs.slice(0, 2).map((job) => <JobCard key={job.title} job={job}/>)}</div></section>
    <section className="content-section" data-aos="fade-up"><SectionTitle title="Explore the mart" description="Thoughtful finds from independent sellers." action="Visit mart" onAction={() => onNavigate('mart')}/><div className="product-grid">{products.map((product) => <ProductCard key={product.title} product={product}/>)}</div></section></>
}
