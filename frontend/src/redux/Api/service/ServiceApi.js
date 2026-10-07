import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { getAccessToken } from '../auth/AuthApi.js'

export const serviceApi = createApi({
  reducerPath: 'serviceApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/v1/services',
    prepareHeaders: (headers) => {
      const token = getAccessToken()
      if (token) headers.set('Authorization', `Bearer ${token}`)
      return headers
    },
  }),
  tagTypes: ['MyServices', 'BrowseServices', 'MyBookings', 'ReceivedBookings'],
  endpoints: (builder) => ({
    getMyServices: builder.query({ query: () => '/', providesTags: ['MyServices'] }),
    getActiveServices: builder.query({ query: () => '/browse', providesTags: ['BrowseServices'] }),
    getService: builder.query({ query: (id) => `/${id}` }),
    getMyBookings: builder.query({ query: () => '/bookings/mine', providesTags: ['MyBookings'] }),
    getReceivedBookings: builder.query({ query: () => '/bookings/received', providesTags: ['ReceivedBookings'] }),
    createBooking: builder.mutation({ query: ({ serviceId, ...body }) => ({ url: `/${serviceId}/bookings`, method: 'POST', body }), invalidatesTags: ['MyBookings', 'ReceivedBookings'] }),
    decideBooking: builder.mutation({ query: ({ id, status }) => ({ url: `/bookings/${id}/decision`, method: 'PATCH', body: { status } }), invalidatesTags: ['MyBookings', 'ReceivedBookings'] }),
    cancelBooking: builder.mutation({ query: (id) => ({ url: `/bookings/${id}/cancel`, method: 'PATCH' }), invalidatesTags: ['MyBookings', 'ReceivedBookings'] }),
    createService: builder.mutation({ query: (body) => ({ url: '/', method: 'POST', body }), invalidatesTags: ['MyServices', 'BrowseServices'] }),
    updateService: builder.mutation({ query: ({ id, ...body }) => ({ url: `/${id}`, method: 'PUT', body }), invalidatesTags: ['MyServices', 'BrowseServices'] }),
    deleteService: builder.mutation({ query: (id) => ({ url: `/${id}`, method: 'DELETE' }), invalidatesTags: ['MyServices', 'BrowseServices'] }),
  }),
})

export const {
  useGetMyServicesQuery, useGetActiveServicesQuery, useGetServiceQuery,
  useGetMyBookingsQuery, useGetReceivedBookingsQuery, useCreateBookingMutation,
  useDecideBookingMutation, useCancelBookingMutation,
  useCreateServiceMutation, useUpdateServiceMutation, useDeleteServiceMutation,
} = serviceApi
