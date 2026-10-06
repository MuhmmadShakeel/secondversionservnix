import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { getAccessToken } from '../auth/AuthApi.js'

export const employeeApi = createApi({
  reducerPath: 'employeeApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/v1/employees',
    prepareHeaders: (headers) => {
      const token = getAccessToken()
      if (token) headers.set('Authorization', `Bearer ${token}`)
      return headers
    },
  }),
  tagTypes: ['EmployeeProfile', 'Invitations'],
  endpoints: (builder) => ({
    getEmployeeProfile: builder.query({ query: () => '/me', providesTags: ['EmployeeProfile'] }),
    saveEmployeeProfile: builder.mutation({ query: (body) => ({ url: '/me', method: 'PUT', body }), invalidatesTags: ['EmployeeProfile'] }),
    getEmployeeInvitations: builder.query({ query: () => '/invitations', providesTags: ['Invitations'] }),
    respondToEmployeeInvitation: builder.mutation({ query: ({ id, decision }) => ({ url: `/invitations/${id}`, method: 'PATCH', body: { decision } }), invalidatesTags: ['Invitations'] }),
  }),
})

export const { useGetEmployeeProfileQuery, useSaveEmployeeProfileMutation, useGetEmployeeInvitationsQuery, useRespondToEmployeeInvitationMutation } = employeeApi
