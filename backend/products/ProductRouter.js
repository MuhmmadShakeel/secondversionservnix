import { Router } from 'express'
import { browseProducts, createProduct, deleteProduct, getProductImage, listMyProducts, updateProduct } from './ProductController.js'
import {
  addCart, addWishlist, cancelOrder, checkout, listCart, listWishlist,
  myOrders, removeCart, removeWishlist, sellerOrders, updateCart, updateSellerOrder,
} from './CommerceController.js'

const router = Router()
router.get('/', listMyProducts)
router.post('/', createProduct)
router.get('/browse', browseProducts)
router.get('/wishlist', listWishlist)
router.post('/wishlist/:id', addWishlist)
router.delete('/wishlist/:id', removeWishlist)
router.get('/cart', listCart)
router.post('/cart/:id', addCart)
router.put('/cart/:id', updateCart)
router.delete('/cart/:id', removeCart)
router.post('/checkout', checkout)
router.get('/orders/mine', myOrders)
router.get('/orders/sales', sellerOrders)
router.patch('/orders/:id/status', updateSellerOrder)
router.patch('/orders/:id/cancel', cancelOrder)
router.get('/:id/image', getProductImage)
router.put('/:id', updateProduct)
router.delete('/:id', deleteProduct)

export default router
