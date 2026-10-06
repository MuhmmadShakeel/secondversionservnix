import assert from 'node:assert/strict'
import test from 'node:test'
import { assertServiceTime, availableSlots, hasOverlap, validateLocalDateTime } from './bookingSchedule.js'

test('rejects calendar dates that JavaScript would normalize', () => {
  assert.throws(() => validateLocalDateTime('2026-02-30T10:00'), /valid calendar date/)
})

test('rejects an appointment that extends past closing time', () => {
  const service = { start_time: '09:00:00', end_time: '18:00:00', duration_minutes: 60 }
  assert.throws(() => assertServiceTime(service, '2030-10-01T17:30'), /finish after/)
})

test('custom duration is checked against closing time', () => {
  const service = { start_time: '09:00:00', end_time: '10:00:00', duration_minutes: 30 }
  assert.throws(() => assertServiceTime(service, '2030-10-01T09:17', 70), /finish after/)
})

test('available slots exclude an overlapping organization appointment', async () => {
  const client = { query: async () => ({ rows: [{ scheduled_at: new Date('2030-10-01T05:00:00Z'), duration_minutes: 60 }] }) }
  const service = { organization_id: 'org-1', start_time: '09:00:00', end_time: '12:00:00', duration_minutes: 60 }
  const slots = await availableSlots(client, service, '2030-10-01')
  assert.ok(slots.includes('2030-10-01T09:00'))
  assert.ok(!slots.includes('2030-10-01T09:30'))
  assert.ok(!slots.includes('2030-10-01T10:00'))
  assert.ok(!slots.includes('2030-10-01T10:30'))
  assert.ok(slots.includes('2030-10-01T11:00'))
})

test('overlap check is scoped to the organization', async () => {
  let parameters
  const client = { query: async (_sql, values) => { parameters = values; return { rowCount: 1 } } }
  const result = await hasOverlap(client, 'org-1', new Date('2030-10-01T05:00:00Z'), 60)
  assert.equal(result, true)
  assert.equal(parameters[0], 'org-1')
})
