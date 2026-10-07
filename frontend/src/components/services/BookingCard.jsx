import { Icon } from '../common/Icon.jsx'

const money = new Intl.NumberFormat('en-PK', { maximumFractionDigits: 2 })
const labels = { pending: 'Pending review', approved: 'Approved', rejected: 'Rejected', cancelled: 'Cancelled' }

export function BookingCard({ booking, mode, onDecision, onCancel, busy }) {
  const isOwner = mode === 'received'
  const date = booking.preferredDate ? String(booking.preferredDate).slice(0, 10) : null
  return <article className="booking-card">
    <div className="booking-card-head"><div><span className="card-kicker">{isOwner ? 'NEW SERVICE REQUEST' : 'YOUR BOOKING'}</span><h3>{booking.serviceTitle}</h3></div><span className={`booking-status ${booking.status}`}>{labels[booking.status]}</span></div>
    <div className="booking-card-people"><Icon name="user" size={16}/><span>{isOwner ? `Requested by ${booking.buyerName}` : `Provider: ${booking.ownerName}`}</span></div>
    <p className="booking-card-details">{booking.requestDetails}</p>
    <div className="booking-facts"><span><strong>Price</strong> Rs. {money.format(Number(booking.agreedPrice))}</span><span><strong>Preferred date</strong> {date || 'Flexible'}</span><span><strong>Contact</strong> {booking.contactPhone}</span><span><strong>Address</strong> {booking.serviceAddress}</span></div>
    <div className="booking-card-footer"><small>Booking ID: {booking.id}</small>{booking.status === 'pending' && (isOwner ? <div><button type="button" className="secondary-button" disabled={busy} onClick={() => onDecision(booking, 'rejected')}>Reject</button><button type="button" className="primary-button" disabled={busy} onClick={() => onDecision(booking, 'approved')}>Approve booking</button></div> : <button type="button" className="secondary-button" disabled={busy} onClick={() => onCancel(booking)}>Cancel request</button>)}</div>
  </article>
}
