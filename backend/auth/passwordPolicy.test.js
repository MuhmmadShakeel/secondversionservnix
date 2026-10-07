import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeEmail, validateName, validatePassword } from './passwordPolicy.js'

test('normalizes email and name', () => {
  assert.equal(normalizeEmail('  Person@Example.COM '), 'person@example.com')
  assert.equal(validateName('  Alex   Morgan  '), 'Alex Morgan')
})

test('rejects invalid email and weak or oversized passwords', () => {
  assert.throws(() => normalizeEmail('not-an-email'))
  assert.throws(() => validatePassword('weak'))
  assert.throws(() => validatePassword('Abc1234'))
  assert.throws(() => validatePassword('A1' + 'a'.repeat(71)))
  assert.equal(validatePassword('Abc12345'), 'Abc12345')
  assert.equal(validatePassword('StrongPass123'), 'StrongPass123')
})
