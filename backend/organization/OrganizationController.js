import pool from '../common/database/connection.js'
import { ApiError } from '../common/utils/ApiError.js'

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const organizationStatuses = ['pending', 'approved', 'rejected', 'suspended']

function optionalString(value, label, maxLength, minLength = 1) {
  if (value === undefined) return undefined
  if (typeof value !== 'string' || value.trim().length < minLength || value.trim().length > maxLength) {
    throw new ApiError(400, `${label} is invalid.`)
  }
  return value.trim()
}

async function readOrganization(client, ownerUserId, organizationId) {
  const organizationResult = await client.query(
    `SELECT id, business_name AS "businessName", email, phone, address, description, status, created_at AS "createdAt", updated_at AS "updatedAt"
     FROM organizations WHERE owner_user_id = $1 AND ($2::uuid IS NULL OR id = $2) ORDER BY created_at DESC LIMIT 1`,
    [ownerUserId, organizationId || null],
  )
  const organization = organizationResult.rows[0]
  if (!organization) return null

  const servicesResult = await client.query(
      `SELECT id, name, duration_minutes AS "durationMinutes", price
       FROM organization_services WHERE organization_id = $1 ORDER BY created_at`,
      [organization.id],
    )
  const availabilityResult = await client.query(
      `SELECT day_of_week AS "dayOfWeek", TO_CHAR(start_time, 'HH24:MI') AS "startTime", TO_CHAR(end_time, 'HH24:MI') AS "endTime"
       FROM organization_availability WHERE organization_id = $1 ORDER BY day_of_week`,
      [organization.id],
    )

  return { ...organization, services: servicesResult.rows, availability: availabilityResult.rows }
}

async function saveOrganization(client, ownerUserId, body, existingId) {
  const { businessName, email, phone, address, description = '', services, availability } = body
  let organizationId = existingId

  if (organizationId) {
    await client.query(
      `UPDATE organizations
       SET business_name = $1, email = $2, phone = $3, address = $4, description = $5, status = 'pending', updated_at = NOW()
       WHERE id = $6 AND owner_user_id = $7`,
      [businessName.trim(), email.trim().toLowerCase(), phone.trim(), address.trim(), description.trim(), organizationId, ownerUserId],
    )
    await client.query('DELETE FROM organization_availability WHERE organization_id = $1', [organizationId])
  } else {
    const result = await client.query(
      `INSERT INTO organizations (owner_user_id, business_name, email, phone, address, description)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [ownerUserId, businessName.trim(), email.trim().toLowerCase(), phone.trim(), address.trim(), description.trim()],
    )
    organizationId = result.rows[0].id
  }

  const retainedServiceIds = []
  for (const service of services) {
    const price = service.price === '' || service.price === undefined ? null : Number(service.price)
    if (service.id && existingId) {
      const updated = await client.query(
        `UPDATE organization_services SET name = $3, duration_minutes = $4, price = $5
         WHERE id = $1 AND organization_id = $2 RETURNING id`,
        [service.id, organizationId, service.name.trim(), service.durationMinutes, price],
      )
      if (!updated.rowCount) throw new ApiError(400, 'One of the services does not belong to this organization.')
      retainedServiceIds.push(service.id)
    } else {
      const added = await client.query(
        `INSERT INTO organization_services (organization_id, name, duration_minutes, price)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [organizationId, service.name.trim(), service.durationMinutes, price],
      )
      retainedServiceIds.push(added.rows[0].id)
    }
  }
  if (existingId) {
    await client.query('DELETE FROM organization_services WHERE organization_id = $1 AND NOT (id = ANY($2::uuid[]))', [organizationId, retainedServiceIds])
  }
  for (const slot of availability) {
    await client.query(
      `INSERT INTO organization_availability (organization_id, day_of_week, start_time, end_time)
       VALUES ($1, $2, $3, $4)`,
      [organizationId, slot.dayOfWeek, slot.startTime, slot.endTime],
    )
  }
  return organizationId
}

export async function listPublicOrganizations(_request, response, next) {
  try {
    const result = await pool.query(
      `SELECT o.id, o.business_name AS "businessName", o.email, o.phone, o.address, o.description,
         (SELECT ROUND(AVG(r.rating)::numeric, 1) FROM organization_reviews r WHERE r.organization_id = o.id) AS "averageRating",
         (SELECT COUNT(*)::integer FROM organization_reviews r WHERE r.organization_id = o.id) AS "reviewCount",
         COALESCE((SELECT json_agg(json_build_object('id', s.id, 'name', s.name,
           'durationMinutes', s.duration_minutes, 'price', s.price) ORDER BY s.created_at)
           FROM organization_services s WHERE s.organization_id = o.id), '[]'::json) AS services,
         COALESCE((SELECT json_agg(json_build_object('dayOfWeek', a.day_of_week,
           'startTime', TO_CHAR(a.start_time, 'HH24:MI'), 'endTime', TO_CHAR(a.end_time, 'HH24:MI')) ORDER BY a.day_of_week)
           FROM organization_availability a WHERE a.organization_id = o.id), '[]'::json) AS availability
       FROM organizations o
       JOIN users u ON u.id = o.owner_user_id
       WHERE o.status = 'approved' AND u.status <> 'suspended' AND u.role = 'service_provider'
       ORDER BY o.business_name`,
    )
    response.json({ organizations: result.rows })
  } catch (error) {
    next(error)
  }
}

export async function getOrganization(request, response, next) {
  try {
    const organization = await readOrganization(pool, request.user.sub)
    if (!organization) throw new ApiError(404, 'Create your organization to continue.')
    response.json({ organization })
  } catch (error) {
    next(error)
  }
}

