import { ApiError } from '../utils/ApiError.js'

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function invalid(message) {
  return new ApiError(400, message)
}

function validateServices(services) {
  if (!Array.isArray(services) || services.length === 0 || services.length > 20) {
    throw invalid('Add between 1 and 20 services.')
  }

  const ids = new Set()
  services.forEach((service) => {
    if (service?.id !== undefined && (typeof service.id !== 'string' || !uuidPattern.test(service.id))) {
      throw invalid('Service ID is invalid.')
    }
    if (service?.id && ids.has(service.id)) throw invalid('A service can only appear once.')
    if (service?.id) ids.add(service.id)
    if (!service || typeof service.name !== 'string' || !service.name.trim() || service.name.trim().length > 120) {
      throw invalid('Each service needs a name of at most 120 characters.')
    }
    if (!Number.isInteger(service.durationMinutes) || service.durationMinutes < 15 || service.durationMinutes > 480) {
      throw invalid('Service duration must be between 15 and 480 minutes.')
    }
    if (service.price !== undefined && service.price !== '' && (!Number.isFinite(Number(service.price)) || Number(service.price) < 0 || Number(service.price) > 9999999999.99)) {
      throw invalid('Service price must be between 0 and 9,999,999,999.99.')
    }
  })
}

function validateAvailability(availability) {
  if (!Array.isArray(availability) || availability.length === 0 || availability.length > 7) {
    throw invalid('Add availability for at least one day.')
  }

  const days = new Set()
  availability.forEach((slot) => {
    if (!slot || !Number.isInteger(slot.dayOfWeek) || slot.dayOfWeek < 0 || slot.dayOfWeek > 6) {
      throw invalid('Availability day is invalid.')
    }
    if (days.has(slot.dayOfWeek)) throw invalid('Add only one availability period per day.')
    days.add(slot.dayOfWeek)
    if (!timePattern.test(slot.startTime) || !timePattern.test(slot.endTime) || slot.startTime >= slot.endTime) {
      throw invalid('Availability start time must be before end time.')
    }
  })
}

export function validateOrganization(request, _response, next) {
  try {
    const { businessName, email, phone, address, description, services, availability } = request.body
    if (typeof businessName !== 'string' || businessName.trim().length < 2 || businessName.trim().length > 160) throw invalid('Business name must be between 2 and 160 characters.')
    if (typeof email !== 'string' || email.length > 255 || !emailPattern.test(email.trim())) throw invalid('Enter a valid business email address.')
    if (typeof phone !== 'string' || phone.trim().length < 7 || phone.trim().length > 30) throw invalid('Enter a valid business phone number.')
    if (typeof address !== 'string' || address.trim().length < 5 || address.trim().length > 300) throw invalid('Enter a valid business address.')
    if (description !== undefined && (typeof description !== 'string' || description.length > 2000)) throw invalid('Description must be less than 2,000 characters.')
    validateServices(services)
    validateAvailability(availability)
    next()
  } catch (error) {
    next(error)
  }
}
