import bcrypt from 'bcryptjs'
import { createHash, randomInt } from 'node:crypto'
import pool from '../common/database/connection.js'
import { ApiError } from '../common/utils/ApiError.js'
import { validateNewPassword } from './passwordPolicy.js'
import { sendPasswordReset } from './passwordMailer.js'

const hashCode = (userId, code) => createHash('sha256').update(`${userId}:${code}`).digest('hex')
const genericMessage = 'If an account exists for that email, a verification code is on its way.'

export async function requestPasswordReset(request, response, next) {
  try {
    const email = request.body?.email
    if (typeof email !== 'string' || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) throw new ApiError(400, 'Enter a valid email address.')
    if (!process.env.SMTP_HOST || !process.env.SMTP_FROM) throw new ApiError(503, 'Password recovery is temporarily unavailable.')
    const user = await pool.query("SELECT id, email FROM users WHERE email = $1 AND status <> 'suspended'", [email.trim().toLowerCase()])
    if (!user.rowCount) return response.json({ message: genericMessage })
    const code = String(randomInt(0, 100000000)).padStart(8, '0')
    const codeHash = hashCode(user.rows[0].id, code)
    await pool.query('UPDATE password_resets SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL', [user.rows[0].id])
    await pool.query('INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'20 minutes\')', [user.rows[0].id, codeHash])
    try { await sendPasswordReset(user.rows[0].email, code) }
    catch (error) {
      await pool.query('DELETE FROM password_resets WHERE token_hash = $1', [codeHash])
      console.error('Password verification email could not be delivered:', error)
      throw new ApiError(503, 'Verification email could not be sent. Please try again later.')
    }
    response.json({ message: genericMessage })
  } catch (error) { next(error) }
}

export async function resetPassword(request, response, next) {
  let client
  try {
    const { email, code, password } = request.body ?? {}
    if (typeof email !== 'string' || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) throw new ApiError(400, 'Enter a valid email address.')
    if (typeof code !== 'string' || !/^\d{8}$/.test(code)) throw new ApiError(400, 'Enter the 8-digit verification code.')
    validateNewPassword(password)
    client = await pool.connect()
    await client.query('BEGIN')
    const result = await client.query(`SELECT pr.id, pr.user_id, pr.token_hash, pr.attempts FROM password_resets pr JOIN users u ON u.id = pr.user_id
      WHERE u.email = $1 AND pr.used_at IS NULL AND pr.expires_at > NOW() AND u.status <> 'suspended'
      ORDER BY pr.created_at DESC LIMIT 1 FOR UPDATE OF pr`, [email.trim().toLowerCase()])
    if (!result.rowCount || result.rows[0].attempts >= 5) throw new ApiError(400, 'The verification code is invalid or expired. Request a new code.')
    if (result.rows[0].token_hash.trim() !== hashCode(result.rows[0].user_id, code)) {
      await client.query('UPDATE password_resets SET attempts = attempts + 1 WHERE id = $1', [result.rows[0].id])
      await client.query('COMMIT')
      client.release()
      client = null
      throw new ApiError(400, 'The verification code is invalid or expired. Request a new code.')
    }
    const passwordHash = await bcrypt.hash(password, 12)
    await client.query('UPDATE users SET password_hash = $2, updated_at = NOW() WHERE id = $1', [result.rows[0].user_id, passwordHash])
    await client.query('UPDATE password_resets SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL', [result.rows[0].user_id])
    await client.query('UPDATE auth_sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL', [result.rows[0].user_id])
    await client.query('COMMIT')
    response.json({ message: 'Password updated. You can now log in with your new password.' })
  } catch (error) { if (client) await client.query('ROLLBACK'); next(error) }
  finally { client?.release() }
}

export async function changePassword(request, response, next) {
  const client = await pool.connect()
  try {
    const { currentPassword, newPassword } = request.body ?? {}
    if (typeof currentPassword !== 'string') throw new ApiError(400, 'Enter your current password.')
    validateNewPassword(newPassword)
    await client.query('BEGIN')
    const result = await client.query('SELECT password_hash FROM users WHERE id = $1 FOR UPDATE', [request.user.sub])
    if (!result.rowCount || !(await bcrypt.compare(currentPassword, result.rows[0].password_hash))) throw new ApiError(400, 'Current password is incorrect.')
    if (await bcrypt.compare(newPassword, result.rows[0].password_hash)) throw new ApiError(400, 'Choose a different password.')
    const passwordHash = await bcrypt.hash(newPassword, 12)
    await client.query('UPDATE users SET password_hash = $2, updated_at = NOW() WHERE id = $1', [request.user.sub, passwordHash])
    await client.query('UPDATE password_resets SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL', [request.user.sub])
    await client.query('UPDATE auth_sessions SET revoked_at = NOW() WHERE user_id = $1 AND id <> $2 AND revoked_at IS NULL', [request.user.sub, request.user.jti])
    await client.query('COMMIT')
    response.json({ message: 'Password changed. Other sessions have been signed out.' })
  } catch (error) { await client.query('ROLLBACK'); next(error) }
  finally { client.release() }
}
