import { PageHeader } from '../components/common/PageHeader.jsx'
import { Icon } from '../components/common/Icon.jsx'

const actions = [
  { icon: 'bag', title: 'Buy', text: 'Find services and products that fit what you need.', action: 'Explore listings', page: 'listings', tone: 'purple' },
  { icon: 'briefcase', title: 'Sell', text: 'Share your skills or products with the right people.', action: 'My services', page: 'services', tone: 'blue' },
  { icon: 'arrows', title: 'Bid', text: 'Discover open requirements and pitch your expertise.', action: 'Explore hiring', page: 'hiring', tone: 'orange' },
]

export function TradePage({ onNavigate }) {
  return <><PageHeader eyebrow="MAKE YOUR MOVE" title="Buy, sell & bid" description="However you want to participate, there is a place for you here."/><div className="trade-intro"><span className="eyebrow">ONE ACCOUNT. MORE POSSIBILITIES.</span><h2>Everything starts with a connection.</h2><p>Use the same workspace to find what you need, offer what you do, and respond to opportunities.</p></div><div className="trade-grid">{actions.map((item, index) => <article className="trade-card" key={item.title}><span className="trade-number">0{index + 1}</span><span className={`trade-icon ${item.tone}`}><Icon name={item.icon} size={27}/></span><h3>{item.title}</h3><p>{item.text}</p><button onClick={() => onNavigate(item.page)}>{item.action}<Icon name="arrow" size={17}/></button></article>)}</div><div className="process-panel"><h2>How it comes together</h2><div className="process-steps"><div><span>1</span><strong>Create your space</strong><p>Show your work and what you are looking for.</p></div><div><span>2</span><strong>Discover a match</strong><p>Explore listings or respond to open requirements.</p></div><div><span>3</span><strong>Start a conversation</strong><p>Move forward when you find the right fit.</p></div></div></div></>
}
