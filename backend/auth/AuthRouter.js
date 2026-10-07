import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import { login, logout, me, signup } from './AuthController.js'
import { forgotPassword, resetPassword } from './PasswordController.js'
import { authenticate } from './auth.middleware.js'

const router = Router()
const authLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 15, standardHeaders: 'draft-8', legacyHeaders: false })
const recoveryLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: 'draft-8', legacyHeaders: false })

router.post('/signup', authLimit, signup)
router.post('/login', authLimit, login)
router.post('/password/forgot', recoveryLimit, forgotPassword)
router.post('/password/reset', recoveryLimit, resetPassword)
router.get('/me', authenticate, me)
router.post('/logout', authenticate, logout)

export default router
