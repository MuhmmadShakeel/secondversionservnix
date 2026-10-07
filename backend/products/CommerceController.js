import { randomUUID } from 'node:crypto'
import pool from '../common/database/connection.js'
import { ApiError } from '../common/utils/ApiError.js'
import { productIdPattern } from './productValidation.js'

const catalogColumns = `p.id, p.owner_user_id AS "ownerUserId", u.name AS "ownerName",
  p.title, p.category, p.description, p.price, p.quantity, p.status,
  (p.image_content IS NOT NULL) AS "hasImage", p.updated_at AS "updatedAt"`
const orderColumns = `o.id, o.checkout_id AS "checkoutId", o.product_id AS "productId",
  o.buyer_user_id AS "buyerUserId", o.seller_user_id AS "sellerUserId",
  o.product_title AS "productTitle", o.unit_price AS "unitPrice",
  o.quantity, o.total_price AS "totalPrice", o.contact_phone AS "contactPhone",
  o.delivery_address AS "deliveryAddress", o.buyer_note AS "buyerNote",
  o.status, o.created_at AS "createdAt", o.updated_at AS "updatedAt",
  buyer.name AS "buyerName", seller.name AS "sellerName"`
const orderFrom = `FROM product_orders o JOIN users buyer ON buyer.id = o.buyer_user_id
  JOIN users seller ON seller.id = o.seller_user_id`

function validId(value) {
  if (!productIdPattern.test(value || '')) throw new ApiError(400, 'Choose a valid product or order.')
  return value
}

function quantity(value) {
  if (!Number.isInteger(value) || value < 1 || value > 99) throw new ApiError(400, 'Quantity must be between 1 and 99.')
  return value
}

function text(value, label, min, max) {
  if (typeof value !== 'string') throw new ApiError(400, `${label} is required.`)
  const result = value.trim().replace(/\s+/g, ' ')
  if (result.length < min || result.length > max) throw new ApiError(400, `${label} must be between ${min} and ${max} characters.`)
  return result
}

function checkoutDetails(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some((key) => !['contactPhone', 'deliveryAddress', 'buyerNote'].includes(key))) {
    throw new ApiError(400, 'Enter valid checkout details.')
  }
  const contactPhone = text(body.contactPhone, 'Contact number', 7, 30)
  if (!/^\+?[\d\s().-]+$/.test(contactPhone) || (contactPhone.match(/\d/g) || []).length < 7) throw new ApiError(400, 'Enter a valid contact number.')
  return {
    contactPhone,
    deliveryAddress: text(body.deliveryAddress, 'Delivery address', 10, 300),
    buyerNote: body.buyerNote ? text(body.buyerNote, 'Order note', 1, 1000) : null,
  }
}

async function activeProduct(id, userId) {
  const result = await pool.query('SELECT id, owner_user_id, quantity FROM products WHERE id = $1 AND status = $2 AND quantity > 0', [id, 'active'])
  if (!result.rowCount) throw new ApiError(404, 'Active product not found.')
  if (result.rows[0].owner_user_id === userId) throw new ApiError(403, 'You cannot buy your own product.')
  return result.rows[0]
}

export async function listWishlist(request, response, next) {
  try {
    const result = await pool.query(
      `SELECT ${catalogColumns} FROM product_wishlist w JOIN products p ON p.id = w.product_id
       JOIN users u ON u.id = p.owner_user_id WHERE w.user_id = $1 ORDER BY w.created_at DESC`,
      [request.user.id],
    )
    response.json({ products: result.rows })
  } catch (error) { next(error) }
}

