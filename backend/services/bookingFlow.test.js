import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import app from '../Server.js'
import pool from '../common/database/connection.js'
import { migrate } from '../common/database/migrate.js'

test('buyers request services and only owners decide bookings', async () => {
  await migrate()
  const emails = ['owner', 'buyer', 'other'].map((name) => `${name}-${randomUUID()}@example.com`)
  const server = app.listen(0)
  const base = `http://127.0.0.1:${server.address().port}`
  const send = (method, path, token, body) => fetch(`${base}${path}`, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  try {
    const tokens = []
    for (const [index, email] of emails.entries()) {
      assert.equal((await send('POST', '/v1/auth/signup', null, { name: ['Provider', 'Buyer', 'Other'][index], email, password: 'StrongPass123' })).status, 201)
      tokens.push((await (await send('POST', '/v1/auth/login', null, { email, password: 'StrongPass123' })).json()).token)
    }
    const [ownerToken, buyerToken, otherToken] = tokens
    const serviceBody = { title: 'Home cleaning', category: 'Home Services', description: 'Complete home cleaning service', price: '2500.00', experienceYears: 3, status: 'active' }
    const service = (await (await send('POST', '/v1/services', ownerToken, serviceBody)).json()).service
    const bookingBody = { contactPhone: '+92 300 1234567', serviceAddress: '12 Main Street, Lahore', requestDetails: 'Please clean the house on the weekend.', preferredDate: '2026-12-12' }

    assert.equal((await send('POST', `/v1/services/${service.id}/bookings`, null, bookingBody)).status, 401)
    assert.equal((await send('POST', `/v1/services/${service.id}/bookings`, ownerToken, bookingBody)).status, 403)
    assert.equal((await send('POST', `/v1/services/${service.id}/bookings`, buyerToken, { ...bookingBody, serviceAddress: 'short' })).status, 400)
    const created = await send('POST', `/v1/services/${service.id}/bookings`, buyerToken, bookingBody)
    assert.equal(created.status, 201)
    const booking = (await created.json()).booking
    assert.equal(booking.serviceId, service.id)
    assert.equal(booking.buyerName, 'Buyer')
    assert.equal(booking.ownerName, 'Provider')
    assert.equal(booking.status, 'pending')
    assert.equal((await send('POST', `/v1/services/${service.id}/bookings`, buyerToken, bookingBody)).status, 409)

    const received = (await (await send('GET', '/v1/services/bookings/received', ownerToken)).json()).bookings
    assert.equal(received.some((item) => item.id === booking.id), true)
    assert.equal((await (await send('GET', '/v1/services/bookings/received', otherToken)).json()).bookings.some((item) => item.id === booking.id), false)
    assert.equal((await (await send('GET', '/v1/services/bookings/mine', buyerToken)).json()).bookings.some((item) => item.id === booking.id), true)
    assert.equal((await send('PATCH', `/v1/services/bookings/${booking.id}/decision`, buyerToken, { status: 'approved' })).status, 404)
    assert.equal((await send('PATCH', `/v1/services/bookings/${booking.id}/decision`, otherToken, { status: 'approved' })).status, 404)
    const approved = await send('PATCH', `/v1/services/bookings/${booking.id}/decision`, ownerToken, { status: 'approved' })
    assert.equal(approved.status, 200)
    assert.equal((await approved.json()).booking.status, 'approved')
    assert.equal((await send('PATCH', `/v1/services/bookings/${booking.id}/decision`, ownerToken, { status: 'rejected' })).status, 404)
    assert.equal((await send('PATCH', `/v1/services/bookings/${booking.id}/cancel`, buyerToken)).status, 404)
    assert.equal((await send('DELETE', `/v1/services/${service.id}`, ownerToken)).status, 409)

    const second = (await (await send('POST', `/v1/services/${service.id}/bookings`, buyerToken, bookingBody)).json()).booking
    const rejected = await send('PATCH', `/v1/services/bookings/${second.id}/decision`, ownerToken, { status: 'rejected' })
    assert.equal(rejected.status, 200)
    assert.equal((await rejected.json()).booking.status, 'rejected')
    const third = (await (await send('POST', `/v1/services/${service.id}/bookings`, buyerToken, bookingBody)).json()).booking
    const cancelled = await send('PATCH', `/v1/services/bookings/${third.id}/cancel`, buyerToken)
    assert.equal(cancelled.status, 200)
    assert.equal((await cancelled.json()).booking.status, 'cancelled')
  } finally {
    await pool.query('DELETE FROM users WHERE email = ANY($1)', [emails])
    await new Promise((resolve) => server.close(resolve))
  }
})
