import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import app from '../Server.js'
import pool from '../common/database/connection.js'
import { migrate } from '../common/database/migrate.js'

test('client manages hiring and compares worker proposals with database media', async () => {
  await migrate()
  const emails = ['client', 'worker', 'other'].map((name) => `${name}-${randomUUID()}@example.com`)
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
      assert.equal((await send('POST', '/v1/auth/signup', null, { name: ['Client', 'Worker', 'Other'][index], email, password: 'StrongPass123' })).status, 201)
      tokens.push((await (await send('POST', '/v1/auth/login', null, { email, password: 'StrongPass123' })).json()).token)
    }
    const [clientToken, workerToken, otherToken] = tokens
    const attachment = { kind: 'photo', mimeType: 'image/png', fileName: 'brief.png', base64: Buffer.from('sample image data').toString('base64') }
    const body = { title: 'Create a new brand identity', category: 'Design', description: 'We need a thoughtful visual identity and brand guidelines.', budgetMin: '1000', budgetMax: '2500', status: 'open', media: [attachment] }
    assert.equal((await send('GET', '/v1/hiring/open')).status, 401)
    const created = await send('POST', '/v1/hiring', clientToken, body)
    assert.equal(created.status, 201)
    const requirement = (await created.json()).requirement
    assert.equal(requirement.media.length, 1)
    assert.equal(requirement.ownerName, 'Client')
    assert.equal((await send('PUT', `/v1/hiring/${requirement.id}`, workerToken, body)).status, 404)
    assert.equal((await send('DELETE', `/v1/hiring/${requirement.id}`, workerToken)).status, 404)
    const edited = await send('PUT', `/v1/hiring/${requirement.id}`, clientToken, { ...body, title: 'Updated brand identity', media: undefined })
    assert.equal(edited.status, 200)
    assert.equal((await edited.json()).requirement.title, 'Updated brand identity')

    const media = await send('GET', `/v1/hiring/media/${requirement.media[0].id}`, workerToken)
    assert.equal(media.status, 200)
    assert.equal(await media.text(), 'sample image data')
    const proposalBody = { coverLetter: 'I can deliver the identity and guidelines with careful research.', bidAmount: '1800', deliveryDays: 10 }
    assert.equal((await send('POST', `/v1/hiring/${requirement.id}/proposals`, clientToken, proposalBody)).status, 403)
    const proposalOne = await send('POST', `/v1/hiring/${requirement.id}/proposals`, workerToken, proposalBody)
    assert.equal(proposalOne.status, 201)
    const proposalId = (await proposalOne.json()).id
    assert.equal((await send('POST', `/v1/hiring/${requirement.id}/proposals`, workerToken, proposalBody)).status, 409)
    const otherSubmitted = await send('POST', `/v1/hiring/${requirement.id}/proposals`, otherToken, { ...proposalBody, bidAmount: '1600' })
    assert.equal(otherSubmitted.status, 201)
    assert.equal((await send('DELETE', `/v1/hiring/proposals/${(await otherSubmitted.json()).id}`, otherToken)).status, 204)
    assert.equal((await send('POST', `/v1/hiring/${requirement.id}/proposals`, otherToken, { ...proposalBody, bidAmount: '1600' })).status, 201)
    assert.equal((await send('GET', `/v1/hiring/${requirement.id}/proposals`, workerToken)).status, 404)
    const clientProposals = (await (await send('GET', `/v1/hiring/${requirement.id}/proposals`, clientToken)).json()).proposals
    assert.equal(clientProposals.length, 2)
    assert.equal((await (await send('GET', '/v1/hiring/proposals/mine', workerToken)).json()).proposals.length, 1)
    assert.equal((await send('PUT', `/v1/hiring/proposals/${proposalId}`, otherToken, proposalBody)).status, 404)
    assert.equal((await send('PUT', `/v1/hiring/proposals/${proposalId}`, workerToken, { ...proposalBody, bidAmount: '1700' })).status, 200)

    assert.equal((await send('POST', `/v1/hiring/${requirement.id}/proposals/${proposalId}/accept`, clientToken)).status, 200)
    const after = (await (await send('GET', `/v1/hiring/${requirement.id}/proposals`, clientToken)).json()).proposals
    assert.equal(after.find((proposal) => proposal.id === proposalId).status, 'accepted')
    assert.equal(after.find((proposal) => proposal.id !== proposalId).status, 'rejected')
    assert.equal((await send('PUT', `/v1/hiring/${requirement.id}`, clientToken, body)).status, 409)
    assert.equal((await send('GET', `/v1/hiring/media/${requirement.media[0].id}`, workerToken)).status, 200)
    assert.equal((await send('DELETE', `/v1/hiring/${requirement.id}`, clientToken)).status, 204)
    assert.equal((await send('GET', `/v1/hiring/${requirement.id}`, workerToken)).status, 404)
  } finally {
    await pool.query('DELETE FROM users WHERE email = ANY($1)', [emails])
    await new Promise((resolve) => server.close(resolve))
  }
})
