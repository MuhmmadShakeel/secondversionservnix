import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { authApi } from '../Api/auth/AuthApi.js'
import { organizationApi } from '../Api/service-provider/OrganizationApi.js'
import { adminApi } from '../Api/admin/AdminApi.js'
import { bookingApi } from '../Api/booking/BookingApi.js'
import { notificationApi } from '../Api/notification/NotificationApi.js'
import { reviewApi } from '../Api/review/ReviewApi.js'
import { employeeApi } from '../Api/employee/EmployeeApi.js'
import { providerEmployeeApi } from '../Api/service-provider/ProviderEmployeeApi.js'
import { dutyApi } from '../Api/employee/DutyApi.js'
export const store = configureStore({ reducer: { [authApi.reducerPath]: authApi.reducer, [organizationApi.reducerPath]: organizationApi.reducer, [adminApi.reducerPath]: adminApi.reducer, [bookingApi.reducerPath]: bookingApi.reducer, [notificationApi.reducerPath]: notificationApi.reducer, [reviewApi.reducerPath]: reviewApi.reducer, [employeeApi.reducerPath]: employeeApi.reducer, [providerEmployeeApi.reducerPath]: providerEmployeeApi.reducer, [dutyApi.reducerPath]: dutyApi.reducer }, middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(authApi.middleware, organizationApi.middleware, adminApi.middleware, bookingApi.middleware, notificationApi.middleware, reviewApi.middleware, employeeApi.middleware, providerEmployeeApi.middleware, dutyApi.middleware) })
setupListeners(store.dispatch)
