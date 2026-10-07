import { Icon } from '../common/Icon.jsx'
import { ProductImage } from './ProductImage.jsx'
import { EmptyState } from '../common/UiParts.jsx'

const money = new Intl.NumberFormat('en-PK', { maximumFractionDigits: 2 })

export function CartPanel({ items, onQuantity, onRemove, onCheckout, busy }) {
  if (!items.length) return <EmptyState label="Your cart is empty" detail="Add a product from the shop to start an order."/>
  const total = items.reduce((sum, item) => sum + Number(item.price) * item.cartQuantity, 0)
  const unavailable = items.some((item) => item.status !== 'active' || item.quantity < item.cartQuantity)
  return <div className="shop-cart-layout"><div className="shop-cart-list">{items.map((item) => <article className="shop-cart-item" key={item.id}><ProductImage product={item}/><div><span className="card-kicker">{item.category}</span><h3>{item.title}</h3><p>Sold by {item.ownerName}</p><strong>Rs. {money.format(Number(item.price))}</strong>{(item.status !== 'active' || item.quantity < item.cartQuantity) && <span className="shop-stock-warning">Stock changed. Remove or update this item.</span>}</div><div className="shop-cart-controls"><div><button type="button" aria-label={`Decrease ${item.title} quantity`} disabled={busy || item.cartQuantity <= 1} onClick={() => onQuantity(item, item.cartQuantity - 1)}>−</button><span>{item.cartQuantity}</span><button type="button" aria-label={`Increase ${item.title} quantity`} disabled={busy || item.cartQuantity >= item.quantity || item.cartQuantity >= 99 || item.status !== 'active'} onClick={() => onQuantity(item, item.cartQuantity + 1)}>+</button></div><button type="button" className="shop-cart-remove" onClick={() => onRemove(item)} disabled={busy}><Icon name="trash" size={15}/> Remove</button></div></article>)}</div><aside className="shop-order-summary"><span>ORDER SUMMARY</span><h3>{items.length} {items.length === 1 ? 'item' : 'items'}</h3><div><span>Subtotal</span><strong>Rs. {money.format(total)}</strong></div><p>Shipping and payment are arranged directly with each seller after the order is confirmed.</p><button className="primary-button" type="button" disabled={busy || unavailable} onClick={onCheckout}>Continue to checkout <Icon name="arrow" size={16}/></button></aside></div>
}
