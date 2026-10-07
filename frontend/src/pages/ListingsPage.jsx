import { useState } from 'react'
import toast from 'react-hot-toast'
import { PageHeader } from '../components/common/PageHeader.jsx'
import { EmptyState, SearchBox } from '../components/common/UiParts.jsx'
import { Icon } from '../components/common/Icon.jsx'
import { RequirementCard } from '../components/hiring/RequirementCard.jsx'
import { RequirementDetail } from '../components/hiring/RequirementDetail.jsx'
import { ProposalForm } from '../components/hiring/ProposalForm.jsx'
import { BookingForm } from '../components/services/BookingForm.jsx'
import { ProductShop } from '../components/products/ProductShop.jsx'
import { getStoredUser, useAuthToken } from '../redux/Api/auth/AuthApi.js'
import { useCreateBookingMutation, useGetActiveServicesQuery } from '../redux/Api/service/ServiceApi.js'
import { useGetMyProposalsQuery, useGetOpenRequirementsQuery, useSubmitProposalMutation } from '../redux/Api/hiring/HiringApi.js'
import { useBrowseProductsQuery } from '../redux/Api/product/ProductApi.js'

const money = new Intl.NumberFormat('en-PK', { maximumFractionDigits: 2 })
const matches = (item, search) => `${item.title} ${item.category} ${item.description}`.toLowerCase().includes(search.trim().toLowerCase())

function BrowseServiceCard({ service, onBook, isOwner }) {
  return <article className="service-card my-service-card">
    <div className="card-top"><span className="service-symbol purple"><Icon name="briefcase" size={22}/></span><span className="status-pill active">Active</span></div>
    <span className="card-kicker">{service.category}</span>
    <h3>{service.title}</h3>
    <p>{service.description}</p>
    <div className="my-service-meta"><span>By {service.ownerName}</span><span>{service.experienceYears} {service.experienceYears === 1 ? 'year' : 'years'} experience</span></div>
    <div className="service-card-footer"><strong>Rs. {money.format(Number(service.price))}</strong>{isOwner ? <span className="card-meta">Your service</span> : <button className="primary-button" type="button" onClick={() => onBook(service)}>Book service</button>}</div>
  </article>
}

export function ListingsPage({ onNavigate }) {
  const token = useAuthToken()
  const currentUser = getStoredUser()
  const [type, setType] = useState('All')
  const [search, setSearch] = useState('')
  const [detailId, setDetailId] = useState(null)
  const [proposalRequirement, setProposalRequirement] = useState(null)
  const [bookingService, setBookingService] = useState(null)
  const servicesQuery = useGetActiveServicesQuery(undefined, { skip: !token })
  const jobsQuery = useGetOpenRequirementsQuery(undefined, { skip: !token })
  const proposalsQuery = useGetMyProposalsQuery(undefined, { skip: !token })
  const productsQuery = useBrowseProductsQuery(undefined, { skip: !token, pollingInterval: 30000 })
  const [submitProposal, { isLoading: submitting }] = useSubmitProposalMutation()
  const [createBooking, { isLoading: booking }] = useCreateBookingMutation()

  const showServices = type === 'All' || type === 'Services'
  const showJobs = type === 'All' || type === 'Jobs'
  const services = (servicesQuery.data?.services || []).filter((item) => matches(item, search))
  const jobs = (jobsQuery.data?.requirements || []).filter((item) => matches(item, search))
  const loading = (showServices && servicesQuery.isLoading) || (showJobs && jobsQuery.isLoading) || (type === 'All' && productsQuery.isLoading)
  const failed = (showServices && servicesQuery.isError) || (showJobs && jobsQuery.isError)
  const hasResults = (showServices && services.length > 0) || (showJobs && jobs.length > 0) || (type === 'All' && (productsQuery.data?.products || []).some((item) => matches(item, search)))

  async function saveProposal(details) {
    await submitProposal({ requirementId: proposalRequirement.id, ...details }).unwrap()
    toast.success('Proposal sent to the client.')
    setProposalRequirement(null)
  }

  async function saveBooking(details) {
    await createBooking({ serviceId: bookingService.id, ...details }).unwrap()
    toast.success('Booking request sent. Track it under My Services > My bookings.')
    setBookingService(null)
  }

  return <>
    <PageHeader eyebrow="DISCOVER MORE" title="Explore listings" description="Find services, open jobs, and products from the marketplace."/>
    {!token ? <EmptyState label="Log in to explore listings" detail="Use Log in in the top bar to browse and shop."/> : <>
      <div className="toolbar"><SearchBox value={search} onChange={setSearch} placeholder="Search services, jobs and products..."/><div className="segmented-control">{['All', 'Services', 'Jobs', 'Products'].map((item) => <button key={item} type="button" className={type === item ? 'selected' : ''} onClick={() => setType(item)}>{item}</button>)}</div></div>
      {type === 'Products' ? <ProductShop search={search} full/> : loading ? <div className="service-loading" role="status">Loading listings...</div> : failed ? <div className="service-loading" role="alert">Could not load listings. <button type="button" onClick={() => { if (showServices && servicesQuery.isError) servicesQuery.refetch(); if (showJobs && jobsQuery.isError) jobsQuery.refetch() }}>Try again</button></div> : <>
        {!hasResults && type !== 'All' && <EmptyState label="No matching listings" detail="Try another search or check back later."/>}
        {showServices && services.length > 0 && <section className="content-section listing-section"><h2>Services <span>{services.length}</span></h2><div className="service-grid">{services.map((service) => <BrowseServiceCard key={service.id} service={service} isOwner={service.ownerUserId === currentUser?.id} onBook={setBookingService}/>)}</div></section>}
        {showJobs && jobs.length > 0 && <section className="content-section listing-section"><h2>Jobs & requirements <span>{jobs.length}</span></h2><div className="job-grid">{jobs.map((job) => <RequirementCard key={job.id} item={job} mode="discover" onView={() => setDetailId(job.id)}/>)}</div></section>}
        {type === 'All' && <ProductShop search={search}/>}
      </>}
    </>}
    {detailId && <RequirementDetail id={detailId} currentUserId={currentUser?.id} myProposal={proposalsQuery.data?.proposals?.find((proposal) => proposal.requirementId === detailId)} onClose={() => setDetailId(null)} onPropose={(requirement) => { setDetailId(null); setProposalRequirement(requirement) }} onEdit={() => { setDetailId(null); onNavigate('hiring') }}/>}
    {proposalRequirement && <ProposalForm requirement={proposalRequirement} onClose={() => setProposalRequirement(null)} onSave={saveProposal} isSaving={submitting}/>}
    {bookingService && <BookingForm service={bookingService} onClose={() => setBookingService(null)} onSave={saveBooking} isSaving={booking}/>}
  </>
}
