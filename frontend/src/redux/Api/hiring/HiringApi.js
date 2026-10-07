import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { getAccessToken } from '../auth/AuthApi.js'

export const hiringApi = createApi({
  reducerPath: 'hiringApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/v1/hiring',
    prepareHeaders: (headers) => {
      const token = getAccessToken()
      if (token) headers.set('Authorization', `Bearer ${token}`)
      return headers
    },
  }),
  tagTypes: ['OpenRequirements', 'MyRequirements', 'MyProposals', 'Proposals', 'Requirement'],
  endpoints: (builder) => ({
    getOpenRequirements: builder.query({ query: () => '/open', providesTags: ['OpenRequirements'] }),
    getMyRequirements: builder.query({ query: () => '/mine', providesTags: ['MyRequirements'] }),
    getRequirement: builder.query({ query: (id) => `/${id}`, providesTags: (_result, _error, id) => [{ type: 'Requirement', id }] }),
    getMyProposals: builder.query({ query: () => '/proposals/mine', providesTags: ['MyProposals'] }),
    getProposals: builder.query({ query: (id) => `/${id}/proposals`, providesTags: (_result, _error, id) => [{ type: 'Proposals', id }] }),
    createRequirement: builder.mutation({ query: (body) => ({ url: '/', method: 'POST', body }), invalidatesTags: ['OpenRequirements', 'MyRequirements'] }),
    updateRequirement: builder.mutation({ query: ({ id, ...body }) => ({ url: `/${id}`, method: 'PUT', body }), invalidatesTags: (_result, _error, { id }) => ['OpenRequirements', 'MyRequirements', { type: 'Requirement', id }] }),
    deleteRequirement: builder.mutation({ query: (id) => ({ url: `/${id}`, method: 'DELETE' }), invalidatesTags: (_result, _error, id) => ['OpenRequirements', 'MyRequirements', 'MyProposals', { type: 'Requirement', id }] }),
    submitProposal: builder.mutation({ query: ({ requirementId, ...body }) => ({ url: `/${requirementId}/proposals`, method: 'POST', body }), invalidatesTags: (_result, _error, { requirementId }) => ['OpenRequirements', 'MyRequirements', 'MyProposals', 'Proposals', { type: 'Requirement', id: requirementId }] }),
    updateProposal: builder.mutation({ query: ({ id, ...body }) => ({ url: `/proposals/${id}`, method: 'PUT', body }), invalidatesTags: ['OpenRequirements', 'MyRequirements', 'MyProposals', 'Proposals'] }),
    deleteProposal: builder.mutation({ query: (id) => ({ url: `/proposals/${id}`, method: 'DELETE' }), invalidatesTags: ['OpenRequirements', 'MyRequirements', 'MyProposals', 'Proposals', 'Requirement'] }),
    acceptProposal: builder.mutation({ query: ({ requirementId, proposalId }) => ({ url: `/${requirementId}/proposals/${proposalId}/accept`, method: 'POST' }), invalidatesTags: (_result, _error, { requirementId }) => ['OpenRequirements', 'MyRequirements', 'MyProposals', 'Proposals', { type: 'Requirement', id: requirementId }] }),
  }),
})

export const {
  useGetOpenRequirementsQuery, useGetMyRequirementsQuery, useGetRequirementQuery,
  useGetMyProposalsQuery, useGetProposalsQuery, useCreateRequirementMutation,
  useUpdateRequirementMutation, useDeleteRequirementMutation, useSubmitProposalMutation,
  useUpdateProposalMutation, useDeleteProposalMutation, useAcceptProposalMutation,
} = hiringApi
