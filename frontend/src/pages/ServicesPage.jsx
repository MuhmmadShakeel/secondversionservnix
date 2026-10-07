import { useState } from 'react'
import toast from 'react-hot-toast'
import { PageHeader } from '../components/common/PageHeader.jsx'
import { MyServiceCard } from '../components/services/MyServiceCard.jsx'
import { ServiceForm } from '../components/services/ServiceForm.jsx'
import { BookingCard } from '../components/services/BookingCard.jsx'
import { EmptyState, PrimaryButton, SearchBox, SurfaceModal } from '../components/common/UiParts.jsx'
import { useAuthToken } from '../redux/Api/auth/AuthApi.js'
import { useCancelBookingMutation, useCreateServiceMutation, useDecideBookingMutation, useDeleteServiceMutation, useGetMyBookingsQuery, useGetMyServicesQuery, useGetReceivedBookingsQuery, useUpdateServiceMutation } from '../redux/Api/service/ServiceApi.js'

export function ServicesPage() {
  const token = useAuthToken()
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('services')
  const [filter, setFilter] = useState('All services')
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [bookingAction, setBookingAction] = useState(null)
  const { data, isLoading, isError, refetch } = useGetMyServicesQuery(token, { skip: !token })
  const receivedQuery = useGetReceivedBookingsQuery(undefined, { skip: !token, pollingInterval: 30000 })
  const mineQuery = useGetMyBookingsQuery(undefined, { skip: !token, pollingInterval: 30000 })
  const [createService, { isLoading: creating }] = useCreateServiceMutation()
  const [updateService, { isLoading: updating }] = useUpdateServiceMutation()
  const [deleteService, { isLoading: removing }] = useDeleteServiceMutation()
  const [decideBooking, { isLoading: deciding }] = useDecideBookingMutation()
  const [cancelBooking, { isLoading: cancelling }] = useCancelBookingMutation()
  const services = data?.services || []
  const visible = services.filter((service) =>
    (filter === 'All services' || service.status === filter.toLowerCase()) &&
    `${service.title} ${service.category} ${service.description}`.toLowerCase().includes(search.toLowerCase()),
  )
  const bookingsQuery = tab === 'received' ? receivedQuery : mineQuery
  const bookings = (bookingsQuery.data?.bookings || []).filter((booking) =>
    `${booking.serviceTitle} ${booking.buyerName} ${booking.ownerName} ${booking.requestDetails}`.toLowerCase().includes(search.toLowerCase()),
  )

  function openCreate() { setEditing(null); setShowForm(true) }
  function openEdit(service) { setEditing(service); setShowForm(true) }

  async function save(details) {
    if (editing) await updateService({ id: editing.id, ...details }).unwrap()
    else await createService(details).unwrap()
    toast.success(editing ? 'Service updated.' : 'Service created.')
    setShowForm(false)
    setEditing(null)
  }

  async function confirmDelete() {
    try {
      await deleteService(deleting.id).unwrap()
      toast.success('Service deleted.')
      setDeleting(null)
    } catch (error) { toast.error(error?.data?.message || 'Could not delete this service. Please try again.') }
  }

  async function confirmBookingAction() {
    try {
      if (bookingAction.status === 'cancelled') await cancelBooking(bookingAction.booking.id).unwrap()
      else await decideBooking({ id: bookingAction.booking.id, status: bookingAction.status }).unwrap()
      toast.success(bookingAction.status === 'approved' ? 'Booking approved.' : bookingAction.status === 'rejected' ? 'Booking rejected.' : 'Booking request cancelled.')
      setBookingAction(null)
    } catch (error) { toast.error(error?.data?.message || 'Could not update this booking.') }
  }

  return <>
    <PageHeader eyebrow="YOUR WORK" title="My services" description="Manage your services and booking requests in one place." action={token && tab === 'services' && <PrimaryButton onClick={openCreate}>Add a service</PrimaryButton>} />
    {!token ? <EmptyState label="Log in to manage services" detail="Use Log in in the top bar to see, add, edit and delete your services." /> : <>
      <div className="service-tabs" role="tablist" aria-label="Services views">{[
        { id: 'services', label: 'My services', count: services.length },
        { id: 'received', label: 'Booking requests', count: receivedQuery.data?.bookings?.length || 0 },
        { id: 'mine', label: 'My bookings', count: mineQuery.data?.bookings?.length || 0 },
      ].map((item) => <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} className={tab === item.id ? 'active' : ''} onClick={() => { setTab(item.id); setSearch('') }}>{item.label}<span>{item.count}</span></button>)}</div>
      {tab === 'services' ? <>
      <div className="toolbar"><SearchBox value={search} onChange={setSearch} placeholder="Search your services..."/><div className="segmented-control">{['All services', 'Active', 'Draft'].map((item) => <button key={item} className={filter === item ? 'selected' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div></div>
      {isLoading ? <div className="service-loading" role="status">Loading your services…</div> : isError ? <div className="service-loading" role="alert">Could not load your services. <button type="button" onClick={refetch}>Try again</button></div> : visible.length ? <div className="service-grid">{visible.map((service) => <MyServiceCard key={service.id} service={service} onEdit={openEdit} onDelete={setDeleting} />)}</div> : <EmptyState label={services.length ? 'No matching services' : 'Your services will appear here'} detail={services.length ? 'Try another search or status filter.' : 'Add your first service to get started.'} />}
      </> : <>
        <div className="toolbar"><SearchBox value={search} onChange={setSearch} placeholder="Search bookings..."/><span className="results-count">{bookings.length} bookings</span></div>
        {bookingsQuery.isLoading ? <div className="service-loading" role="status">Loading bookings...</div> : bookingsQuery.isError ? <div className="service-loading" role="alert">Could not load bookings. <button type="button" onClick={bookingsQuery.refetch}>Try again</button></div> : bookings.length ? <div className="booking-grid">{bookings.map((booking) => <BookingCard key={booking.id} booking={booking} mode={tab} busy={deciding || cancelling} onDecision={(item, status) => setBookingAction({ booking: item, status })} onCancel={(item) => setBookingAction({ booking: item, status: 'cancelled' })}/>)}</div> : <EmptyState label={tab === 'received' ? 'No booking requests yet' : 'No bookings yet'} detail={tab === 'received' ? 'Requests for your services will appear here.' : 'Book a service from Explore Listings to get started.'}/>}
      </>}
    </>}
    {showForm && <ServiceForm key={editing?.id || 'new'} service={editing} onClose={() => setShowForm(false)} onSave={save} isSaving={creating || updating} />}
    {deleting && <SurfaceModal title="Delete service?" onClose={() => setDeleting(null)}><p className="delete-copy">This will permanently remove <strong>{deleting.title}</strong> from your services.</p><div className="service-form-actions"><button className="secondary-button" type="button" onClick={() => setDeleting(null)}>Keep service</button><button className="delete-button" type="button" disabled={removing} onClick={confirmDelete}>{removing ? 'Deleting…' : 'Delete service'}</button></div></SurfaceModal>}
    {bookingAction && <SurfaceModal title={bookingAction.status === 'approved' ? 'Approve booking?' : bookingAction.status === 'rejected' ? 'Reject booking?' : 'Cancel request?'} onClose={() => setBookingAction(null)}><p className="delete-copy">{bookingAction.status === 'approved' ? 'Confirm the booking request for' : bookingAction.status === 'rejected' ? 'Decline the booking request for' : 'Cancel your pending request for'} <strong>{bookingAction.booking.serviceTitle}</strong>?</p><div className="service-form-actions"><button className="secondary-button" type="button" onClick={() => setBookingAction(null)}>Go back</button><button className={bookingAction.status === 'approved' ? 'primary-button' : 'delete-button'} type="button" disabled={deciding || cancelling} onClick={confirmBookingAction}>{deciding || cancelling ? 'Working...' : bookingAction.status === 'approved' ? 'Approve' : bookingAction.status === 'rejected' ? 'Reject' : 'Cancel request'}</button></div></SurfaceModal>}
  </>
}
