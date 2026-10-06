import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { getAccessToken } from '../auth/AuthApi.js'

export const providerEmployeeApi = createApi({
  reducerPath: 'providerEmployeeApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/v1/provider-employees',
    prepareHeaders: (headers) => {
      const token = getAccessToken()
      if (token) headers.set('Authorization', `Bearer ${token}`)
      return headers
    },
  }),
  tagTypes: ['ProviderEmployees'],
  endpoints: (builder) => ({
    getProviderEmployees: builder.query({ query: () => '/', providesTags: ['ProviderEmployees'] }),
    getEmployeeDirectory: builder.query({ query: () => '/directory', providesTags: ['ProviderEmployees'] }),
    inviteProviderEmployee: builder.mutation({ query: (body) => ({ url: '/', method: 'POST', body }), invalidatesTags: ['ProviderEmployees'] }),
    removeProviderEmployee: builder.mutation({ query: (id) => ({ url: `/${id}`, method: 'DELETE' }), invalidatesTags: ['ProviderEmployees'] }),
  }),
})

export const { useGetProviderEmployeesQuery, useGetEmployeeDirectoryQuery, useInviteProviderEmployeeMutation, useRemoveProviderEmployeeMutation } = providerEmployeeApi
