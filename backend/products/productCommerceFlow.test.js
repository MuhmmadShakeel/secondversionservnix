import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import app from '../Server.js'
import pool from '../common/database/connection.js'
import { migrate } from '../common/database/migrate.js'

const image = { fileName: 'item.png', mimeType: 'image/png', base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7N2h8AAAAASUVORK5CYII=' }

test('buyers browse, wish, cart, and order products; seller manages orders', async () => {
  await migrate()
  const emails = ['seller', 'buyer', 'other'].map((name) => `${name}-${randomUUID()}@example.com`)
  const server = app.listen(0)
  const base = `http://127.0.0.1:${server.address().port}`
  const send = (method, path, token, body) => fetch(`${base}${path}`, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  try {
    const tokens = []
    for (const email of emails) {
      assert.equal((await send('POST', '/v1/auth/signup', null, { name: 'Commerce User', email, password: 'StrongPass123' })).status, 201)
      tokens.push((await (await send('POST', '/v1/auth/login', null, { email, password: 'StrongPass123' })).json()).token)
    }
    const [seller, buyer, other] = tokens
    const details = { title: 'Handmade mug', category: 'Home', description: 'A handmade ceramic mug with a smooth glaze.', price: '1250.00', quantity: 4, status: 'active', image }
    const product = (await (await send('POST', '/v1/products', seller, details)).json()).product
    assert.equal((await send('GET', '/v1/products/browse')).status, 401)
    const browse = (await (await send('GET', '/v1/products/browse', buyer)).json()).products
    assert.equal(browse.find((item) => item.id === product.id)?.ownerName, 'Commerce User')
    assert.equal((await send('GET', `/v1/products/${product.id}/image`, buyer)).status, 200)

    assert.equal((await send('POST', `/v1/products/wishlist/${product.id}`, seller)).status, 403)
    assert.equal((await send('POST', `/v1/products/wishlist/${product.id}`, buyer)).status, 204)
    assert.equal((await (await send('GET', '/v1/products/wishlist', buyer)).json()).products.some((item) => item.id === product.id), true)
    assert.equal((await (await send('GET', '/v1/products/wishlist', other)).json()).products.some((item) => item.id === product.id), false)

    assert.equal((await send('POST', `/v1/products/cart/${product.id}`, seller, { quantity: 1 })).status, 403)
    assert.equal((await send('POST', `/v1/products/cart/${product.id}`, buyer, { quantity: 2 })).status, 200)
    assert.equal((await send('DELETE', `/v1/products/cart/${product.id}`, buyer)).status, 204)
    assert.equal((await send('POST', `/v1/products/cart/${product.id}`, buyer, { quantity: 2 })).status, 200)
    assert.equal((await send('PUT', `/v1/products/cart/${product.id}`, buyer, { quantity: 3 })).status, 200)
    assert.equal((await (await send('GET', '/v1/products/cart', buyer)).json()).items.find((item) => item.id === product.id)?.cartQuantity, 3)
    assert.equal((await send('PUT', `/v1/products/cart/${product.id}`, buyer, { quantity: 5 })).status, 409)
    const checkout = await send('POST', '/v1/products/checkout', buyer, { contactPhone: '+92 300 1234567', deliveryAddress: '12 Main Street, Lahore', buyerNote: 'Please pack safely.' })
    assert.equal(checkout.status, 201)
    const receipt = await checkout.json()
    assert.equal(receipt.orderIds.length, 1)
    assert.equal((await (await send('GET', '/v1/products/cart', buyer)).json()).items.length, 0)
    const sale = (await (await send('GET', '/v1/products/orders/sales', seller)).json()).orders.find((item) => item.id === receipt.orderIds[0])
    assert.equal(sale.quantity, 3)
    assert.equal(sale.totalPrice, '3750.00')
    assert.equal(sale.deliveryAddress, '12 Main Street, Lahore')
    assert.equal((await (await send('GET', '/v1/products/orders/sales', other)).json()).orders.some((item) => item.id === sale.id), false)
    assert.equal((await (await send('GET', '/v1/products/orders/mine', buyer)).json()).orders.some((item) => item.id === sale.id), true)
    assert.equal((await send('PATCH', `/v1/products/orders/${sale.id}/status`, other, { status: 'confirmed' })).status, 404)
    assert.equal((await send('PATCH', `/v1/products/orders/${sale.id}/status`, seller, { status: 'confirmed' })).status, 200)
    assert.equal((await send('PATCH', `/v1/products/orders/${sale.id}/cancel`, buyer)).status, 409)
    assert.equal((await send('PATCH', `/v1/products/orders/${sale.id}/status`, seller, { status: 'fulfilled' })).status, 200)

    assert.equal((await send('POST', `/v1/products/cart/${product.id}`, buyer, { quantity: 1 })).status, 200)
    const second = await send('POST', '/v1/products/checkout', buyer, { contactPhone: '+92 300 1234567', deliveryAddress: '12 Main Street, Lahore' })
    assert.equal(second.status, 201)
    const secondOrderId = (await second.json()).orderIds[0]
    assert.equal((await send('GET', '/v1/products/browse', buyer)).status, 200)
    assert.equal((await (await send('GET', '/v1/products/browse', buyer)).json()).products.some((item) => item.id === product.id), false)
    assert.equal((await send('PATCH', `/v1/products/orders/${secondOrderId}/status`, seller, { status: 'rejected' })).status, 200)
    assert.equal((await send('PUT', `/v1/products/${product.id}`, seller, { ...details, quantity: 1, image: undefined })).status, 200)
    assert.equal((await send('POST', `/v1/products/cart/${product.id}`, buyer, { quantity: 1 })).status, 200)
    const third = await send('POST', '/v1/products/checkout', buyer, { contactPhone: '+92 300 1234567', deliveryAddress: '12 Main Street, Lahore' })
    assert.equal(third.status, 201)
    const thirdOrderId = (await third.json()).orderIds[0]
    assert.equal((await send('PATCH', `/v1/products/orders/${thirdOrderId}/cancel`, buyer)).status, 200)
    assert.equal((await (await send('GET', '/v1/products/orders/sales', seller)).json()).orders.find((item) => item.id === thirdOrderId)?.status, 'cancelled')
    assert.equal((await send('DELETE', `/v1/products/${product.id}`, seller)).status, 409)
    assert.equal((await send('DELETE', `/v1/products/wishlist/${product.id}`, buyer)).status, 204)
  } finally {
    await pool.query('DELETE FROM users WHERE email = ANY($1)', [emails])
    await new Promise((resolve) => server.close(resolve))
  }
})
