import pool from './connection.js'
import * as initialSetup from './migrations/001_initial_setup.js'
import * as organizations from './migrations/002_organizations.js'
import * as bookingReview from './migrations/003_booking_review.js'
import * as bookingExperience from './migrations/004_booking_experience.js'
import * as bookingCustomerDetails from './migrations/005_booking_customer_details.js'
import * as multipleProviderOrganizations from './migrations/006_multiple_provider_organizations.js'
import * as employeeProfiles from './migrations/007_employee_profiles.js'
import * as organizationEmployees from './migrations/008_organization_employees.js'
import * as employeeSignupOrganization from './migrations/009_employee_signup_organization.js'
import * as employeeDutyAssignments from './migrations/010_employee_duty_assignments.js'
import * as passwordResets from './migrations/011_password_resets.js'
import * as completedAppointments from './migrations/012_completed_appointments.js'
import * as passwordResetAttempts from './migrations/013_password_reset_attempts.js'
import * as appointmentHistory from './migrations/014_appointment_history.js'
import * as customBookingDuration from './migrations/015_custom_booking_duration.js'
import * as expiredPendingAppointments from './migrations/016_expired_pending_appointments.js'
import * as rejectedAppointmentHistory from './migrations/017_rejected_appointment_history.js'
import * as appointmentTimeline from './migrations/018_appointment_timeline.js'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
const migrations = [initialSetup, organizations, bookingReview, bookingExperience, bookingCustomerDetails, multipleProviderOrganizations, employeeProfiles, organizationEmployees, employeeSignupOrganization, employeeDutyAssignments, passwordResets, completedAppointments, passwordResetAttempts, appointmentHistory, customBookingDuration, expiredPendingAppointments, rejectedAppointmentHistory, appointmentTimeline]

export async function migrate() {
  const client = await pool.connect()
  try {
    await client.query('SELECT pg_advisory_lock(hashtext($1))', ['servnix_schema_migrations'])
    await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW())')
    for (const migration of migrations) {
      await client.query('BEGIN')
      try {
        const existing = await client.query('SELECT 1 FROM schema_migrations WHERE name = $1', [migration.name])
        if (existing.rowCount) {
          await client.query('COMMIT')
          continue
        }
        await client.query(migration.up)
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [migration.name])
        console.log(`Applied ${migration.name}`)
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
  migrate().catch((error) => {
    console.error(error)
    process.exitCode = 1
  }).finally(() => pool.end())
}
