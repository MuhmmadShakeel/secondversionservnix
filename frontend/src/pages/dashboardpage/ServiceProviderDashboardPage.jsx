import OrganizationSetupForm from '../../components/dashboard/service-provider/OrganizationSetupForm'
import ProviderAppointments from '../../components/dashboard/service-provider/ProviderAppointments'
import NotificationsPanel from '../../components/common/NotificationsPanel'
import ProviderEmployees from '../../components/dashboard/service-provider/ProviderEmployees.jsx'
import AssignDuty from '../../components/dashboard/service-provider/AssignDuty.jsx'
import ProviderProfile from '../../components/dashboard/service-provider/ProviderProfile.jsx'

export default function ServiceProviderDashboardPage({ section, user, onUserUpdate }) {
  if (section === 'profile') return <ProviderProfile user={user} onUserUpdate={onUserUpdate} />
  if (section === 'bookings') return <><ProviderAppointments /><NotificationsPanel /></>
  if (section === 'employees') return <ProviderEmployees />
  if (section === 'duties') return <AssignDuty />
  return <OrganizationSetupForm />
}
