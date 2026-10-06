import { Router } from 'express'
import { inviteEmployee, listEmployeeDirectory, listProviderEmployees, removeProviderEmployee } from './TeamController.js'

const providerTeamRouter = Router()
providerTeamRouter.get('/', listProviderEmployees)
providerTeamRouter.get('/directory', listEmployeeDirectory)
providerTeamRouter.post('/', inviteEmployee)
providerTeamRouter.delete('/:id', removeProviderEmployee)

export default providerTeamRouter