export async function listMyOrganizations(request, response, next) {
  try {
    const result = await pool.query('SELECT id FROM organizations WHERE owner_user_id = $1 ORDER BY created_at DESC', [request.user.sub])
    const organizations = await Promise.all(result.rows.map(({ id }) => readOrganization(pool, request.user.sub, id)))
    response.json({ organizations })
  } catch (error) { next(error) }
}

export async function createOrganization(request, response, next) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const id = await saveOrganization(client, request.user.sub, request.body)
    const organization = await readOrganization(client, request.user.sub, id)
    await client.query('COMMIT')
    response.status(201).json({ message: 'Your organization has been saved and is pending approval.', organization })
  } catch (error) {
    await client.query('ROLLBACK')
    next(error)
  } finally {
    client.release()
  }
}

export async function updateOrganization(request, response, next) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    if (request.params.id && !uuidPattern.test(request.params.id)) throw new ApiError(400, 'Invalid organization ID.')
    const existing = await readOrganization(client, request.user.sub, request.params.id)
    if (!existing) throw new ApiError(404, 'Organization was not found.')
    await saveOrganization(client, request.user.sub, request.body, existing.id)
    const organization = await readOrganization(client, request.user.sub, existing.id)
    await client.query('COMMIT')
    response.json({ message: 'Organization details have been updated.', organization })
  } catch (error) {
    await client.query('ROLLBACK')
    next(error)
  } finally {
    client.release()
  }
}

export async function deleteOrganization(request, response, next) {
  try {
    if (request.params.id && !uuidPattern.test(request.params.id)) throw new ApiError(400, 'Invalid organization ID.')
    const result = await pool.query('DELETE FROM organizations WHERE owner_user_id = $1 AND id = COALESCE($2::uuid, (SELECT id FROM organizations WHERE owner_user_id = $1 ORDER BY created_at DESC LIMIT 1)) RETURNING id', [request.user.sub, request.params.id || null])
    if (!result.rowCount) throw new ApiError(404, 'Organization was not found.')
    response.json({ message: 'Organization and its setup data have been deleted.' })
  } catch (error) {
    next(error)
  }
}

export async function listAdminOrganizations(_request, response, next) {
  try {
    const result = await pool.query(
      `SELECT o.id, o.business_name AS "businessName", o.email, o.phone, o.address,
         o.description, o.status, o.created_at AS "createdAt",
         u.id AS "ownerId", u.name AS "ownerName", u.email AS "ownerEmail",
         COUNT(s.id)::integer AS "serviceCount",
         COALESCE((SELECT json_agg(json_build_object('id', entry.id, 'name', entry.name,
           'durationMinutes', entry.duration_minutes, 'price', entry.price) ORDER BY entry.created_at)
           FROM organization_services entry WHERE entry.organization_id = o.id), '[]'::json) AS services,
         COALESCE((SELECT json_agg(json_build_object('dayOfWeek', slot.day_of_week,
           'startTime', TO_CHAR(slot.start_time, 'HH24:MI'), 'endTime', TO_CHAR(slot.end_time, 'HH24:MI')) ORDER BY slot.day_of_week)
           FROM organization_availability slot WHERE slot.organization_id = o.id), '[]'::json) AS availability
       FROM organizations o JOIN users u ON u.id = o.owner_user_id
       LEFT JOIN organization_services s ON s.organization_id = o.id
       GROUP BY o.id, u.id ORDER BY o.created_at DESC`,
    )
    response.json({ organizations: result.rows })
  } catch (error) { next(error) }
}

export async function updateAdminOrganization(request, response, next) {
  try {
    if (!uuidPattern.test(request.params.id)) throw new ApiError(400, 'Invalid organization ID.')
    const { businessName, email, phone, address, description, status } = request.body
    if (![businessName, email, phone, address, description, status].some((value) => value !== undefined)) throw new ApiError(400, 'Provide at least one field to update.')
    const cleanName = optionalString(businessName, 'Business name', 160, 2)
    const cleanEmail = optionalString(email, 'Business email', 255)?.toLowerCase()
    if (cleanEmail && !emailPattern.test(cleanEmail)) throw new ApiError(400, 'Enter a valid business email.')
    const cleanPhone = optionalString(phone, 'Phone', 30, 7)
    const cleanAddress = optionalString(address, 'Address', 300, 5)
    if (description !== undefined && (typeof description !== 'string' || description.length > 2000)) throw new ApiError(400, 'Description is too long.')
    if (status !== undefined && !organizationStatuses.includes(status)) throw new ApiError(400, 'Invalid organization status.')
    const result = await pool.query(
      `UPDATE organizations SET business_name = COALESCE($2, business_name),
        email = COALESCE($3, email), phone = COALESCE($4, phone),
        address = COALESCE($5, address), description = COALESCE($6, description),
        status = COALESCE($7, status), updated_at = NOW()
       WHERE id = $1 RETURNING id, business_name AS "businessName", email, status`,
      [request.params.id, cleanName ?? null, cleanEmail ?? null, cleanPhone ?? null, cleanAddress ?? null, description ?? null, status ?? null],
    )
    if (!result.rowCount) throw new ApiError(404, 'Organization not found.')
    response.json({ organization: result.rows[0], message: 'Organization updated.' })
  } catch (error) { next(error) }
}

export async function deleteAdminOrganization(request, response, next) {
  try {
    if (!uuidPattern.test(request.params.id)) throw new ApiError(400, 'Invalid organization ID.')
    const result = await pool.query('DELETE FROM organizations WHERE id = $1 RETURNING id', [request.params.id])
    if (!result.rowCount) throw new ApiError(404, 'Organization not found.')
    response.json({ message: 'Organization and services deleted.' })
  } catch (error) { next(error) }
}
