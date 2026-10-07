import { Icon } from '../common/Icon.jsx'
import { ProductImage } from './ProductImage.jsx'

const money = new Intl.NumberFormat('en-PK', { maximumFractionDigits: 2 })

export function ShopProductCard({ product, wishlisted, isOwner, onWishlist, onCart, busy }) {
  const available = product.status === 'active' && product.quantity > 0
  return <article className="shop-product-card">
    <div className="shop-product-photo"><ProductImage product={product}/><button type="button" className={`shop-heart ${wishlisted ? 'selected' : ''}`} aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'} aria-pressed={wishlisted} onClick={() => onWishlist(product)} disabled={busy || isOwner}><Icon name="heart" size={18}/></button></div>
    <div className="shop-product-body"><span className="card-kicker">{product.category}</span><h3>{product.title}</h3><p>{product.description}</p><div className="shop-product-seller">By {product.ownerName || 'You'}</div><div className="shop-product-price"><strong>Rs. {money.format(Number(product.price))}</strong><span>{available ? `${product.quantity} available` : 'Unavailable'}</span></div><button className="shop-cart-button" type="button" onClick={() => onCart(product)} disabled={busy || isOwner || !available}><Icon name="bag" size={16}/>{isOwner ? 'Your product' : available ? 'Add to cart' : 'Unavailable'}</button></div>
  </article>
}
