import bcrypt from 'bcryptjs'
import { randomUUID } from 'node:crypto'
import jwt from 'jsonwebtoken'
import { env } from '../common/config/env.js'
import pool from '../common/database/connection.js'
import { ApiError } from '../common/utils/ApiError.js'

const PASSWORD_HASH_ROUNDS = 12

function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
  }
}

async function createToken(user) {
  const sessionId = randomUUID()
  const token = jwt.sign(
    {
      sub: user.id,
      jti: sessionId,
    },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn,
    },
  )
  const { exp } = jwt.decode(token)
  await pool.query(
    'INSERT INTO auth_sessions (id, user_id, expires_at) VALUES ($1, $2, to_timestamp($3))',
    [sessionId, user.id, exp],
  )
  return token
}

export async function signup(request, response, next) {
  let client
  try {
    const {
      name,
      email,
      password,
      role = 'customer',
      organizationId,
    } = request.body
    const passwordHash = await bcrypt.hash(password, PASSWORD_HASH_ROUNDS)
    client = await pool.connect()
    await client.query('BEGIN')
    if (role === 'employee') {
      const organization = await client.query(
        `SELECT o.id FROM organizations o JOIN users owner ON owner.id = o.owner_user_id
         WHERE o.id = $1 AND o.status = 'approved' AND owner.role = 'service_provider'
           AND owner.status <> 'suspended' FOR SHARE OF o`,
        [organizationId],
      )
      if (!organization.rowCount) throw new ApiError(400, 'This organization is no longer available. Choose another approved organization.')
    }
    const result = await client.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, status, role`,
      [
        name.trim(),
        email.trim().toLowerCase(),
        passwordHash,
        role,
      ],
    )

    const user = result.rows[0]
    if (role === 'employee') {
      await client.query('INSERT INTO employee_profiles (user_id, organization_id) VALUES ($1, $2)', [user.id, organizationId])
      await client.query(
        `INSERT INTO organization_employees (organization_id, employee_user_id, status)
         VALUES ($1, $2, 'accepted')`,
        [organizationId, user.id],
      )
    }
    await client.query('COMMIT')

    response.status(201).json({
      message: 'Your account has been created successfully.',
      user: toPublicUser(user),
    })
  } catch (error) {
    if (client) await client.query('ROLLBACK')
    if (error.code === '23505') {
      return next(
        new ApiError(409, 'An account with this email already exists.'),
      )
    }

    next(error)
  } finally { client?.release() }
}

export async function login(request, response, next) {
  try {
    const {
      email,
      password,
    } = request.body
    const result = await pool.query(
      `SELECT id, name, email, status, password_hash, role
       FROM users WHERE email = $1`,
      [email.trim().toLowerCase()],
    )
    const user = result.rows[0]

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw new ApiError(401, 'Invalid email or password.')
    }

    if (user.status === 'suspended') {
      throw new ApiError(403, 'This account is suspended.')
    }

    const token = await createToken(user)
    response.locals.setAccessToken(token)

    response.json({
      message: 'Welcome back to Servnix.',
      user: toPublicUser(user),
      token,
    })
  } catch (error) {
    next(error)
  }
}

export async function logout(request, response, next) {
  try {
    await pool.query('UPDATE auth_sessions SET revoked_at = NOW() WHERE id = $1 AND user_id = $2', [request.user.jti, request.user.sub])
    response.json({ message: 'You have been logged out.' })
  } catch (error) {
    next(error)
  }
}

export async function getProfile(request, response, next) {
  try {
    const result = await pool.query('SELECT id, name, email, role, status FROM users WHERE id = $1', [request.user.sub])
    if (!result.rowCount) throw new ApiError(404, 'Account not found.')
    response.json({ user: result.rows[0] })
  } catch (error) { next(error) }
}

export async function updateProfile(request, response, next) {
  try {
    const { name, email } = request.body
    if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 120) throw new ApiError(400, 'Name must be between 2 and 120 characters.')
    if (typeof email !== 'string' || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) throw new ApiError(400, 'Enter a valid email address.')
    const result = await pool.query(
      'UPDATE users SET name = $2, email = $3, updated_at = NOW() WHERE id = $1 RETURNING id, name, email, role, status',
      [request.user.sub, name.trim(), email.trim().toLowerCase()],
    )
    response.json({ user: result.rows[0], message: 'Profile updated.' })
  } catch (error) {
    next(error.code === '23505' ? new ApiError(409, 'That email is already in use.') : error)
  }
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const userStatuses = ['pending', 'active', 'suspended']
const roles = ['customer', 'service_provider', 'platform_admin', 'employee']

function requireId(id) {
  if (!uuidPattern.test(id)) throw new ApiError(400, 'Invalid record ID.')
}

function optionalString(value, label, maxLength, minLength = 1) {
  if (value === undefined) return undefined
  if (typeof value !== 'string' || value.trim().length < minLength || value.trim().length > maxLength) {
    throw new ApiError(400, `${label} is invalid.`)
  }
  return value.trim()
}

export async function listUsers(_request, response, next) {
  try {
    const result = await pool.query(
      `SELECT id, name, email, status, role, created_at AS "createdAt"
       FROM users ORDER BY created_at DESC`,
    )
    response.json({ users: result.rows })
  } catch (error) { next(error) }
}

export async function updateUser(request, response, next) {
  try {
    requireId(request.params.id)
    const { name, email, status, role } = request.body
    if (![name, email, status, role].some((value) => value !== undefined)) throw new ApiError(400, 'Provide at least one field to update.')
    const cleanName = optionalString(name, 'Name', 120, 2)
    const cleanEmail = optionalString(email, 'Email', 255)?.toLowerCase()
    if (cleanEmail && !emailPattern.test(cleanEmail)) throw new ApiError(400, 'Enter a valid email address.')
    if (status !== undefined && !userStatuses.includes(status)) throw new ApiError(400, 'Invalid account status.')
    const cleanRole = typeof role === 'string' ? (role.trim().toLowerCase() === 'admin' ? 'platform_admin' : role.trim().toLowerCase()) : role
    if (role !== undefined && !roles.includes(cleanRole)) throw new ApiError(400, 'Invalid account role.')
    if (request.params.id === request.user.sub && (status === 'suspended' || (cleanRole && cleanRole !== 'platform_admin'))) {
      throw new ApiError(400, 'You cannot remove your own administrator access.')
    }
    const result = await pool.query(
      `UPDATE users u SET
        name = COALESCE($2, u.name), email = COALESCE($3, u.email),
        status = COALESCE($4, u.status), role = COALESCE($5, u.role),
        updated_at = NOW()
       WHERE u.id = $1
       RETURNING u.id, u.name, u.email, u.status, u.role`,
      [request.params.id, cleanName ?? null, cleanEmail ?? null, status ?? null, cleanRole ?? null],
    )
    if (!result.rowCount) throw new ApiError(404, 'User not found.')
    response.json({ user: result.rows[0], message: 'User updated.' })
  } catch (error) {
    next(error.code === '23505' ? new ApiError(409, 'That email is already in use.') : error)
  }
}

export async function deleteUser(request, response, next) {
  let client
  try {
    requireId(request.params.id)
    if (request.params.id === request.user.sub) throw new ApiError(400, 'You cannot delete your own administrator account.')
    client = await pool.connect()
    await client.query('BEGIN')
    await client.query('DELETE FROM organizations WHERE owner_user_id = $1', [request.params.id])
    const result = await client.query('DELETE FROM users WHERE id = $1 RETURNING id', [request.params.id])
    if (!result.rowCount) throw new ApiError(404, 'User not found.')
    await client.query('COMMIT')
    response.json({ message: 'User and owned organization deleted.' })
  } catch (error) {
    if (client) await client.query('ROLLBACK')
    next(error)
  } finally { client?.release() }
}
