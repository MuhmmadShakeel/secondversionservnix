import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { getAccessToken } from '../auth/AuthApi.js'
import { bookingApi } from '../booking/BookingApi.js'
import { organizationApi } from '../service-provider/OrganizationApi.js'

export const reviewApi = createApi({
  reducerPath: 'reviewApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/v1/reviews', prepareHeaders: (headers) => {
    const token = getAccessToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
    return headers
  } }),
  tagTypes: ['Reviews'],
  endpoints: (builder) => ({
    getOrganizationReviews: builder.query({ query: (id) => `/organization/${id}`, providesTags: ['Reviews'] }),
    createReview: builder.mutation({ query: (body) => ({ url: '/', method: 'POST', body }), invalidatesTags: ['Reviews'], onQueryStarted: async (_body, { dispatch, queryFulfilled }) => {
      try {
        await queryFulfilled
        dispatch(bookingApi.util.invalidateTags(['MyBookings']))
        dispatch(organizationApi.util.invalidateTags(['Organization']))
      } catch { /* The form displays the mutation error. */ }
    } }),
  }),
})

export const { useGetOrganizationReviewsQuery, useCreateReviewMutation } = reviewApi
