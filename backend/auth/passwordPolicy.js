import { ApiError } from '../common/utils/ApiError.js'

export function validateNewPassword(password) {
  if (typeof password !== 'string' || password.length < 8 || password.length > 128 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    throw new ApiError(400, 'Use 8–128 characters with uppercase, lowercase, and a number.')
  }
}
