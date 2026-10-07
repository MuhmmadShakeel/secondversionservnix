import test from 'node:test'
import assert from 'node:assert/strict'
import { validateService } from './serviceValidation.js'

const valid = { title: 'Brand design', category: 'Creative', description: 'Full identity and guidelines', price: '1200.50', experienceYears: 4, status: 'active' }

test('service fields are validated and normalized', () => {
  assert.deepEqual(validateService({ ...valid, title: '  Brand   design  ' }), { ...valid, title: 'Brand design' })
  assert.throws(() => validateService({ ...valid, ownerUserId: 'someone-else' }))
  assert.throws(() => validateService({ ...valid, price: '-2' }))
  assert.throws(() => validateService({ ...valid, experienceYears: 61 }))
  assert.throws(() => validateService({ ...valid, experienceYears: '' }))
})
