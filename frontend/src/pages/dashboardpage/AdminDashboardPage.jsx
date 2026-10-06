import AdminOverview from '../../components/dashboard/admin/AdminOverview'
import AdminBookings from '../../components/dashboard/admin/AdminBookings.jsx'
import AdminProfile from '../../components/dashboard/admin/AdminProfile.jsx'

export default function AdminDashboardPage({ currentUserId, section, onSectionChange, user, onUserUpdate }) {
  return section === 'profile' ? <AdminProfile user={user} onUserUpdate={onUserUpdate} /> : section === 'bookings' ? <AdminBookings /> : <AdminOverview currentUserId={currentUserId} section={section} onSectionChange={onSectionChange} />
}
