import { useState } from 'react'
import { useGetPublicOrganizationsQuery } from '../../redux/Api/service-provider/OrganizationApi.js'
import { useGetOrganizationReviewsQuery } from '../../redux/Api/review/ReviewApi.js'

const priceLabel = (price) => price == null ? 'Price on request' : `Rs. ${Number(price).toLocaleString()}`

function OrganizationCard({ organization, onServices }) {
  const [showReviews, setShowReviews] = useState(false)
  const { data, isFetching } = useGetOrganizationReviewsQuery(organization.id, { skip: !showReviews })
  const reviews = data?.reviews || []

  return <article className="overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg hover:shadow-rose-100/60">
    <div className="border-b border-stone-100 px-6 py-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-xl font-semibold text-slate-900">{organization.businessName}</h3><p className="mt-1 text-sm text-slate-500">{organization.address}</p></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">Approved</span></div>{organization.description && <p className="mt-4 text-sm leading-6 text-slate-600">{organization.description}</p>}{organization.reviewCount > 0 && <p className="mt-3 text-sm font-semibold text-amber-700">★ {organization.averageRating} / 5 <span className="font-normal text-slate-500">({organization.reviewCount} reviews)</span></p>}</div>
    <div className="px-6 py-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-600">Services</p><ul className="mt-3 divide-y divide-stone-100">{organization.services.map((service) => <li className="flex items-center justify-between gap-3 py-3" key={service.id}><div><p className="text-sm font-semibold text-slate-800">{service.name}</p><p className="mt-1 text-xs text-slate-500">{service.durationMinutes} min</p></div><span className="text-sm font-medium text-slate-700">{priceLabel(service.price)}</span></li>)}</ul>
      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-stone-100 pt-4 text-sm"><button className="rounded-lg bg-rose-600 px-4 py-2 font-semibold text-white hover:bg-rose-700" type="button" onClick={onServices}>View and book</button>{organization.reviewCount > 0 && <button className="font-semibold text-rose-700 hover:underline" type="button" onClick={() => setShowReviews((value) => !value)}>{showReviews ? 'Hide reviews' : 'Read reviews'}</button>}<a className="font-semibold text-slate-700 underline underline-offset-4 hover:text-rose-700" href={`mailto:${organization.email}`}>Email business</a></div>
      {showReviews && <div className="mt-5 space-y-3 border-t border-stone-100 pt-5">{isFetching ? <p className="text-sm text-slate-500">Loading reviews...</p> : reviews.map((review) => <div className="rounded-lg bg-rose-50/50 p-3" key={review.id}><p className="text-sm font-semibold text-amber-700">{'★'.repeat(review.rating)} <span className="font-normal text-slate-500">by {review.customerName}</span></p>{review.comment && <p className="mt-1 text-sm text-slate-700">{review.comment}</p>}</div>)}</div>}
    </div>
  </article>
}

export default function OrganizationDirectory({ onServices }) {
  const { data, isLoading, error, refetch } = useGetPublicOrganizationsQuery(undefined, { pollingInterval: 30000 })
  const organizations = data?.organizations || []

  return <section className="bg-[#fbf8f9] px-[7vw] py-20" id="available-services"><div className="mx-auto max-w-7xl">
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-600">Explore local services</p><h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Trusted providers, ready to help.</h2><p className="mt-2 text-sm text-slate-600">Browse approved organizations, services, and real customer feedback.</p></div><button className="rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50" type="button" onClick={refetch}>Refresh listings</button></div>
    {isLoading && <div className="rounded-xl border border-stone-200 bg-white p-8 text-sm text-slate-500">Loading services...</div>}
    {error && <div className="rounded-xl border border-rose-200 bg-white p-8 text-sm text-rose-700">Could not load services. Please try again.</div>}
    {!isLoading && !error && (organizations.length ? <div className="grid gap-5 md:grid-cols-2">{organizations.map((organization) => <OrganizationCard organization={organization} onServices={onServices} key={organization.id} />)}</div> : <div className="rounded-xl border border-dashed border-stone-300 bg-white px-6 py-14 text-center"><h3 className="text-lg font-semibold text-slate-900">More services are coming soon</h3><p className="mt-2 text-sm text-slate-500">Approved providers will appear here as they join Servnix.</p></div>)}
  </div></section>
}
