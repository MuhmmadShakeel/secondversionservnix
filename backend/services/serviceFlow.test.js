import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import app from '../Server.js'
import pool from '../common/database/connection.js'
import { migrate } from '../common/database/migrate.js'

test('service CRUD is visible and mutable only to its owner', async () => {
  await migrate()
  const emailOne = `owner-${randomUUID()}@example.com`
  const emailTwo = `other-${randomUUID()}@example.com`
  const server = app.listen(0)
  const base = `http://127.0.0.1:${server.address().port}`
  const request = (method, path, token, body) => fetch(`${base}${path}`, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const payload = { title: 'Brand design', category: 'Creative', description: 'Complete brand identity and guidelines', price: '1500.00', experienceYears: 4, status: 'active' }
  try {
    for (const email of [emailOne, emailTwo]) {
      assert.equal((await request('POST', '/v1/auth/signup', null, { name: 'Service User', email, password: 'StrongPass123' })).status, 201)
    }
    const ownerToken = (await (await request('POST', '/v1/auth/login', null, { email: emailOne, password: 'StrongPass123' })).json()).token
    const otherToken = (await (await request('POST', '/v1/auth/login', null, { email: emailTwo, password: 'StrongPass123' })).json()).token
    const owner = (await (await request('GET', '/v1/auth/me', ownerToken)).json()).user

    assert.equal((await request('GET', '/v1/services')).status, 401)
    const created = await request('POST', '/v1/services', ownerToken, payload)
    assert.equal(created.status, 201)
    const { service } = await created.json()
    assert.match(service.id, /^[0-9a-f-]{36}$/)
    assert.equal(service.ownerUserId, owner.id)
    assert.equal(service.title, payload.title)

    assert.equal((await request('GET', '/v1/services/browse')).status, 401)
    const browse = await (await request('GET', '/v1/services/browse', otherToken)).json()
    assert.equal(browse.services.find((item) => item.id === service.id)?.ownerName, 'Service User')

    const ownList = await (await request('GET', '/v1/services', ownerToken)).json()
    assert.equal(ownList.services.length, 1)
    const otherList = await (await request('GET', '/v1/services', otherToken)).json()
    assert.equal(otherList.services.length, 0)
    assert.equal((await request('GET', `/v1/services/${service.id}`, otherToken)).status, 404)
    assert.equal((await request('PUT', `/v1/services/${service.id}`, otherToken, { ...payload, title: 'Stolen title' })).status, 404)
    assert.equal((await request('DELETE', `/v1/services/${service.id}`, otherToken)).status, 404)
    assert.equal((await request('PUT', `/v1/services/${service.id}`, ownerToken, { ...payload, ownerUserId: randomUUID() })).status, 400)

    const updated = await request('PUT', `/v1/services/${service.id}`, ownerToken, { ...payload, title: 'Updated design', status: 'draft' })
    assert.equal(updated.status, 200)
    assert.equal((await updated.json()).service.title, 'Updated design')
    const draftBrowse = await (await request('GET', '/v1/services/browse', otherToken)).json()
    assert.equal(draftBrowse.services.some((item) => item.id === service.id), false)
    assert.equal((await request('DELETE', `/v1/services/${service.id}`, ownerToken)).status, 204)
    assert.equal((await request('GET', `/v1/services/${service.id}`, ownerToken)).status, 404)
  } finally {
    await pool.query('DELETE FROM users WHERE email = ANY($1)', [[emailOne, emailTwo]])
    await new Promise((resolve) => server.close(resolve))
  }
})
