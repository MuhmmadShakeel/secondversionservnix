import { useState } from 'react'
import toast from 'react-hot-toast'
import { EmptyState, SurfaceModal } from '../common/UiParts.jsx'
import { ShopProductCard } from './ShopProductCard.jsx'
import { CartPanel } from './CartPanel.jsx'
import { CheckoutForm } from './CheckoutForm.jsx'
import { OrderCard } from './OrderCard.jsx'
import { getStoredUser } from '../../redux/Api/auth/AuthApi.js'
import {
  useAddCartMutation, useAddWishlistMutation, useBrowseProductsQuery,
  useCancelOrderMutation, useCheckoutMutation, useGetCartQuery,
  useGetMyOrdersQuery, useGetWishlistQuery, useRemoveCartMutation,
  useRemoveWishlistMutation, useUpdateCartMutation,
} from '../../redux/Api/product/ProductApi.js'

const tabs = [
  { id: 'discover', label: 'Shop products' },
  { id: 'wishlist', label: 'Wishlist' },
  { id: 'cart', label: 'Cart' },
  { id: 'orders', label: 'My orders' },
]

const matches = (item, search) => [item.title, item.category, item.description].join(' ').toLowerCase().includes(search.trim().toLowerCase())

export function ProductShop({ search, full = false }) {
  const user = getStoredUser()
  const [view, setView] = useState('discover')
  const [showCheckout, setShowCheckout] = useState(false)
  const [cancelTarget, setCancelTarget] = useState(null)
  const browseQuery = useBrowseProductsQuery(undefined, { pollingInterval: 30000 })
  const wishlistQuery = useGetWishlistQuery(undefined, { pollingInterval: 30000 })
  const cartQuery = useGetCartQuery(undefined, { pollingInterval: 30000 })
  const ordersQuery = useGetMyOrdersQuery(undefined, { pollingInterval: 30000 })
  const [addWishlist, { isLoading: addingWish }] = useAddWishlistMutation()
  const [removeWishlist, { isLoading: removingWish }] = useRemoveWishlistMutation()
  const [addCart, { isLoading: addingCart }] = useAddCartMutation()
  const [updateCart, { isLoading: updatingCart }] = useUpdateCartMutation()
  const [removeCart, { isLoading: removingCart }] = useRemoveCartMutation()
  const [checkout, { isLoading: checkingOut }] = useCheckoutMutation()
  const [cancelOrder, { isLoading: cancelling }] = useCancelOrderMutation()
  const wishlist = wishlistQuery.data?.products || []
  const cart = cartQuery.data?.items || []
  const orders = ordersQuery.data?.orders || []
  const wishIds = new Set(wishlist.map((item) => item.id))
  const busy = addingWish || removingWish || addingCart || updatingCart || removingCart
  const products = (view === 'wishlist' ? wishlist : browseQuery.data?.products || []).filter((item) => matches(item, search))

  async function toggleWishlist(product) {
    try {
      if (wishIds.has(product.id)) { await removeWishlist(product.id).unwrap(); toast.success('Removed from wishlist.') }
      else { await addWishlist(product.id).unwrap(); toast.success('Saved to your wishlist.') }
    } catch (error) { toast.error(error?.data?.message || 'Could not update wishlist.') }
  }

  async function addToCart(product) {
    try { await addCart({ id: product.id, quantity: 1 }).unwrap(); toast.success('Added to cart.') }
    catch (error) { toast.error(error?.data?.message || 'Could not add this product to cart.') }
  }

  async function changeQuantity(item, quantity) {
    try { await updateCart({ id: item.id, quantity }).unwrap() }
    catch (error) { toast.error(error?.data?.message || 'Could not update quantity.') }
  }

  async function removeFromCart(item) {
    try { await removeCart(item.id).unwrap(); toast.success('Removed from cart.') }
    catch (error) { toast.error(error?.data?.message || 'Could not remove this item.') }
  }

  async function placeOrder(details) {
    const result = await checkout(details).unwrap()
    toast.success(result.message)
    setShowCheckout(false)
    setView('orders')
  }

  async function confirmCancel() {
    try { await cancelOrder(cancelTarget.id).unwrap(); toast.success('Order cancelled.'); setCancelTarget(null) }
    catch (error) { toast.error(error?.data?.message || 'Could not cancel this order.') }
  }

  const currentQuery = view === 'wishlist' ? wishlistQuery : view === 'cart' ? cartQuery : view === 'orders' ? ordersQuery : browseQuery
  return <section className="content-section listing-section shop-section">
    {full ? <div className="shop-heading"><div><span>THE MARKETPLACE</span><h2>Find something worth keeping.</h2><p>Browse products from independent sellers, save favorites, and order with confidence.</p></div><div className="shop-heading-art" aria-hidden="true">✦</div></div> : <div className="shop-section-title"><h2>Products <span>{browseQuery.data?.products?.length || 0}</span></h2><p>Discover products from the Mart.</p></div>}
    {full && <div className="shop-tabs" role="tablist" aria-label="Product views">{tabs.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={view === tab.id} className={view === tab.id ? 'active' : ''} onClick={() => setView(tab.id)}>{tab.label}{tab.id === 'wishlist' && <span>{wishlist.length}</span>}{tab.id === 'cart' && <span>{cart.length}</span>}{tab.id === 'orders' && <span>{orders.length}</span>}</button>)}</div>}
    {currentQuery.isLoading ? <div className="service-loading" role="status">Loading {view === 'discover' ? 'products' : view}...</div> : currentQuery.isError ? <div className="service-loading" role="alert">Could not load {view}. <button type="button" onClick={currentQuery.refetch}>Try again</button></div> : view === 'cart' ? <CartPanel items={cart} onQuantity={changeQuantity} onRemove={removeFromCart} onCheckout={() => setShowCheckout(true)} busy={busy}/> : view === 'orders' ? orders.length ? <div className="commerce-orders-grid">{orders.map((order) => <OrderCard key={order.id} order={order} mode="mine" busy={cancelling} onAction={setCancelTarget}/>)}</div> : <EmptyState label="No orders yet" detail="Your purchases will appear here after checkout."/> : products.length ? <div className="shop-product-grid">{products.map((product) => <ShopProductCard key={product.id} product={product} wishlisted={wishIds.has(product.id)} isOwner={product.ownerUserId === user?.id} onWishlist={toggleWishlist} onCart={addToCart} busy={busy}/>)}</div> : <EmptyState label={view === 'wishlist' ? wishlist.length ? 'No matching saved products' : 'Your wishlist is empty' : 'No matching products'} detail={view === 'wishlist' ? wishlist.length ? 'Try a different search.' : 'Tap the heart on a product to save it here.' : 'Try another search or check back soon.'}/>}
    {showCheckout && <CheckoutForm items={cart} onClose={() => setShowCheckout(false)} onSubmit={placeOrder} isSaving={checkingOut}/>}
    {cancelTarget && <SurfaceModal title="Cancel order?" onClose={() => setCancelTarget(null)}><p className="delete-copy">Cancel your pending order for <strong>{cancelTarget.productTitle}</strong>? The reserved stock will be returned to the seller.</p><div className="service-form-actions"><button type="button" className="secondary-button" onClick={() => setCancelTarget(null)}>Keep order</button><button type="button" className="delete-button" onClick={confirmCancel} disabled={cancelling}>{cancelling ? 'Cancelling...' : 'Cancel order'}</button></div></SurfaceModal>}
  </section>
}
