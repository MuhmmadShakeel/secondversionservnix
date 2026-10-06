import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { ApiError } from '../utils/ApiError.js'
import pool from '../database/connection.js'

function readBearerToken(authorizationHeader) {
  if (typeof authorizationHeader !== 'string') return null

  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() || null
}

export async function authenticate(request, _response, next) {
  const token = readBearerToken(request.headers.authorization)

  if (!token) {
    return next(new ApiError(401, 'A Bearer authorization token is required.'))
  }

  let claims
  try {
    claims = jwt.verify(token, env.jwtSecret)
  } catch {
    return next(new ApiError(401, 'The authorization token is invalid or has expired.'))
  }
  if (!claims.jti) return next(new ApiError(401, 'The authorization token is invalid or has expired.'))
  try {
    const result = await pool.query(
      `SELECT u.id, u.status, u.role
       FROM auth_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.id = $1 AND s.user_id = $2 AND s.revoked_at IS NULL AND s.expires_at > NOW()`,
      [claims.jti, claims.sub],
    )
    if (!result.rowCount || result.rows[0].status === 'suspended') return next(new ApiError(401, 'The session is no longer active.'))
    request.user = { sub: claims.sub, jti: claims.jti, role: result.rows[0].role }
    next()
  } catch (error) {
    next(error)
  }
}

export function tokenResponseHeader(_request, response, next) {
  response.set('Cache-Control', 'no-store')
  response.locals.setAccessToken = (token) => {
    response.set('Authorization', `Bearer ${token}`)
  }

  next()
}
