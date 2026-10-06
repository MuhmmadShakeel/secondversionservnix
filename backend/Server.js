import cors from 'cors'
import express from 'express'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import authRouter, { adminUserRouter } from './auth/AuthRouter.js'
import organizationRouter, { adminOrganizationRouter } from './organization/OrganizationRouter.js'
import { listPublicOrganizations } from './organization/OrganizationController.js'
import bookingRouter from './booking/BookingRouter.js'
import { expirePendingBookings, expirePendingBookingsBeforeRequest } from './booking/expirePendingBookings.js'
import { getAdminBookings, getAvailability } from './booking/BookingController.js'
import notificationRouter from './booking/NotificationRouter.js'
import reviewRouter from './organization/ReviewRouter.js'
import employeeRouter from './employee/EmployeeRouter.js'
import providerTeamRouter from './employee/ProviderTeamRouter.js'
import providerDutyRouter from './employee/ProviderDutyRouter.js'
import { env } from './common/config/env.js'
import pool from './common/database/connection.js'
import { migrate } from './common/database/migrate.js'
import {
  errorHandler,
  notFound,
} from './common/middleware/error.middleware.js'
import { authenticate } from './common/middleware/auth.middleware.js'
import { allowRoles } from './common/middleware/role.middleware.js'

const app = express()

app.use(
  cors({
    origin: [env.clientUrl, 'http://localhost:5173', 'http://localhost:5174'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Authorization'],
  }),
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok' })
})

app.use('/v1/auth', authRouter)
app.use('/v1/admin/organizations', authenticate, allowRoles('platform_admin'), adminOrganizationRouter)
app.use('/v1/admin', adminUserRouter)
app.get('/v1/admin/bookings', authenticate, allowRoles('platform_admin'), getAdminBookings)
app.get('/v1/organizations/public', listPublicOrganizations)
app.use('/v1/bookings', expirePendingBookingsBeforeRequest)
app.get('/v1/bookings/availability', getAvailability)
app.use('/v1/reviews', reviewRouter)
app.use('/v1/notifications', authenticate, notificationRouter)
app.use('/v1/organizations', authenticate, allowRoles('service_provider'), organizationRouter)
app.use('/v1/employees', authenticate, allowRoles('employee'), employeeRouter)
app.use('/v1/provider-employees', authenticate, allowRoles('service_provider'), providerTeamRouter)
app.use('/v1/provider-duties', authenticate, allowRoles('service_provider'), providerDutyRouter)
app.use('/v1/bookings', authenticate, bookingRouter)

app.use(notFound)
app.use(errorHandler)

export async function startServer() {
  await pool.query('SELECT 1')
  await migrate()
  await expirePendingBookings()

  const expiryTimer = setInterval(() => {
    expirePendingBookings().catch((error) => console.error('Unable to expire pending bookings:', error))
  }, 60_000)
  expiryTimer.unref()

  app.listen(env.port, () => {
    console.log(`Servnix API listening on port ${env.port}`)
  })
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  startServer().catch((error) => {
    console.error('Unable to start Servnix API:', error)
    process.exit(1)
  })
}

export default app
