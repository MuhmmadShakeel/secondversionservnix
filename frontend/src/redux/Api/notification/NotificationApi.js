import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { getAccessToken } from '../auth/AuthApi.js'

export const notificationApi = createApi({
  reducerPath: 'notificationApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/v1/notifications', prepareHeaders: (headers) => {
    const token = getAccessToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
    return headers
  } }),
  tagTypes: ['Notifications'],
  endpoints: (builder) => ({
    getNotifications: builder.query({ query: () => '/', providesTags: ['Notifications'] }),
    markRead: builder.mutation({ query: (id) => ({ url: `/${id}/read`, method: 'PATCH' }), invalidatesTags: ['Notifications'] }),
  }),
})

export const { useGetNotificationsQuery, useMarkReadMutation } = notificationApi
