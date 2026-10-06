import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { getAccessToken } from '../auth/AuthApi.js'

export const bookingApi = createApi({
  reducerPath: 'bookingApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/v1/bookings',
    prepareHeaders: (headers) => {
      const token = getAccessToken()
      if (token) headers.set('Authorization', `Bearer ${token}`)
      return headers
    },
  }),
  tagTypes: ['MyBookings', 'ProviderBookings', 'Availability', 'BookingHistory'],
  endpoints: (builder) => ({
    getMyBookings: builder.query({ query: () => '/me', providesTags: ['MyBookings'] }),
    getProviderBookings: builder.query({ query: () => '/provider', providesTags: ['ProviderBookings'] }),
    getBookingHistory: builder.query({ query: (id) => `/${id}/history`, providesTags: (_result, _error, id) => [{ type: 'BookingHistory', id }] }),
    getAvailableSlots: builder.query({ query: ({ serviceId, date, durationMinutes }) => `/availability?serviceId=${encodeURIComponent(serviceId)}&date=${encodeURIComponent(date)}${durationMinutes ? `&durationMinutes=${encodeURIComponent(durationMinutes)}` : ''}`, providesTags: ['Availability'] }),
    getBookingQuote: builder.query({ query: ({ serviceId, scheduledAt, durationMinutes }) => `/quote?serviceId=${encodeURIComponent(serviceId)}&scheduledAt=${encodeURIComponent(scheduledAt)}&durationMinutes=${encodeURIComponent(durationMinutes)}`, providesTags: ['Availability'] }),
    createBooking: builder.mutation({ query: (body) => ({ url: '/', method: 'POST', body }), invalidatesTags: ['MyBookings', 'ProviderBookings', 'Availability'] }),
    reviewProviderBooking: builder.mutation({ query: ({ id, decision, reason }) => ({ url: `/provider/${id}/status`, method: 'PATCH', body: { decision, reason } }), invalidatesTags: (_result, _error, { id }) => ['MyBookings', 'ProviderBookings', 'Availability', { type: 'BookingHistory', id }] }),
    completeProviderBooking: builder.mutation({ query: (id) => ({ url: `/provider/${id}/complete`, method: 'PATCH' }), invalidatesTags: (_result, _error, id) => ['MyBookings', 'ProviderBookings', 'Availability', { type: 'BookingHistory', id }] }),
    cancelBooking: builder.mutation({ query: (id) => ({ url: `/me/${id}/cancel`, method: 'PATCH' }), invalidatesTags: (_result, _error, id) => ['MyBookings', 'ProviderBookings', 'Availability', { type: 'BookingHistory', id }] }),
    rescheduleBooking: builder.mutation({ query: ({ id, scheduledAt }) => ({ url: `/me/${id}/reschedule`, method: 'PATCH', body: { scheduledAt } }), invalidatesTags: (_result, _error, { id }) => ['MyBookings', 'ProviderBookings', 'Availability', { type: 'BookingHistory', id }] }),
  }),
})

export const { useGetMyBookingsQuery, useGetProviderBookingsQuery, useGetBookingHistoryQuery, useGetAvailableSlotsQuery, useGetBookingQuoteQuery, useCreateBookingMutation, useReviewProviderBookingMutation, useCompleteProviderBookingMutation, useCancelBookingMutation, useRescheduleBookingMutation } = bookingApi
