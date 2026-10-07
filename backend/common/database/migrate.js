import pool from './connection.js'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import * as auth from './migrations/001_auth.js'
import * as services from './migrations/002_services.js'
import * as hiring from './migrations/003_hiring.js'
import * as serviceBookings from './migrations/004_service_bookings.js'
import * as serviceBookingPendingIndex from './migrations/005_service_booking_pending_index.js'
import * as products from './migrations/006_products.js'
import * as productCommerce from './migrations/007_product_commerce.js'

// Register new marketplace migrations here as they are written.
const migrations = [auth, services, hiring, serviceBookings, serviceBookingPendingIndex, products, productCommerce]

export async function migrate() {
  const client = await pool.connect()
  try {
    await client.query('SELECT pg_advisory_lock(hashtext($1))', ['servnix_schema_migrations'])
    await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW())')
    for (const migration of migrations) {
      await client.query('BEGIN')
      try {
        const existing = await client.query('SELECT 1 FROM schema_migrations WHERE name = $1', [migration.name])
        if (!existing.rowCount) {
          await client.query(migration.up)
          await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [migration.name])
        }
        await client.query('COMMIT')
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      }
    }
  } finally {
    try {
      await client.query('SELECT pg_advisory_unlock(hashtext($1))', ['servnix_schema_migrations'])
    } finally {
      client.release()
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  migrate().catch((error) => { console.error(error); process.exitCode = 1 }).finally(() => pool.end())
}
