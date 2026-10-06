import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { useDispatch } from 'react-redux'
import {
  getAuthErrorMessage,
  authApi,
  saveSession,
  useLoginMutation,
  useSignupMutation,
} from '../../redux/Api/auth/AuthApi.js'
import { organizationApi, useGetPublicOrganizationsQuery } from '../../redux/Api/service-provider/OrganizationApi.js'
import { adminApi } from '../../redux/Api/admin/AdminApi.js'
import { bookingApi } from '../../redux/Api/booking/BookingApi.js'
import { employeeApi } from '../../redux/Api/employee/EmployeeApi.js'
import { providerEmployeeApi } from '../../redux/Api/service-provider/ProviderEmployeeApi.js'
import { dutyApi } from '../../redux/Api/employee/DutyApi.js'

const inputClass = 'w-full rounded-xl border border-[#eadde3] bg-white px-4 py-3 text-sm text-[#301a28] outline-none transition placeholder:text-[#a78c99] focus:border-[#d93777] focus:ring-4 focus:ring-[#fce6ef]'

export default function Signup({ onLogin, onAuthenticated }) {
  const dispatch = useDispatch()
  const [login, loginState] = useLoginMutation()
  const [signup, signupState] = useSignupMutation()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer',
    organizationId: '',
  })
  const { data: organizationData, isLoading: organizationsLoading, error: organizationsError, refetch: refetchOrganizations } = useGetPublicOrganizationsQuery(undefined, { skip: form.role !== 'employee' })

  function update(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
      ...(event.target.name === 'role' ? { organizationId: '' } : {}),
    })
  }

  async function submit(event) {
    event.preventDefault()
    const organizationId = event.currentTarget.elements.namedItem('organizationId')?.value?.trim() || ''
    if (form.role === 'employee' && !organizationData?.organizations?.some((organization) => organization.id === organizationId)) {
      toast.error('Please select an approved organization from the list.')
      return
    }

    try {
      const body = { name: form.name, email: form.email, password: form.password, role: form.role }
      if (form.role === 'employee') body.organizationId = organizationId
      const result = await signup(body).unwrap()
      if (result.user?.role !== form.role) {
        toast.error('Account type could not be confirmed. Please contact support.')
        return
      }
      toast.success(form.role === 'employee' ? 'Employee account created. Log in to open your dashboard.' : result.message || 'Your account has been created.')
      if (form.role === 'employee') {
        onLogin()
        return
      }
      try {
        const session = await login({ email: form.email, password: form.password }).unwrap()
        saveSession(session)
        dispatch(authApi.util.resetApiState())
        dispatch(organizationApi.util.resetApiState())
        dispatch(adminApi.util.resetApiState())
        dispatch(bookingApi.util.resetApiState())
        dispatch(employeeApi.util.resetApiState())
        dispatch(providerEmployeeApi.util.resetApiState())
        dispatch(dutyApi.util.resetApiState())
        onAuthenticated(session.user)
      } catch {
        toast('Account created. Please log in to continue.')
        onLogin()
      }
    } catch (error) {
      toast.error(getAuthErrorMessage(error, 'Unable to create your account.'))
    }
  }

  return (
    <section className="w-full rounded-3xl border border-white/80 bg-white p-7 shadow-[0_20px_70px_rgba(104,37,65,0.12)] sm:p-9">
      <p className="text-[10px] font-bold tracking-[0.18em] text-[#d63673]">
        CREATE YOUR ACCOUNT
      </p>
      <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em]">
        Join Servnix today
      </h2>
      <p className="mt-2 text-sm leading-6 text-[#806370]">
        Choose how you will use Servnix and create your account.
      </p>
      <p className="mt-2 text-xs leading-5 text-[#806370]">Provider organizations are reviewed before their services appear to customers.</p>

      <form className="mt-7 grid gap-5" onSubmit={submit}>
        <fieldset className="grid gap-2"><legend className="mb-2 text-sm font-semibold text-[#523341]">I am joining as</legend><div className="grid gap-3 sm:grid-cols-3">{[['customer', 'Customer', 'Book trusted services'], ['service_provider', 'Provider', 'Manage your organization'], ['employee', 'Employee', 'Create your work profile']].map(([value, label, description]) => <label className={`cursor-pointer rounded-xl border p-4 transition ${form.role === value ? 'border-[#d93777] bg-[#fff1f6] ring-2 ring-[#f9d5e3]' : 'border-[#eadde3] bg-white hover:border-[#d93777]'}`} key={value}><input className="sr-only" type="radio" name="role" value={value} checked={form.role === value} onChange={update} /><span className="block text-sm font-bold text-[#301a28]">{label}</span><span className="mt-1 block text-xs text-[#806370]">{description}</span></label>)}</div></fieldset>
        {form.role === 'employee' && <label className="grid gap-2 text-sm font-semibold text-[#523341]">Approved organization<select className={inputClass} name="organizationId" value={form.organizationId} onChange={update} required disabled={organizationsLoading || !!organizationsError || !organizationData?.organizations?.length}><option value="">Select an organization</option>{organizationData?.organizations?.map((organization) => <option value={organization.id} key={organization.id}>{organization.businessName} — {organization.address}</option>)}</select><span className="text-xs font-normal text-[#8d7180]">Your employee account will be linked to this organization.</span>{organizationsLoading && <span className="text-xs font-normal text-[#8d7180]">Loading approved organizations...</span>}{organizationsError && <span className="text-xs font-normal text-rose-700">Could not load organizations. <button className="font-semibold underline" type="button" onClick={refetchOrganizations}>Retry</button></span>}{!organizationsLoading && !organizationsError && !organizationData?.organizations?.length && <span className="text-xs font-normal text-amber-800">No approved organizations are available yet.</span>}</label>}
        <label className="grid gap-2 text-sm font-semibold text-[#523341]">
          Full name
          <input className={inputClass} name="name" autoComplete="name" placeholder="Your full name" value={form.name} onChange={update} required />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-[#523341]">
          Email address
          <input className={inputClass} name="email" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={update} required />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-[#523341]">
          Password
          <input className={inputClass} name="password" type="password" autoComplete="new-password" minLength="8" placeholder="At least 8 characters" value={form.password} onChange={update} required />
          <span className="text-xs font-normal text-[#8d7180]">Use uppercase, lowercase, and a number.</span>
        </label>

        <button className="mt-1 rounded-xl bg-[#d93777] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#d93777]/25 transition hover:bg-[#bf2865] focus:outline-none focus:ring-4 focus:ring-[#f7c9da] disabled:cursor-not-allowed disabled:opacity-60" disabled={signupState.isLoading || loginState.isLoading || (form.role === 'employee' && (!form.organizationId || organizationsLoading || !!organizationsError))}>
          {signupState.isLoading || loginState.isLoading
            ? 'Creating account...'
            : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[#806370]">
        Already have an account?{' '}
        <button className="font-bold text-[#cc326e] hover:text-[#a72156]" type="button" onClick={onLogin}>
          Log in
        </button>
      </p>
    </section>
  )
}
