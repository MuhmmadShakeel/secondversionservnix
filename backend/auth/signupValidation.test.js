import assert from 'node:assert/strict'
import test from 'node:test'
import { validateSignup } from '../common/middleware/validate.middleware.js'

const employee = {
  role: 'employee',
  organizationId: '58288902-fbf6-4c62-860e-7103a025b6ea',
  name: 'Example Employee',
  email: 'employee@example.com',
  password: 'Password123',
}

test('employee signup accepts a complete organization UUID', () => {
  let outcome = 'not called'
  validateSignup({ body: employee }, null, (error) => { outcome = error })
  assert.equal(outcome, undefined)
})

test('employee signup rejects an invalid organization ID', () => {
  let outcome
  validateSignup({ body: { ...employee, organizationId: 'invalid' } }, null, (error) => { outcome = error })
  assert.equal(outcome?.statusCode, 400)
})