export async function addWishlist(request, response, next) {
  try {
    const id = validId(request.params.id)
    await activeProduct(id, request.user.id)
    await pool.query('INSERT INTO product_wishlist (user_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [request.user.id, id])
    response.status(204).end()
  } catch (error) { next(error) }
}

export async function removeWishlist(request, response, next) {
  try {
    await pool.query('DELETE FROM product_wishlist WHERE user_id = $1 AND product_id = $2', [request.user.id, validId(request.params.id)])
    response.status(204).end()
  } catch (error) { next(error) }
}

export async function listCart(request, response, next) {
  try {
    const result = await pool.query(
      `SELECT ${catalogColumns}, c.quantity AS "cartQuantity" FROM product_cart c
       JOIN products p ON p.id = c.product_id JOIN users u ON u.id = p.owner_user_id
       WHERE c.user_id = $1 ORDER BY c.created_at DESC`,
      [request.user.id],
    )
    response.json({ items: result.rows })
  } catch (error) { next(error) }
}

export async function addCart(request, response, next) {
  try {
    const id = validId(request.params.id)
    if (!request.body || Object.keys(request.body).some((key) => key !== 'quantity')) throw new ApiError(400, 'Enter a valid quantity.')
    const count = quantity(request.body.quantity ?? 1)
    const product = await activeProduct(id, request.user.id)
    if (count > product.quantity) throw new ApiError(409, 'Not enough stock is available.')
    const result = await pool.query(
      `INSERT INTO product_cart (user_id, product_id, quantity) VALUES ($1, $2, $3)
       ON CONFLICT (user_id, product_id) DO UPDATE SET quantity = product_cart.quantity + EXCLUDED.quantity, updated_at = NOW()
       WHERE product_cart.quantity + EXCLUDED.quantity <= 99
       AND product_cart.quantity + EXCLUDED.quantity <= (SELECT quantity FROM products WHERE id = $2)
       RETURNING quantity`,
      [request.user.id, id, count],
    )
    if (!result.rowCount) throw new ApiError(409, 'Your cart quantity exceeds available stock.')
    response.json({ quantity: result.rows[0].quantity })
  } catch (error) { next(error) }
}

export async function updateCart(request, response, next) {
  try {
    const id = validId(request.params.id)
    if (!request.body || Object.keys(request.body).length !== 1) throw new ApiError(400, 'Enter a valid quantity.')
    const count = quantity(request.body.quantity)
    const result = await pool.query(
      `UPDATE product_cart c SET quantity = $3, updated_at = NOW()
       WHERE c.user_id = $1 AND c.product_id = $2
       AND EXISTS (SELECT 1 FROM products p WHERE p.id = c.product_id AND p.status = 'active' AND p.quantity >= $3)
       RETURNING c.quantity`,
      [request.user.id, id, count],
    )
    if (!result.rowCount) throw new ApiError(409, 'This item is unavailable or exceeds stock.')
    response.json({ quantity: result.rows[0].quantity })
  } catch (error) { next(error) }
}

export async function removeCart(request, response, next) {
  try {
    await pool.query('DELETE FROM product_cart WHERE user_id = $1 AND product_id = $2', [request.user.id, validId(request.params.id)])
    response.status(204).end()
  } catch (error) { next(error) }
}

export async function checkout(request, response, next) {
  let client
  try {
    const details = checkoutDetails(request.body)
    client = await pool.connect()
    await client.query('BEGIN')
    const cart = await client.query(
      `SELECT c.product_id, c.quantity AS "cartQuantity", p.owner_user_id, p.title, p.price,
       p.quantity AS stock, p.status FROM product_cart c JOIN products p ON p.id = c.product_id
       WHERE c.user_id = $1 ORDER BY c.product_id FOR UPDATE OF c, p`,
      [request.user.id],
    )
    if (!cart.rowCount) throw new ApiError(400, 'Your cart is empty.')
    const checkoutId = randomUUID()
    const orderIds = []
    for (const item of cart.rows) {
      if (item.owner_user_id === request.user.id || item.status !== 'active' || item.stock < item.cartQuantity) {
        throw new ApiError(409, `${item.title} is unavailable or exceeds stock. Update your cart and try again.`)
      }
      await client.query(
        `UPDATE products SET quantity = quantity - $2,
         status = CASE WHEN quantity = $2 THEN 'draft' ELSE status END, updated_at = NOW() WHERE id = $1`,
        [item.product_id, item.cartQuantity],
      )
      const result = await client.query(
        `INSERT INTO product_orders (checkout_id, product_id, buyer_user_id, seller_user_id,
         product_title, unit_price, quantity, total_price, contact_phone, delivery_address, buyer_note)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $6::numeric * $7::integer, $8, $9, $10) RETURNING id`,
        [checkoutId, item.product_id, request.user.id, item.owner_user_id, item.title, item.price,
          item.cartQuantity, details.contactPhone, details.deliveryAddress, details.buyerNote],
      )
      orderIds.push(result.rows[0].id)
    }
    await client.query('DELETE FROM product_cart WHERE user_id = $1', [request.user.id])
    await client.query('COMMIT')
    response.status(201).json({ checkoutId, orderIds, message: 'Order placed. Payment is arranged with each seller.' })
  } catch (error) {
    if (client) await client.query('ROLLBACK')
    next(error)
  } finally { client?.release() }
}

export async function myOrders(request, response, next) {
  try {
    const result = await pool.query(`SELECT ${orderColumns} ${orderFrom} WHERE o.buyer_user_id = $1 ORDER BY o.created_at DESC`, [request.user.id])
    response.json({ orders: result.rows })
  } catch (error) { next(error) }
}

export async function sellerOrders(request, response, next) {
  try {
    const result = await pool.query(`SELECT ${orderColumns} ${orderFrom} WHERE o.seller_user_id = $1 ORDER BY o.created_at DESC`, [request.user.id])
    response.json({ orders: result.rows })
  } catch (error) { next(error) }
}

async function changeOrder(request, response, next, role, status) {
  let client
  try {
    const id = validId(request.params.id)
    client = await pool.connect()
    await client.query('BEGIN')
    const field = role === 'seller' ? 'seller_user_id' : 'buyer_user_id'
    const result = await client.query(`SELECT product_id, quantity, status FROM product_orders WHERE id = $1 AND ${field} = $2 FOR UPDATE`, [id, request.user.id])
    if (!result.rowCount) throw new ApiError(404, 'Order not found.')
    const order = result.rows[0]
    const allowed = role === 'buyer' ? order.status === 'pending' :
      status === 'confirmed' || status === 'rejected' ? order.status === 'pending' : order.status === 'confirmed'
    if (!allowed) throw new ApiError(409, 'This order cannot be changed in its current status.')
    await client.query('UPDATE product_orders SET status = $2, updated_at = NOW() WHERE id = $1', [id, status])
    if (status === 'rejected' || status === 'cancelled') {
      await client.query('UPDATE products SET quantity = quantity + $2, updated_at = NOW() WHERE id = $1', [order.product_id, order.quantity])
    }
    await client.query('COMMIT')
    response.json({ message: `Order ${status}.` })
  } catch (error) {
    if (client) await client.query('ROLLBACK')
    next(error)
  } finally { client?.release() }
}

export function updateSellerOrder(request, response, next) {
  const status = request.body?.status
  if (!request.body || Object.keys(request.body).length !== 1 || !['confirmed', 'fulfilled', 'rejected'].includes(status)) {
    return next(new ApiError(400, 'Choose Confirm, Fulfill, or Reject.'))
  }
  return changeOrder(request, response, next, 'seller', status)
}

export function cancelOrder(request, response, next) {
  return changeOrder(request, response, next, 'buyer', 'cancelled')
}
