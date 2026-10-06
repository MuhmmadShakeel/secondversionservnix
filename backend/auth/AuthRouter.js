import { Router } from 'express'
import {
  login,
  logout,
  signup,
  listUsers,
  updateUser,
  deleteUser,
  getProfile,
  updateProfile,
} from './AuthController.js'
import {
  validateLogin,
  validateSignup,
} from '../common/middleware/validate.middleware.js'
import { tokenResponseHeader } from '../common/middleware/auth.middleware.js'
import { authenticate } from '../common/middleware/auth.middleware.js'
import { allowRoles } from '../common/middleware/role.middleware.js'
import { rateLimit } from 'express-rate-limit'
import { changePassword, requestPasswordReset, resetPassword } from './PasswordController.js'

const authRouter = Router()
const limit = (max, windowMs) => rateLimit({ windowMs, limit: max, standardHeaders: 'draft-8', legacyHeaders: false, message: { message: 'Too many requests. Please try again later.' } })
const loginLimit = limit(8, 15 * 60 * 1000)
const signupLimit = limit(5, 60 * 60 * 1000)
const resetRequestLimit = limit(3, 60 * 60 * 1000)
const passwordLimit = limit(8, 15 * 60 * 1000)

authRouter.use(tokenResponseHeader)

authRouter.post('/signup', signupLimit, validateSignup, signup)
authRouter.post('/login', loginLimit, validateLogin, login)
authRouter.post('/password/forgot', resetRequestLimit, requestPasswordReset)
authRouter.post('/password/reset', passwordLimit, resetPassword)
authRouter.patch('/password', authenticate, passwordLimit, changePassword)
authRouter.post('/logout', authenticate, logout)
authRouter.get('/me', authenticate, getProfile)
authRouter.patch('/me', authenticate, updateProfile)

export default authRouter

export const adminUserRouter = Router()
adminUserRouter.use(authenticate, allowRoles('platform_admin'))
adminUserRouter.get('/users', listUsers)
adminUserRouter.patch('/users/:id', updateUser)
adminUserRouter.delete('/users/:id', deleteUser)
