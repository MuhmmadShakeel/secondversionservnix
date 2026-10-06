import { useGetNotificationsQuery, useMarkReadMutation } from '../../redux/Api/notification/NotificationApi.js'

const formatter = new Intl.DateTimeFormat('en-PK', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Karachi' })

export default function NotificationsPanel() {
  const { data, isLoading, error } = useGetNotificationsQuery(undefined, { pollingInterval: 30000, refetchOnFocus: true })
  const [markRead] = useMarkReadMutation()
  const notifications = data?.notifications || []
  const unread = notifications.filter((item) => !item.readAt).length

  return <section className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 px-6 py-5"><div><h2 className="text-xl font-semibold">Updates</h2><p className="mt-1 text-sm text-slate-500">Booking decisions and changes appear here.</p></div><span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">{unread} unread</span></div>
    {isLoading ? <p className="px-6 py-8 text-sm text-slate-500">Loading updates...</p> : error ? <p className="px-6 py-8 text-sm text-rose-700">Could not load updates.</p> : notifications.length ? <div className="divide-y divide-stone-100">{notifications.slice(0, 6).map((item) => <div className={`flex flex-wrap items-center justify-between gap-3 px-6 py-4 ${item.readAt ? 'bg-white' : 'bg-rose-50/50'}`} key={item.id}><div><p className="text-sm font-medium text-slate-800">{item.message}</p><p className="mt-1 text-xs text-slate-500">{formatter.format(new Date(item.createdAt))} PKT</p></div>{!item.readAt && <button className="text-xs font-semibold text-rose-700 hover:underline" type="button" onClick={() => markRead(item.id)}>Mark read</button>}</div>)}</div> : <p className="px-6 py-8 text-sm text-slate-500">No updates yet.</p>}
  </section>
}
