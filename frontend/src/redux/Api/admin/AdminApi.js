import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { getAccessToken } from '../auth/AuthApi.js'

export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/v1/admin',
    prepareHeaders: (headers) => {
      const token = getAccessToken()
      if (token) headers.set('Authorization', `Bearer ${token}`)
      return headers
    },
  }),
  tagTypes: ['Users', 'Organizations', 'Bookings'],
  endpoints: (builder) => ({
    getUsers: builder.query({ query: () => '/users', providesTags: ['Users'] }),
    getAdminBookings: builder.query({ query: () => '/bookings', providesTags: ['Bookings'] }),
    updateUser: builder.mutation({ query: ({ id, ...body }) => ({ url: `/users/${id}`, method: 'PATCH', body }), invalidatesTags: ['Users', 'Organizations'] }),
    deleteUser: builder.mutation({ query: (id) => ({ url: `/users/${id}`, method: 'DELETE' }), invalidatesTags: ['Users', 'Organizations'] }),
    getAdminOrganizations: builder.query({ query: () => '/organizations', providesTags: ['Organizations'] }),
    updateAdminOrganization: builder.mutation({ query: ({ id, ...body }) => ({ url: `/organizations/${id}`, method: 'PATCH', body }), invalidatesTags: ['Organizations'] }),
    deleteAdminOrganization: builder.mutation({ query: (id) => ({ url: `/organizations/${id}`, method: 'DELETE' }), invalidatesTags: ['Organizations'] }),
  }),
})

export const { useGetUsersQuery, useGetAdminBookingsQuery, useUpdateUserMutation, useDeleteUserMutation, useGetAdminOrganizationsQuery, useUpdateAdminOrganizationMutation, useDeleteAdminOrganizationMutation } = adminApi
