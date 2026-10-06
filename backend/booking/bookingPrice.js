import { ApiError } from '../common/utils/ApiError.js'

export function validateDuration(value) {
  const minutes = Number(value)
  if (!Number.isInteger(minutes) || minutes < 15 || minutes > 480) {
    throw new ApiError(400, 'Choose a duration from 15 to 480 minutes.')
  }
  return minutes
}

export function calculatePrice(rate, rateMinutes, requestedMinutes) {
  if (rate == null) return null
  const cents = Math.round(Number(rate) * 100)
  return (Math.round(cents * requestedMinutes / rateMinutes) / 100).toFixed(2)
}
