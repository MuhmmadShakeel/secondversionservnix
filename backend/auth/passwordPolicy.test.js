import test from 'node:test'
import assert from 'node:assert/strict'
import { validateNewPassword } from './passwordPolicy.js'

test('password policy accepts a strong password and rejects weak or oversized passwords', () => {
  assert.doesNotThrow(() => validateNewPassword('StrongPass123'))
  for (const password of ['short1A', 'alllowercase123', 'ALLUPPERCASE123', 'NoNumbersHere', 'A1' + 'x'.repeat(127)]) {
    assert.throws(() => validateNewPassword(password), { statusCode: 400 })
  }
})
