import { Icon } from '../common/Icon.jsx'
import { ProductImage } from './ProductImage.jsx'

const money = new Intl.NumberFormat('en-PK', { maximumFractionDigits: 2 })

export function MyProductCard({ product, onEdit, onDelete }) {
  return <article className="seller-product-card">
    <ProductImage product={product}/>
    <div className="seller-product-body">
      <div className="seller-product-top"><span className="card-kicker">{product.category}</span><span className={`status-pill ${product.status}`}>{product.status === 'active' ? 'Active' : 'Draft'}</span></div>
      <h3>{product.title}</h3>
      <p>{product.description}</p>
      <div className="seller-product-facts"><strong>Rs. {money.format(Number(product.price))}</strong><span>{product.quantity} in stock</span></div>
      <div className="seller-product-actions"><button type="button" onClick={() => onEdit(product)}><Icon name="edit" size={15}/> Edit</button><button type="button" className="danger-action" onClick={() => onDelete(product)}><Icon name="trash" size={15}/> Delete</button></div>
    </div>
  </article>
}
