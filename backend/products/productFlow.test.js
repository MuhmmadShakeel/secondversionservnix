import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import app from '../Server.js'
import pool from '../common/database/connection.js'
import { migrate } from '../common/database/migrate.js'

const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7N2h8AAAAASUVORK5CYII='

test('seller manages own products and image while other users cannot access them', async () => {
  await migrate()
  const emails = ['seller', 'other'].map((name) => `${name}-${randomUUID()}@example.com`)
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
      assert.equal((await send('POST', '/v1/auth/signup', null, { name: 'Product User', email, password: 'StrongPass123' })).status, 201)
      tokens.push((await (await send('POST', '/v1/auth/login', null, { email, password: 'StrongPass123' })).json()).token)
    }
    const [sellerToken, otherToken] = tokens
    const details = { title: 'Ceramic mug', category: 'Home & Living', description: 'Handcrafted ceramic mug with a glazed finish.', price: '1250.00', quantity: 3, status: 'draft' }
    const image = { fileName: 'mug.png', mimeType: 'image/png', base64: pngBase64 }
    assert.equal((await send('POST', '/v1/products', null, details)).status, 401)
    assert.equal((await send('POST', '/v1/products', sellerToken, { ...details, status: 'active' })).status, 400)
    assert.equal((await send('POST', '/v1/products', sellerToken, { ...details, image: { ...image, base64: Buffer.from('not an image').toString('base64') } })).status, 400)

    const created = await send('POST', '/v1/products', sellerToken, { ...details, image })
    assert.equal(created.status, 201)
    const product = (await created.json()).product
    assert.equal(product.hasImage, true)
    assert.equal('image_content' in product, false)
    assert.equal((await (await send('GET', '/v1/products', sellerToken)).json()).products.some((item) => item.id === product.id), true)
    assert.equal((await (await send('GET', '/v1/products', otherToken)).json()).products.some((item) => item.id === product.id), false)
    assert.equal((await send('GET', `/v1/products/${product.id}/image`, otherToken)).status, 404)
    const imageResponse = await send('GET', `/v1/products/${product.id}/image`, sellerToken)
    assert.equal(imageResponse.status, 200)
    assert.equal(imageResponse.headers.get('content-type'), 'image/png')
    assert.deepEqual(Buffer.from(await imageResponse.arrayBuffer()), Buffer.from(pngBase64, 'base64'))
    assert.equal((await send('PUT', `/v1/products/${product.id}`, otherToken, { ...details, title: 'Changed' })).status, 404)
    assert.equal((await send('DELETE', `/v1/products/${product.id}`, otherToken)).status, 404)

    assert.equal((await send('PUT', `/v1/products/${product.id}`, sellerToken, { ...details, quantity: 0, status: 'active' })).status, 400)
    const published = await send('PUT', `/v1/products/${product.id}`, sellerToken, { ...details, status: 'active' })
    assert.equal(published.status, 200)
    assert.equal((await published.json()).product.status, 'active')
    assert.equal((await send('PUT', `/v1/products/${product.id}`, sellerToken, { ...details, status: 'active', image: null })).status, 400)
    const draft = await send('PUT', `/v1/products/${product.id}`, sellerToken, { ...details, image: null })
    assert.equal(draft.status, 200)
    assert.equal((await draft.json()).product.hasImage, false)
    assert.equal((await send('GET', `/v1/products/${product.id}/image`, sellerToken)).status, 404)
    assert.equal((await send('DELETE', `/v1/products/${product.id}`, sellerToken)).status, 204)
  } finally {
    await pool.query('DELETE FROM users WHERE email = ANY($1)', [emails])
    await new Promise((resolve) => server.close(resolve))
  }
})
