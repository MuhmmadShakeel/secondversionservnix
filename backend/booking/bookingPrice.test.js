import assert from 'node:assert/strict'
import test from 'node:test'
import { calculatePrice, validateDuration } from './bookingPrice.js'

test('prorates a 60 minute rate for a 70 minute booking', () => {
  assert.equal(calculatePrice('1000.00', 60, 70), '1166.67')
})

test('rejects invalid requested durations and preserves price on request', () => {
  assert.throws(() => validateDuration(0), /15 to 480/)
  assert.throws(() => validateDuration(70.5), /15 to 480/)
  assert.equal(calculatePrice(null, 60, 70), null)
})
