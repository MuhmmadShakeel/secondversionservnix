import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'node:crypto'
import pool from '../common/database/connection.js'
import { env } from '../common/config/env.js'
import { ApiError } from '../common/utils/ApiError.js'
import { normalizeEmail, validateName, validatePassword } from './passwordPolicy.js'

const userFields = 'id, name, email'

function readCredentials(body) {
  if (!body || typeof body !== 'object' || Object.keys(body).some((key) => !['name', 'email', 'password'].includes(key))) {
    throw new ApiError(400, 'Only name, email and password are accepted.')
  }
  return {
    name: validateName(body.name),
    email: normalizeEmail(body.email),
    password: validatePassword(body.password),
  }
}

async function createSession(client, user) {
  const sessionId = randomUUID()
  const token = jwt.sign({}, env.jwtSecret, {
    algorithm: 'HS256',
    subject: user.id,
    jwtid: sessionId,
    expiresIn: env.jwtExpiresIn,
  })
  const { exp } = jwt.decode(token)
  await client.query('INSERT INTO auth_sessions (id, user_id, expires_at) VALUES ($1, $2, $3)', [sessionId, user.id, new Date(exp * 1000)])
  return token
}

function sendSession(response, status, user, token) {
  response.set('Authorization', `Bearer ${token}`)
  response.set('Cache-Control', 'no-store')
  response.status(status).json({ user, token })
}

export async function signup(request, response, next) {
  try {
    const credentials = readCredentials(request.body)
    const passwordHash = await bcrypt.hash(credentials.password, 12)
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING ${userFields}`,
      [credentials.name, credentials.email, passwordHash],
    )
    response.set('Cache-Control', 'no-store')
    response.status(201).json({ message: 'Account created. Please log in.', user: result.rows[0] })
  } catch (error) {
    next(error.code === '23505' ? new ApiError(409, 'An account with this email already exists.') : error)
  }
}

export async function login(request, response, next) {
  try {
    const email = normalizeEmail(request.body?.email)
    const password = request.body?.password
    if (typeof password !== 'string' || !password) throw new ApiError(400, 'Enter your email and password.')

    const result = await pool.query(`SELECT ${userFields}, password_hash FROM users WHERE email = $1`, [email])
    const valid = result.rowCount && await bcrypt.compare(password, result.rows[0].password_hash)
    if (!valid) throw new ApiError(401, 'Email or password is incorrect.')

    const { password_hash: _passwordHash, ...user } = result.rows[0]
    const token = await createSession(pool, user)
    sendSession(response, 200, user, token)
  } catch (error) { next(error) }
}

export function me(request, response) {
  response.set('Cache-Control', 'no-store')
  response.json({ user: request.user })
}

export async function logout(request, response, next) {
  try {
    await pool.query('UPDATE auth_sessions SET revoked_at = NOW() WHERE id = $1 AND revoked_at IS NULL', [request.sessionId])
    response.set('Cache-Control', 'no-store')
    response.status(204).end()
  } catch (error) { next(error) }
}
