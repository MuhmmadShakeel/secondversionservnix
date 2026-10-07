import bcrypt from 'bcryptjs'
import { createHash, randomBytes } from 'node:crypto'
import pool from '../common/database/connection.js'
import { env } from '../common/config/env.js'
import { ApiError } from '../common/utils/ApiError.js'
import { sendPasswordReset } from './passwordMailer.js'
import { normalizeEmail, validatePassword } from './passwordPolicy.js'

const genericMessage = 'If an account exists for that email, a reset link will arrive shortly.'
const tokenHash = (token) => createHash('sha256').update(token).digest('hex')

export async function forgotPassword(request, response, next) {
  try {
    const email = normalizeEmail(request.body?.email)
    const result = await pool.query('SELECT id FROM users WHERE email = $1', [email])
    if (result.rowCount) {
      const token = randomBytes(32).toString('hex')
      await pool.query('DELETE FROM password_resets WHERE user_id = $1', [result.rows[0].id])
      await pool.query("INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() + INTERVAL '20 minutes')", [result.rows[0].id, tokenHash(token)])
      try { await sendPasswordReset(email, token, env.clientUrl) } catch (error) {
        await pool.query('DELETE FROM password_resets WHERE token_hash = $1', [tokenHash(token)])
        throw error
      }
    }
    response.json({ message: genericMessage })
  } catch (error) { next(error) }
}

export async function resetPassword(request, response, next) {
  let client
  try {
    const token = request.body?.token
    if (typeof token !== 'string' || !/^[0-9a-f]{64}$/i.test(token)) throw new ApiError(400, 'This reset link is invalid or has expired.')
    const password = validatePassword(request.body?.password)
    client = await pool.connect()
    await client.query('BEGIN')
    const result = await client.query(
      'SELECT user_id FROM password_resets WHERE token_hash = $1 AND expires_at > NOW() FOR UPDATE',
      [tokenHash(token)],
    )
    if (!result.rowCount) throw new ApiError(400, 'This reset link is invalid or has expired.')
    const userId = result.rows[0].user_id
    const passwordHash = await bcrypt.hash(password, 12)
    await client.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [passwordHash, userId])
    await client.query('DELETE FROM password_resets WHERE user_id = $1', [userId])
    await client.query('UPDATE auth_sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL', [userId])
    await client.query('COMMIT')
    response.json({ message: 'Password updated. You can now log in.' })
  } catch (error) {
    if (client) await client.query('ROLLBACK')
    next(error)
  } finally { client?.release() }
}
