import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { getAccessToken } from '../auth/AuthApi.js'
import { adminApi } from '../admin/AdminApi.js'

async function refreshAdminOrganizations(_argument, { dispatch, queryFulfilled }) {
  try {
    await queryFulfilled
    dispatch(adminApi.util.invalidateTags(['Organizations']))
  } catch { /* The mutation error is handled by the calling form. */ }
}

export const organizationApi = createApi({
  reducerPath: 'organizationApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/v1/organizations',
    prepareHeaders: (headers) => {
      const token = getAccessToken()
      if (token) headers.set('Authorization', `Bearer ${token}`)
      return headers
    },
  }),
  tagTypes: ['Organization'],
  endpoints: (builder) => ({
    getPublicOrganizations: builder.query({ query: () => '/public', providesTags: ['Organization'] }),
    getOrganization: builder.query({ query: () => '/me', providesTags: ['Organization'] }),
    getMyOrganizations: builder.query({ query: () => '/me/list', providesTags: ['Organization'] }),
    createOrganization: builder.mutation({ query: (body) => ({ url: '/', method: 'POST', body }), invalidatesTags: ['Organization'], onQueryStarted: refreshAdminOrganizations }),
    updateOrganization: builder.mutation({ query: ({ id, body }) => ({ url: `/me/${id}`, method: 'PATCH', body }), invalidatesTags: ['Organization'], onQueryStarted: refreshAdminOrganizations }),
    deleteOrganization: builder.mutation({ query: (id) => ({ url: `/me/${id}`, method: 'DELETE' }), invalidatesTags: ['Organization'], onQueryStarted: refreshAdminOrganizations }),
  }),
})

export const { useGetPublicOrganizationsQuery, useGetOrganizationQuery, useGetMyOrganizationsQuery, useCreateOrganizationMutation, useUpdateOrganizationMutation, useDeleteOrganizationMutation } = organizationApi
