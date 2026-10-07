import cors from 'cors'
import express from 'express'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { env } from './common/config/env.js'
import pool from './common/database/connection.js'
import { migrate } from './common/database/migrate.js'
import { errorHandler, notFound } from './common/middleware/error.middleware.js'
import authRouter from './auth/AuthRouter.js'
import serviceRouter from './services/ServiceRouter.js'
import { authenticate } from './auth/auth.middleware.js'
import hiringRouter from './hiring/HiringRouter.js'
import productRouter from './products/ProductRouter.js'

const app = express()
app.use(cors({ origin: env.clientUrl, allowedHeaders: ['Content-Type', 'Authorization'], exposedHeaders: ['Authorization'] }))
app.use('/v1/hiring', express.json({ limit: '24mb' }))
app.use('/v1/products', express.json({ limit: '8mb' }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.get('/api/health', (_request, response) => response.json({ status: 'ok' }))
app.use('/v1/auth', authRouter)
app.use('/v1/services', authenticate, serviceRouter)
app.use('/v1/hiring', authenticate, hiringRouter)
app.use('/v1/products', authenticate, productRouter)

// Add marketplace routes here as each feature is built.
app.use(notFound)
app.use(errorHandler)

export async function startServer() {
  await pool.query('SELECT 1')
  await migrate()
  app.listen(env.port, () => console.log(`Servnix API listening on port ${env.port}`))
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  startServer().catch((error) => {
    console.error('Unable to start Servnix API:', error)
    process.exit(1)
  })
}

export default app
