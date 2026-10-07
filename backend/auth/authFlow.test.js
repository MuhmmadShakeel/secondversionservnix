import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash, randomBytes, randomUUID } from 'node:crypto'
import app from '../Server.js'
import pool from '../common/database/connection.js'
import { migrate } from '../common/database/migrate.js'

test('signup, login, authenticated profile, and logout use one account', async () => {
  await migrate()
  const email = `test-${randomUUID()}@example.com`
  const server = app.listen(0)
  const base = `http://127.0.0.1:${server.address().port}/v1/auth`
  const request = (path, body, token) => fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  })
  try {
    const withRole = await request('/signup', { name: 'Test User', email, password: 'StrongPass123', role: 'customer' })
    assert.equal(withRole.status, 400)

    const signup = await request('/signup', { name: 'Test User', email: email.toUpperCase(), password: 'StrongPass123' })
    assert.equal(signup.status, 201)
    const signupBody = await signup.json()
    assert.equal(signupBody.user.email, email)
    assert.equal('role' in signupBody.user, false)
    assert.equal(signup.headers.get('authorization'), null)
    assert.equal('token' in signupBody, false)

    const duplicate = await request('/signup', { name: 'Test User', email, password: 'StrongPass123' })
    assert.equal(duplicate.status, 409)

    const wrongEmail = await request('/login', { email: `missing-${email}`, password: 'StrongPass123' })
    assert.equal(wrongEmail.status, 401)
    const wrongPassword = await request('/login', { email, password: 'WrongPass123' })
    assert.equal(wrongPassword.status, 401)
    const login = await request('/login', { email, password: 'StrongPass123' })
    assert.equal(login.status, 200)
    const loginBody = await login.json()
    const { token } = loginBody
    assert.equal(loginBody.user.email, email)
    assert.equal(login.headers.get('authorization'), `Bearer ${token}`)

    const profile = await fetch(`${base}/me`, { headers: { Authorization: `Bearer ${token}` } })
    assert.equal(profile.status, 200)
    assert.equal((await profile.json()).user.email, email)

    const logout = await request('/logout', {}, token)
    assert.equal(logout.status, 204)
    const revoked = await fetch(`${base}/me`, { headers: { Authorization: `Bearer ${token}` } })
    assert.equal(revoked.status, 401)

    const unknownRecovery = await request('/password/forgot', { email: `missing-${email}` })
    assert.equal(unknownRecovery.status, 200)

    const activeLogin = await request('/login', { email, password: 'StrongPass123' })
    const activeToken = (await activeLogin.json()).token
    const resetToken = randomBytes(32).toString('hex')
    await pool.query("INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() + INTERVAL '20 minutes')", [signupBody.user.id, createHash('sha256').update(resetToken).digest('hex')])
    const reset = await request('/password/reset', { token: resetToken, password: 'NewStrongPass123' })
    assert.equal(reset.status, 200)
    assert.equal((await fetch(`${base}/me`, { headers: { Authorization: `Bearer ${activeToken}` } })).status, 401)
    assert.equal((await request('/login', { email, password: 'StrongPass123' })).status, 401)
    assert.equal((await request('/login', { email, password: 'NewStrongPass123' })).status, 200)
    assert.equal((await request('/password/reset', { token: resetToken, password: 'AnotherPass123' })).status, 400)
  } finally {
    await pool.query('DELETE FROM users WHERE email = $1', [email])
    await new Promise((resolve) => server.close(resolve))
  }
})
