import { Router } from 'express'
import { assignDuty, listProviderDuties } from './DutyController.js'

const providerDutyRouter = Router()
providerDutyRouter.get('/', listProviderDuties)
providerDutyRouter.post('/', assignDuty)

export default providerDutyRouter
