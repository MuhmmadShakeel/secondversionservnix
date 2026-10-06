
const services = [
  { icon: '⌁', name: 'Home cleaning', detail: 'Fresh spaces, on your schedule' },
  { icon: '⚡', name: 'Electrician', detail: 'Trusted help for every fix' },
  { icon: '❄', name: 'AC & appliance', detail: 'Care that keeps life running' },
  { icon: '⌂', name: 'Plumbing', detail: 'Quick support when it matters' },
]

const steps = [
  ['01', 'Tell us what you need', 'Search by service, location and a time that suits you.'],
  ['02', 'Choose your trusted pro', 'Compare clear details, reviews and availability.'],
  ['03', 'Book with confidence', 'Choose an available time, request an appointment and track its status.'],
]

const primaryButton = 'rounded-full bg-[#d93777] px-6 py-3.5 font-bold text-white transition hover:bg-[#c52d69]'
const eyebrow = 'mb-4 flex items-center gap-2 text-[11px] font-bold tracking-[.16em] text-[#cd3972] before:h-0.5 before:w-5 before:bg-current'
const title = 'text-4xl font-semibold leading-tight tracking-[-.05em] sm:text-5xl'

function ServiceCard({ service, delay, onSignup }) {
  return <article className="rounded-2xl border border-[#f1dde5] bg-white p-6 transition hover:-translate-y-1 hover:border-[#e395b3]" data-aos="fade-up" data-aos-delay={delay}>
    <span className="grid size-11 place-items-center rounded-xl bg-[#fff4f7] text-2xl text-[#d83877]">{service.icon}</span>
    <h3 className="mt-5 font-bold">{service.name}</h3><p className="mt-2 min-h-10 text-xs leading-5 text-[#876d79]">{service.detail}</p>
    <button className="mt-4 text-lg text-[#d83877]" type="button" onClick={onSignup}>→</button>
  </article>
}

export default function Hero({ onSignup, onProviderSignup = onSignup }) {
  return <>
    <section className="grid min-h-[610px] items-center gap-12 bg-white px-[7vw] py-16 lg:grid-cols-[1fr_.9fr]" id="top">
      <div data-aos="fade-up"><p className={eyebrow}>HOME SERVICES, WITHOUT THE HASSLE</p><h1 className="text-5xl font-semibold leading-none tracking-[-.06em] sm:text-6xl">Your home,<br /><em className="font-display text-[#dd3f7d]">in good hands.</em></h1><p className="my-6 max-w-lg text-[17px] leading-7 text-[#755968]">Find dependable local professionals, book in minutes, and keep every home task moving beautifully.</p><div className="flex items-center gap-6"><button className={primaryButton} type="button" onClick={onSignup}>Find a service →</button><a className="text-sm font-semibold" href="#how-it-works">◯ See how it works</a></div><p className="mt-9 text-xs text-[#7d6571]">Browse approved local providers and compare services with confidence.</p></div>
      <div className="relative min-h-[390px] overflow-hidden rounded-[48px] border border-[#f2d7e2] bg-white" data-aos="fade-left"><div className="absolute -right-10 -top-10 size-56 rounded-full bg-[#fff1f6]" /><div className="absolute bottom-7 left-7 rounded-2xl bg-[#7e234b] p-5 text-white"><span className="text-xl">⌂</span><p className="mb-1 mt-4 text-xs text-[#f7bfd3]">Everything your home needs</p><strong className="text-lg">One trusted place</strong></div><div className="absolute right-6 top-9 w-[270px] rounded-2xl border border-[#f1dbe4] bg-white p-5"><div className="flex justify-between text-xs text-[#815d6d]"><span>Booking preview</span><span className="size-2 rounded-full bg-emerald-400" /></div><div className="my-4 flex items-center gap-2"><span className="grid size-9 place-items-center rounded-xl bg-[#f4c4d5] text-xs font-bold text-[#b52761]">AK</span><div><strong className="block text-xs">Local professional</strong><small className="text-[11px] text-[#927986]">Service provider</small></div></div><div className="grid gap-1 rounded-xl bg-[#fff5f8] p-3"><span className="text-[10px] text-[#9d7687]">Example time</span><strong className="text-xs">Electrical repair</strong><i className="text-[10px] not-italic text-emerald-600">Confirmed</i></div></div></div>
    </section>
    <section className="bg-white px-[7vw] py-20" id="services"><div className="mb-9 flex items-end justify-between"><div data-aos="fade-up"><p className={eyebrow}>EXPLORE SERVICES</p><h2 className={title}>Support for every<br /><em className="font-display text-[#dd3f7d]">corner of home.</em></h2></div><a className="text-sm font-bold text-[#cc3470]" href="#top">View all services →</a></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{services.map((service, index) => <ServiceCard key={service.name} service={service} delay={index * 75} onSignup={onSignup} />)}</div></section>
    <section className="grid gap-16 bg-white px-[7vw] py-20 lg:grid-cols-[.85fr_1fr]" id="how-it-works"><div data-aos="fade-right"><p className={eyebrow}>SIMPLE BY DESIGN</p><h2 className={title}>From search to<br /><em className="font-display text-[#dd3f7d]">sorted.</em></h2><p className="mt-5 max-w-sm text-sm leading-6 text-[#826571]">Servnix makes finding and booking a trusted home service feel refreshingly easy.</p></div><div className="border-t border-[#eacbd6]">{steps.map(([number, heading, copy]) => <div className="flex gap-7 border-b border-[#eacbd6] py-6" data-aos="fade-up" key={number}><span className="text-xs font-bold text-[#dc3d79]">{number}</span><div><h3 className="font-bold">{heading}</h3><p className="mt-1 text-sm text-[#806674]">{copy}</p></div></div>)}</div></section>
    <section className="mx-[7vw] my-16 grid gap-12 rounded-3xl bg-[#82264e] px-[7vw] py-14 text-white lg:grid-cols-[1.1fr_.75fr]" id="providers" data-aos="zoom-in"><div><p className="mb-4 text-[11px] font-bold tracking-[.16em] text-[#f8aac6]">FOR SERVICE PROVIDERS</p><h2 className={title}>Grow your service<br />business with ease.</h2><p className="mt-5 max-w-lg text-sm leading-6 text-[#f5cbd9]">Create an account, then ask an administrator to activate provider access. Once approved, manage your organization, services, and appointment requests in one place.</p><button className="mt-6 rounded-full bg-white px-6 py-3.5 font-bold text-[#b92d64]" type="button" onClick={onProviderSignup}>Create an account</button></div><div className="rounded-2xl bg-white p-7 text-[#4d2637]"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#bf4173]">Your provider workspace</p><h3 className="mt-4 text-2xl font-semibold">Everything in one place.</h3><ul className="mt-6 space-y-4 text-sm"><li className="rounded-xl bg-[#fff5f8] p-3">Manage your organization and services</li><li className="rounded-xl bg-[#fff5f8] p-3">Review appointment requests</li><li className="rounded-xl bg-[#fff5f8] p-3">Keep customers informed</li></ul></div></section>
  </>
}
