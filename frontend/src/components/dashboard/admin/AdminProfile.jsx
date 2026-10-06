import AccountProfile from '../../common/AccountProfile.jsx'

export default function AdminProfile({ user, onUserUpdate }) {
  return <AccountProfile user={user} onUserUpdate={onUserUpdate} />
}
