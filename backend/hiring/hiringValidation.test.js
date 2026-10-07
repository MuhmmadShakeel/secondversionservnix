import test from 'node:test'
import assert from 'node:assert/strict'
import { validateMedia, validateProposal, validateRequirement } from './hiringValidation.js'

const requirement = { title: 'Design a new brand', category: 'Design', description: 'Create a complete new identity for our company.', budgetMin: '1000', budgetMax: '2000', status: 'open' }

test('requirements and proposals reject invalid fields and amounts', () => {
  assert.equal(validateRequirement(requirement).title, requirement.title)
  assert.throws(() => validateRequirement({ ...requirement, ownerUserId: 'someone-else' }))
  assert.throws(() => validateRequirement({ ...requirement, budgetMax: '999' }))
  assert.throws(() => validateProposal({ coverLetter: 'Too short', bidAmount: '1', deliveryDays: 5 }))
  assert.throws(() => validateProposal({ coverLetter: 'I can deliver the full design in one week.', bidAmount: '-1', deliveryDays: 5 }))
})

test('media accepts supported types and rejects unsafe payloads', () => {
  const file = { kind: 'photo', mimeType: 'image/png', fileName: 'sample.png', base64: Buffer.from('sample').toString('base64') }
  assert.equal(validateMedia([file])[0].content.toString(), 'sample')
  assert.throws(() => validateMedia([{ ...file, mimeType: 'image/svg+xml' }]))
  assert.throws(() => validateMedia([{ ...file, fileName: '../bad.png' }]))
  assert.throws(() => validateMedia([file, file, file, file]))
})
