import { Router } from 'express'
import { getEmployeeProfile, saveEmployeeProfile } from './EmployeeController.js'
import { listEmployeeInvitations, respondToInvitation } from './TeamController.js'
import { listEmployeeDuties } from './DutyController.js'

const employeeRouter = Router()
employeeRouter.get('/me', getEmployeeProfile)
employeeRouter.put('/me', saveEmployeeProfile)
employeeRouter.get('/invitations', listEmployeeInvitations)
employeeRouter.patch('/invitations/:id', respondToInvitation)
employeeRouter.get('/duties', listEmployeeDuties)

export default employeeRouter
