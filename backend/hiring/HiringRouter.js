import { Router } from 'express'
import {
  acceptProposal, browseRequirements, createRequirement, deleteProposal, deleteRequirement,
  getMedia, getRequirement, listProposals, myProposals, myRequirements,
  submitProposal, updateProposal, updateRequirement,
} from './HiringController.js'

const router = Router()
router.get('/open', browseRequirements)
router.get('/mine', myRequirements)
router.get('/proposals/mine', myProposals)
router.put('/proposals/:id', updateProposal)
router.delete('/proposals/:id', deleteProposal)
router.get('/media/:id', getMedia)
router.post('/', createRequirement)
router.get('/:id', getRequirement)
router.put('/:id', updateRequirement)
router.delete('/:id', deleteRequirement)
router.get('/:id/proposals', listProposals)
router.post('/:id/proposals', submitProposal)
router.post('/:id/proposals/:proposalId/accept', acceptProposal)

export default router
