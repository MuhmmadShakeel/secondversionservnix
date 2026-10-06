import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { getAccessToken } from '../auth/AuthApi.js'

export const dutyApi = createApi({
  reducerPath: 'dutyApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/v1',
    prepareHeaders: (headers) => {
      const token = getAccessToken()
      if (token) headers.set('Authorization', `Bearer ${token}`)
      return headers
    },
  }),
  tagTypes: ['ProviderDuties', 'EmployeeDuties'],
  endpoints: (builder) => ({
    getProviderDuties: builder.query({ query: () => '/provider-duties', providesTags: ['ProviderDuties'], keepUnusedDataFor: 0 }),
    assignEmployeeDuty: builder.mutation({ query: (body) => ({ url: '/provider-duties', method: 'POST', body }), invalidatesTags: ['ProviderDuties', 'EmployeeDuties'] }),
    getEmployeeDuties: builder.query({ query: () => '/employees/duties', providesTags: ['EmployeeDuties'], keepUnusedDataFor: 0 }),
  }),
})

export const { useGetProviderDutiesQuery, useAssignEmployeeDutyMutation, useGetEmployeeDutiesQuery } = dutyApi
