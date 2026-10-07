import { ApiError } from '../common/utils/ApiError.js'

function requiredText(value, label, min, max) {
  if (typeof value !== 'string') throw new ApiError(400, `${label} is required.`)
  const text = value.trim().replace(/\s+/g, ' ')
  if (text.length < min || text.length > max) throw new ApiError(400, `${label} must be between ${min} and ${max} characters.`)
  return text
}

export function validateBooking(input) {
  const fields = ['contactPhone', 'serviceAddress', 'requestDetails', 'preferredDate']
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some((key) => !fields.includes(key))) {
    throw new ApiError(400, 'Enter valid booking details.')
  }
  const contactPhone = requiredText(input.contactPhone, 'Contact number', 7, 30)
  if (!/^\+?[\d\s().-]+$/.test(contactPhone) || (contactPhone.match(/\d/g) || []).length < 7) throw new ApiError(400, 'Enter a valid contact number.')
  const preferredDate = input.preferredDate || null
  const date = preferredDate === null ? null : new Date(`${preferredDate}T00:00:00Z`)
  if (preferredDate !== null && (typeof preferredDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(preferredDate) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== preferredDate)) {
    throw new ApiError(400, 'Choose a valid preferred date.')
  }
  return {
    contactPhone,
    serviceAddress: requiredText(input.serviceAddress, 'Service address', 10, 300),
    requestDetails: requiredText(input.requestDetails, 'Booking details', 10, 2000),
    preferredDate,
  }
}
