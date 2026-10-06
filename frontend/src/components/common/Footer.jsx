export default function Footer() {
  return (
    <footer className="grid gap-6 bg-[#2e1725] px-[7vw] py-10 text-[#f9e9ef] md:grid-cols-3">
      <div className="flex items-center gap-2 text-xl font-bold"><span className="grid size-8 place-items-center rounded-xl bg-[#dd3f7d] font-display italic">S</span>servnix</div>
      <p className="m-0 text-sm text-[#c9aabb]">Making reliable home services feel simple.</p>
      <div className="flex flex-wrap gap-4 text-sm text-[#c9aabb] md:justify-end"><a href="#services">Explore services</a><a href="#providers">Become a provider</a><a href="#top">Privacy</a></div>
      <small className="text-xs text-[#c9aabb] md:col-start-3 md:text-right">© 2026 Servnix. All rights reserved.</small>
    </footer>
  )
}
