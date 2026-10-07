import { ApiError } from '../common/utils/ApiError.js'

export function normalizeEmail(value) {
  if (typeof value !== 'string') throw new ApiError(400, 'Enter a valid email address.')
  const email = value.trim().toLowerCase()
  if (email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError(400, 'Enter a valid email address.')
  }
  return email
}

export function validateName(value) {
  if (typeof value !== 'string') throw new ApiError(400, 'Enter your full name.')
  const name = value.trim().replace(/\s+/g, ' ')
  if (name.length < 2 || name.length > 120) throw new ApiError(400, 'Name must be between 2 and 120 characters.')
  return name
}

export function validatePassword(value) {
  if (typeof value !== 'string' || value.length < 8 || Buffer.byteLength(value, 'utf8') > 72 || !/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/\d/.test(value)) {
    throw new ApiError(400, 'Use at least 8 characters (up to 72 bytes) with uppercase, lowercase, and a number.')
  }
  return value
}
