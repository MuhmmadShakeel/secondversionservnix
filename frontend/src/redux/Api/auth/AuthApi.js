import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const tokenKey = 'servnix_token'
const userKey = 'servnix_user'

export function saveSession({ token, user }) {
  localStorage.setItem(tokenKey, token)
  localStorage.setItem(userKey, JSON.stringify(user))
}

export function getAccessToken() {
  return localStorage.getItem(tokenKey)
}

export function clearSession() {
  localStorage.removeItem(tokenKey)
  localStorage.removeItem(userKey)
}

export function getStoredUser() {
  try { return JSON.parse(localStorage.getItem(userKey)) } catch { return null }
}

export function getAuthErrorMessage(error, fallback) {
  if (error?.data?.message) return error.data.message
  if (error?.status === 'FETCH_ERROR') return 'Cannot reach the server. Check that the backend is running and try again.'
  return fallback
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/v1/auth', prepareHeaders: (headers) => {
    const token = getAccessToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
    return headers
  } }),
  tagTypes: ['Profile'],
  endpoints: (builder) => ({
    signup: builder.mutation({ query: (body) => ({ url: '/signup', method: 'POST', body }) }),
    login: builder.mutation({ query: (body) => ({ url: '/login', method: 'POST', body }) }),
    logout: builder.mutation({
      query: () => ({ url: '/logout', method: 'POST', headers: { Authorization: `Bearer ${getAccessToken()}` } }),
    }),
    getProfile: builder.query({ query: () => '/me', providesTags: ['Profile'] }),
    updateProfile: builder.mutation({ query: (body) => ({ url: '/me', method: 'PATCH', body }), invalidatesTags: ['Profile'] }),
    forgotPassword: builder.mutation({ query: (body) => ({ url: '/password/forgot', method: 'POST', body }) }),
    resetPassword: builder.mutation({ query: (body) => ({ url: '/password/reset', method: 'POST', body }) }),
    changePassword: builder.mutation({ query: (body) => ({ url: '/password', method: 'PATCH', body }) }),
  }),
})

export const { useSignupMutation, useLoginMutation, useLogoutMutation, useGetProfileQuery, useUpdateProfileMutation, useForgotPasswordMutation, useResetPasswordMutation, useChangePasswordMutation } = authApi
