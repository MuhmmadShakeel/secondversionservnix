import { ApiError } from '../utils/ApiError.js'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function validateSignup(request, _response, next) {
  const {
    name,
    email,
    password,
    role,
    organizationId,
  } = request.body

  if (role !== undefined && !['customer', 'service_provider', 'employee'].includes(role)) {
    return next(new ApiError(400, 'Choose a valid account type.'))
  }
  if (role === 'employee' && !uuidPattern.test(organizationId || '')) {
    return next(new ApiError(400, 'Choose an approved organization.'))
  }

  if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string' || !name.trim() || !email.trim() || !password) {
    return next(
      new ApiError(400, 'Name, email, and password are required.'),
    )
  }

  if (name.trim().length < 2 || name.trim().length > 120) {
    return next(new ApiError(400, 'Name must be between 2 and 120 characters.'))
  }

  if (!emailPattern.test(email.trim())) {
    return next(new ApiError(400, 'Enter a valid email address.'))
  }

  if (!passwordPattern.test(password)) {
    return next(
      new ApiError(
        400,
        'Password must be at least 8 characters and include uppercase, lowercase, and a number.',
      ),
    )
  }

  next()
}

export function validateLogin(request, _response, next) {
  const {
    email,
    password,
  } = request.body

  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    return next(new ApiError(400, 'Email and password are required.'))
  }

  if (!emailPattern.test(email.trim())) {
    return next(new ApiError(400, 'Enter a valid email address.'))
  }

  next()
}
