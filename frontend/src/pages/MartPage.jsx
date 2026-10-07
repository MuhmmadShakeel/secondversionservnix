import { useState } from 'react'
import toast from 'react-hot-toast'
import { PageHeader } from '../components/common/PageHeader.jsx'
import { EmptyState, PrimaryButton, SearchBox, SurfaceModal } from '../components/common/UiParts.jsx'
import { Icon } from '../components/common/Icon.jsx'
import { MyProductCard } from '../components/products/MyProductCard.jsx'
import { ProductForm } from '../components/products/ProductForm.jsx'
import { OrderCard } from '../components/products/OrderCard.jsx'
import { useAuthToken } from '../redux/Api/auth/AuthApi.js'
import { useCreateProductMutation, useDeleteProductMutation, useGetMyProductsQuery, useGetSalesOrdersQuery, useUpdateProductMutation, useUpdateSalesOrderMutation } from '../redux/Api/product/ProductApi.js'

export function MartPage() {
  const token = useAuthToken()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All products')
  const [tab, setTab] = useState('products')
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [orderAction, setOrderAction] = useState(null)
  const { data, isLoading, isError, refetch } = useGetMyProductsQuery(undefined, { skip: !token, pollingInterval: 30000 })
  const ordersQuery = useGetSalesOrdersQuery(undefined, { skip: !token, pollingInterval: 30000 })
  const [createProduct, { isLoading: creating }] = useCreateProductMutation()
  const [updateProduct, { isLoading: updating }] = useUpdateProductMutation()
  const [deleteProduct, { isLoading: removing }] = useDeleteProductMutation()
  const [updateSalesOrder, { isLoading: changingOrder }] = useUpdateSalesOrderMutation()
  const products = data?.products || []
  const activeCount = products.filter((product) => product.status === 'active').length
  const orders = ordersQuery.data?.orders || []
  const pendingCount = orders.filter((order) => order.status === 'pending').length
  const visible = products.filter((product) =>
    (filter === 'All products' || product.status === filter.toLowerCase()) &&
    [product.title, product.category, product.description].join(' ').toLowerCase().includes(search.toLowerCase()),
  )

  function openCreate() { setEditing(null); setShowForm(true) }
  function openEdit(product) { setEditing(product); setShowForm(true) }

  async function save(details) {
    if (editing) await updateProduct({ id: editing.id, ...details }).unwrap()
    else await createProduct(details).unwrap()
    toast.success(editing ? 'Product updated.' : 'Product created.')
    setShowForm(false)
    setEditing(null)
  }

  async function confirmDelete() {
    try {
      await deleteProduct(deleting.id).unwrap()
      toast.success('Product deleted.')
      setDeleting(null)
    } catch (error) { toast.error(error?.data?.message || 'Could not delete this product.') }
  }

  async function confirmOrderAction() {
    try {
      await updateSalesOrder({ id: orderAction.order.id, status: orderAction.status }).unwrap()
      toast.success(orderAction.status === 'confirmed' ? 'Order confirmed.' : orderAction.status === 'fulfilled' ? 'Order marked fulfilled.' : 'Order declined.')
      setOrderAction(null)
    } catch (error) { toast.error(error?.data?.message || 'Could not update this order.') }
  }

  return <>
    <PageHeader eyebrow="YOUR STORE" title="Mart" description="Manage your products and every order in one place." action={token && tab === 'products' && <PrimaryButton onClick={openCreate}>Add product</PrimaryButton>}/>
    {!token ? <EmptyState label="Log in to manage products" detail="Use Log in in the top bar to add and manage your products."/> : <>
      <div className="mart-seller-hero"><div><span><Icon name="bag" size={17}/> YOUR PRODUCT STUDIO</span><h2>Bring your products to life.</h2><p>Build a clear listing with a strong photo, price and stock. Keep it in Draft until it is ready.</p><button type="button" onClick={openCreate}>Create a product <Icon name="arrow" size={17}/></button></div><div className="mart-seller-stats"><div><strong>{products.length}</strong><span>Total products</span></div><div><strong>{activeCount}</strong><span>Active listings</span></div></div></div>
      <div className="service-tabs" role="tablist" aria-label="Mart views"><button type="button" role="tab" aria-selected={tab === 'products'} className={tab === 'products' ? 'active' : ''} onClick={() => setTab('products')}>My products <span>{products.length}</span></button><button type="button" role="tab" aria-selected={tab === 'orders'} className={tab === 'orders' ? 'active' : ''} onClick={() => setTab('orders')}>Sales orders <span>{pendingCount}</span></button></div>
      {tab === 'products' ? <>
      <div className="toolbar"><SearchBox value={search} onChange={setSearch} placeholder="Search your products..."/><div className="segmented-control">{['All products', 'Active', 'Draft'].map((item) => <button key={item} type="button" className={filter === item ? 'selected' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div></div>
      {isLoading ? <div className="service-loading" role="status">Loading your products...</div> : isError ? <div className="service-loading" role="alert">Could not load your products. <button type="button" onClick={refetch}>Try again</button></div> : visible.length ? <div className="seller-product-grid">{visible.map((product) => <MyProductCard key={product.id} product={product} onEdit={openEdit} onDelete={setDeleting}/>)}</div> : <EmptyState label={products.length ? 'No matching products' : 'Your products start here'} detail={products.length ? 'Try another search or status filter.' : 'Add your first product with a photo, price and stock details.'}/>}
      </> : ordersQuery.isLoading ? <div className="service-loading" role="status">Loading sales orders...</div> : ordersQuery.isError ? <div className="service-loading" role="alert">Could not load orders. <button type="button" onClick={ordersQuery.refetch}>Try again</button></div> : orders.length ? <div className="commerce-orders-grid">{orders.map((order) => <OrderCard key={order.id} order={order} mode="sales" busy={changingOrder} onAction={(item, status) => setOrderAction({ order: item, status })}/>)}</div> : <EmptyState label="No sales orders yet" detail="Orders for your active products will appear here."/>}
    </>}
    {showForm && <ProductForm key={editing?.id || 'new'} product={editing} onClose={() => setShowForm(false)} onSave={save} isSaving={creating || updating}/>}
    {deleting && <SurfaceModal title="Delete product?" onClose={() => setDeleting(null)}><p className="delete-copy">This will permanently remove <strong>{deleting.title}</strong> and its image.</p><div className="service-form-actions"><button className="secondary-button" type="button" onClick={() => setDeleting(null)}>Keep product</button><button className="delete-button" type="button" disabled={removing} onClick={confirmDelete}>{removing ? 'Deleting...' : 'Delete product'}</button></div></SurfaceModal>}
    {orderAction && <SurfaceModal title={orderAction.status === 'confirmed' ? 'Confirm order?' : orderAction.status === 'fulfilled' ? 'Mark fulfilled?' : 'Decline order?'} onClose={() => setOrderAction(null)}><p className="delete-copy">{orderAction.status === 'confirmed' ? 'Confirm' : orderAction.status === 'fulfilled' ? 'Mark as fulfilled' : 'Decline'} the order for <strong>{orderAction.order.productTitle}</strong>?</p><div className="service-form-actions"><button className="secondary-button" type="button" onClick={() => setOrderAction(null)}>Go back</button><button className={orderAction.status === 'rejected' ? 'delete-button' : 'primary-button'} type="button" disabled={changingOrder} onClick={confirmOrderAction}>{changingOrder ? 'Working...' : 'Continue'}</button></div></SurfaceModal>}
  </>
}
