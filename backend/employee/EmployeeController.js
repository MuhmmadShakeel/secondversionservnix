import pool from '../common/database/connection.js'
import { ApiError } from '../common/utils/ApiError.js'

const phonePattern = /^[+\d][\d\s()+-]{6,29}$/

export async function getEmployeeProfile(request, response, next) {
  try {
    const result = await pool.query(
      `SELECT u.name, u.email, p.phone, p.city, p.address,
         o.business_name AS "organizationName",
         p.job_title AS "jobTitle", p.bio, p.updated_at AS "updatedAt"
       FROM users u LEFT JOIN employee_profiles p ON p.user_id = u.id
       LEFT JOIN organizations o ON o.id = p.organization_id
       WHERE u.id = $1`,
      [request.user.sub],
    )
    if (!result.rowCount) throw new ApiError(404, 'Employee account not found.')
    response.json({ profile: result.rows[0], isComplete: result.rows[0].phone !== null })
  } catch (error) { next(error) }
}

export async function saveEmployeeProfile(request, response, next) {
  try {
    const { phone, city, address, jobTitle, bio = '' } = request.body ?? {}
    if (typeof phone !== 'string' || !phonePattern.test(phone.trim())) throw new ApiError(400, 'Enter a valid phone number.')
    if (typeof city !== 'string' || city.trim().length < 2 || city.trim().length > 100) throw new ApiError(400, 'City must be between 2 and 100 characters.')
    if (typeof address !== 'string' || address.trim().length < 5 || address.trim().length > 300) throw new ApiError(400, 'Address must be between 5 and 300 characters.')
    if (typeof jobTitle !== 'string' || jobTitle.trim().length < 2 || jobTitle.trim().length > 120) throw new ApiError(400, 'Job title must be between 2 and 120 characters.')
    if (typeof bio !== 'string' || bio.trim().length > 1000) throw new ApiError(400, 'About section must be 1000 characters or fewer.')
    const result = await pool.query(
      `INSERT INTO employee_profiles (user_id, phone, city, address, job_title, bio)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id) DO UPDATE SET phone = EXCLUDED.phone, city = EXCLUDED.city,
         address = EXCLUDED.address, job_title = EXCLUDED.job_title, bio = EXCLUDED.bio,
         updated_at = NOW()
       RETURNING phone, city, address, job_title AS "jobTitle", bio, updated_at AS "updatedAt"`,
      [request.user.sub, phone.trim(), city.trim(), address.trim(), jobTitle.trim(), bio.trim()],
    )
    response.json({ profile: result.rows[0], message: 'Your employee profile has been saved.' })
  } catch (error) { next(error) }
}
