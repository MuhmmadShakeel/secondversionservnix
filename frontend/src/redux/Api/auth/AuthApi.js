import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { useSyncExternalStore } from 'react'

const tokenKey = 'servnix_token'
const userKey = 'servnix_user'

export const getAccessToken = () => sessionStorage.getItem(tokenKey)
const sessionEvent = 'servnix:session-change'
export const useAuthToken = () => useSyncExternalStore(
  (notify) => { window.addEventListener(sessionEvent, notify); return () => window.removeEventListener(sessionEvent, notify) },
  getAccessToken,
)
export function getStoredUser() {
  try { return JSON.parse(sessionStorage.getItem(userKey)) } catch { return null }
}
export function saveSession({ token, user }) {
  sessionStorage.setItem(tokenKey, token)
  sessionStorage.setItem(userKey, JSON.stringify(user))
  window.dispatchEvent(new Event(sessionEvent))
}
export function clearSession() {
  sessionStorage.removeItem(tokenKey)
  sessionStorage.removeItem(userKey)
  window.dispatchEvent(new Event(sessionEvent))
}
export function authErrorMessage(error) {
  return error?.data?.message || (error?.status === 'FETCH_ERROR' ? 'Cannot reach the server. Please try again.' : 'Something went wrong. Please try again.')
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/v1/auth',
    prepareHeaders: (headers) => {
      const token = getAccessToken()
      if (token) headers.set('Authorization', `Bearer ${token}`)
      return headers
    },
  }),
  tagTypes: ['Session'],
  endpoints: (builder) => ({
    signup: builder.mutation({ query: (body) => ({ url: '/signup', method: 'POST', body }) }),
    login: builder.mutation({ query: (body) => ({ url: '/login', method: 'POST', body }) }),
    me: builder.query({ query: () => '/me', providesTags: ['Session'] }),
    logout: builder.mutation({ query: (token) => ({ url: '/logout', method: 'POST', headers: { Authorization: `Bearer ${token}` } }) }),
    forgotPassword: builder.mutation({ query: (email) => ({ url: '/password/forgot', method: 'POST', body: { email } }) }),
    resetPassword: builder.mutation({ query: (body) => ({ url: '/password/reset', method: 'POST', body }) }),
  }),
})

export const { useSignupMutation, useLoginMutation, useMeQuery, useLogoutMutation, useForgotPasswordMutation, useResetPasswordMutation } = authApi
