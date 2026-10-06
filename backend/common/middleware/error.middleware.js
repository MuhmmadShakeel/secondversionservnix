import { ApiError } from '../utils/ApiError.js'

export function notFound(request, _response, next) {
  next(
    new ApiError(
      404,
      `Route ${request.method} ${request.originalUrl} was not found.`,
    ),
  )
}

export function errorHandler(error, _request, response, _next) {
  const statusCode = error.statusCode || 500
  const message =
    statusCode === 500
      ? 'Internal server error.'
      : error.message

  response.status(statusCode).json({ message })
}
