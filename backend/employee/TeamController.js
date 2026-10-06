import pool from '../common/database/connection.js'
import { ApiError } from '../common/utils/ApiError.js'

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function listProviderEmployees(request, response, next) {
  try {
    const result = await pool.query(
      `SELECT link.id, link.employee_user_id AS "employeeId", link.organization_id AS "organizationId", o.business_name AS "organizationName",
         link.status, link.created_at AS "invitedAt", u.name, u.email,
         CASE WHEN link.status = 'accepted' THEN p.phone END AS phone,
         CASE WHEN link.status = 'accepted' THEN p.city END AS city,
         CASE WHEN link.status = 'accepted' THEN p.address END AS address,
         CASE WHEN link.status = 'accepted' THEN p.job_title END AS "jobTitle",
         CASE WHEN link.status = 'accepted' THEN p.bio END AS bio
       FROM organization_employees link
       JOIN organizations o ON o.id = link.organization_id
       JOIN users u ON u.id = link.employee_user_id
       LEFT JOIN employee_profiles p ON p.user_id = u.id
       WHERE o.owner_user_id = $1 ORDER BY o.business_name, u.name`,
      [request.user.sub],
    )
    response.json({ employees: result.rows })
  } catch (error) { next(error) }
}

export async function listEmployeeDirectory(_request, response, next) {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, p.job_title AS "jobTitle", p.city, p.bio
       FROM employee_profiles p JOIN users u ON u.id = p.user_id
       WHERE u.role = 'employee' AND u.status <> 'suspended'
         AND NULLIF(BTRIM(p.phone), '') IS NOT NULL
         AND NULLIF(BTRIM(p.city), '') IS NOT NULL
         AND NULLIF(BTRIM(p.address), '') IS NOT NULL
         AND NULLIF(BTRIM(p.job_title), '') IS NOT NULL
       ORDER BY p.updated_at DESC, u.name`,
    )
    response.json({ employees: result.rows })
  } catch (error) { next(error) }
}

export async function inviteEmployee(request, response, next) {
  try {
    const { organizationId, email, employeeId } = request.body ?? {}
    if (!uuidPattern.test(organizationId || '')) throw new ApiError(400, 'Choose an organization.')
    if (employeeId !== undefined && !uuidPattern.test(employeeId)) throw new ApiError(400, 'Choose a valid employee.')
    if (!employeeId && (typeof email !== 'string' || !emailPattern.test(email.trim()) || email.trim().length > 255)) throw new ApiError(400, 'Enter a valid employee email.')
    const result = await pool.query(
      `INSERT INTO organization_employees (organization_id, employee_user_id)
       SELECT o.id, u.id FROM organizations o CROSS JOIN users u
       WHERE o.id = $1 AND o.owner_user_id = $2 AND (($3::uuid IS NOT NULL AND u.id = $3) OR ($3::uuid IS NULL AND u.email = $4))
         AND u.role = 'employee' AND u.status <> 'suspended'
       ON CONFLICT (organization_id, employee_user_id) DO NOTHING RETURNING id`,
      [organizationId, request.user.sub, employeeId || null, employeeId ? null : email.trim().toLowerCase()],
    )
    if (!result.rowCount) {
      const organization = await pool.query('SELECT 1 FROM organizations WHERE id = $1 AND owner_user_id = $2', [organizationId, request.user.sub])
      if (!organization.rowCount) throw new ApiError(404, 'Organization not found.')
      const employee = await pool.query("SELECT 1 FROM users WHERE (($1::uuid IS NOT NULL AND id = $1) OR ($1::uuid IS NULL AND email = $2)) AND role = 'employee' AND status <> 'suspended'", [employeeId || null, employeeId ? null : email.trim().toLowerCase()])
      if (!employee.rowCount) throw new ApiError(404, 'No registered employee account was found with that email.')
      throw new ApiError(409, 'This employee has already been invited to this organization.')
    }
    response.status(201).json({ message: 'Invitation added. The employee can accept it from their dashboard.' })
  } catch (error) { next(error) }
}

export async function removeProviderEmployee(request, response, next) {
  let client
  try {
    if (!uuidPattern.test(request.params.id)) throw new ApiError(400, 'Invalid employee link ID.')
    client = await pool.connect()
    await client.query('BEGIN')
    const result = await client.query(
      `SELECT link.id, link.organization_id, link.employee_user_id
       FROM organization_employees link JOIN organizations o ON o.id = link.organization_id
       WHERE link.id = $1 AND o.owner_user_id = $2 FOR UPDATE OF link`,
      [request.params.id, request.user.sub],
    )
    if (!result.rowCount) throw new ApiError(404, 'Employee link not found.')
    const link = result.rows[0]
    await client.query('DELETE FROM employee_duty_assignments WHERE organization_id = $1 AND employee_user_id = $2', [link.organization_id, link.employee_user_id])
    await client.query('DELETE FROM organization_employees WHERE id = $1', [link.id])
    await client.query('COMMIT')
    response.json({ message: 'Employee removed from this organization.' })
  } catch (error) {
    if (client) await client.query('ROLLBACK')
    next(error)
  } finally { client?.release() }
}

export async function listEmployeeInvitations(request, response, next) {
  try {
    const result = await pool.query(
      `SELECT link.id, link.status, o.business_name AS "organizationName", o.address AS "organizationAddress",
         link.created_at AS "invitedAt" FROM organization_employees link
       JOIN organizations o ON o.id = link.organization_id
       WHERE link.employee_user_id = $1 ORDER BY link.created_at DESC`,
      [request.user.sub],
    )
    response.json({ invitations: result.rows })
  } catch (error) { next(error) }
}

export async function respondToInvitation(request, response, next) {
  try {
    if (!uuidPattern.test(request.params.id)) throw new ApiError(400, 'Invalid invitation ID.')
    if (!['accept', 'decline'].includes(request.body?.decision)) throw new ApiError(400, 'Choose accept or decline.')
    const query = request.body.decision === 'accept'
      ? "UPDATE organization_employees SET status = 'accepted', updated_at = NOW() WHERE id = $1 AND employee_user_id = $2 AND status = 'pending' RETURNING id"
      : "DELETE FROM organization_employees WHERE id = $1 AND employee_user_id = $2 AND status = 'pending' RETURNING id"
    const result = await pool.query(query, [request.params.id, request.user.sub])
    if (!result.rowCount) throw new ApiError(404, 'Pending invitation not found.')
    response.json({ message: request.body.decision === 'accept' ? 'Organization invitation accepted.' : 'Invitation declined.' })
  } catch (error) { next(error) }
}
