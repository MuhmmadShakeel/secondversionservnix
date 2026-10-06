import { Router } from 'express'
import { createOrganization, deleteAdminOrganization, deleteOrganization, getOrganization, listAdminOrganizations, listMyOrganizations, updateAdminOrganization, updateOrganization } from './OrganizationController.js'
import { validateOrganization } from '../common/middleware/organization.middleware.js'

const organizationRouter = Router()

organizationRouter.get('/me', getOrganization)
organizationRouter.get('/me/list', listMyOrganizations)
organizationRouter.patch('/me/:id', validateOrganization, updateOrganization)
organizationRouter.delete('/me/:id', deleteOrganization)
organizationRouter.post('/', validateOrganization, createOrganization)
organizationRouter.patch('/me', validateOrganization, updateOrganization)
organizationRouter.delete('/me', deleteOrganization)

export default organizationRouter

export const adminOrganizationRouter = Router()
adminOrganizationRouter.get('/', listAdminOrganizations)
adminOrganizationRouter.patch('/:id', updateAdminOrganization)
adminOrganizationRouter.delete('/:id', deleteAdminOrganization)
