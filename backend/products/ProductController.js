import pool from '../common/database/connection.js'
import { ApiError } from '../common/utils/ApiError.js'
import { productIdPattern, validateProduct } from './productValidation.js'

const columns = `id, owner_user_id AS "ownerUserId", title, category, description,
  price, quantity, status, (image_content IS NOT NULL) AS "hasImage",
  image_file_name AS "imageFileName", created_at AS "createdAt", updated_at AS "updatedAt"`

function productId(request) {
  if (!productIdPattern.test(request.params.id || '')) throw new ApiError(400, 'Choose a valid product.')
  return request.params.id
}

function validateActive(item, hasImage) {
  if (item.status === 'active' && (!hasImage || item.quantity === 0)) {
    throw new ApiError(400, 'Add an image and at least one item in stock before publishing.')
  }
}

export async function listMyProducts(request, response, next) {
  try {
    const result = await pool.query(`SELECT ${columns} FROM products WHERE owner_user_id = $1 ORDER BY updated_at DESC`, [request.user.id])
    response.json({ products: result.rows })
  } catch (error) { next(error) }
}

export async function browseProducts(_request, response, next) {
  try {
    const result = await pool.query(
      `SELECT p.id, p.owner_user_id AS "ownerUserId", u.name AS "ownerName",
       p.title, p.category, p.description, p.price, p.quantity, p.status,
       (p.image_content IS NOT NULL) AS "hasImage", p.updated_at AS "updatedAt"
       FROM products p JOIN users u ON u.id = p.owner_user_id
       WHERE p.status = 'active' AND p.quantity > 0 ORDER BY p.updated_at DESC`,
    )
    response.json({ products: result.rows })
  } catch (error) { next(error) }
}

export async function createProduct(request, response, next) {
  try {
    const item = validateProduct(request.body)
    validateActive(item, Boolean(item.image))
    const result = await pool.query(
      `INSERT INTO products (owner_user_id, title, category, description, price, quantity, status,
       image_mime_type, image_file_name, image_content)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING ${columns}`,
      [request.user.id, item.title, item.category, item.description, item.price, item.quantity, item.status,
        item.image?.mimeType || null, item.image?.fileName || null, item.image?.content || null],
    )
    response.status(201).json({ product: result.rows[0] })
  } catch (error) { next(error) }
}

export async function updateProduct(request, response, next) {
  let client
  try {
    const id = productId(request)
    const item = validateProduct(request.body)
    client = await pool.connect()
    await client.query('BEGIN')
    const existing = await client.query('SELECT image_content IS NOT NULL AS "hasImage" FROM products WHERE id = $1 AND owner_user_id = $2 FOR UPDATE', [id, request.user.id])
    if (!existing.rowCount) throw new ApiError(404, 'Product not found.')
    validateActive(item, item.image === undefined ? existing.rows[0].hasImage : Boolean(item.image))
    const imageSql = item.image === undefined ? '' : ', image_mime_type = $9, image_file_name = $10, image_content = $11'
    const values = [id, request.user.id, item.title, item.category, item.description, item.price, item.quantity, item.status]
    if (item.image !== undefined) values.push(item.image?.mimeType || null, item.image?.fileName || null, item.image?.content || null)
    const result = await client.query(
      `UPDATE products SET title = $3, category = $4, description = $5, price = $6,
       quantity = $7, status = $8${imageSql}, updated_at = NOW()
       WHERE id = $1 AND owner_user_id = $2 RETURNING ${columns}`,
      values,
    )
    await client.query('COMMIT')
    response.json({ product: result.rows[0] })
  } catch (error) {
    if (client) await client.query('ROLLBACK')
    next(error)
  } finally { client?.release() }
}

export async function deleteProduct(request, response, next) {
  try {
    const id = productId(request)
    const owned = await pool.query('SELECT 1 FROM products WHERE id = $1 AND owner_user_id = $2', [id, request.user.id])
    if (!owned.rowCount) throw new ApiError(404, 'Product not found.')
    const ordered = await pool.query('SELECT 1 FROM product_orders WHERE product_id = $1 LIMIT 1', [id])
    if (ordered.rowCount) throw new ApiError(409, 'This product has order history. Change it to Draft instead of deleting it.')
    const result = await pool.query('DELETE FROM products WHERE id = $1 AND owner_user_id = $2 RETURNING id', [id, request.user.id])
    if (!result.rowCount) throw new ApiError(404, 'Product not found.')
    response.status(204).end()
  } catch (error) { next(error.code === '23503' ? new ApiError(409, 'This product has order history. Change it to Draft instead of deleting it.') : error) }
}

export async function getProductImage(request, response, next) {
  try {
    const result = await pool.query(
      `SELECT p.image_content, p.image_mime_type FROM products p WHERE p.id = $1
       AND (p.owner_user_id = $2 OR (p.status = 'active' AND p.quantity > 0)
         OR EXISTS (SELECT 1 FROM product_orders o WHERE o.product_id = p.id AND o.buyer_user_id = $2))`,
      [productId(request), request.user.id],
    )
    if (!result.rowCount || !result.rows[0].image_content) throw new ApiError(404, 'Product image not found.')
    response.set('Cache-Control', 'no-store')
    response.set('X-Content-Type-Options', 'nosniff')
    response.type(result.rows[0].image_mime_type).send(result.rows[0].image_content)
  } catch (error) { next(error) }
}
