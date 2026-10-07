import { useEffect, useState } from 'react'
import AOS from 'aos'
import 'aos/dist/aos.css'
import { Sidebar } from './components/common/Sidebar.jsx'
import { Navbar } from './components/common/Navbar.jsx'
import { DashboardPage } from './pages/DashboardPage.jsx'
import { ServicesPage } from './pages/ServicesPage.jsx'
import { HiringPage } from './pages/HiringPage.jsx'
import { ListingsPage } from './pages/ListingsPage.jsx'
import { MartPage } from './pages/MartPage.jsx'
import { TradePage } from './pages/TradePage.jsx'

const pages = { overview: DashboardPage, services: ServicesPage, hiring: HiringPage, listings: ListingsPage, mart: MartPage, trade: TradePage }

export default function App() {
  const [activePage, setActivePage] = useState('overview')
  const Page = pages[activePage]

  useEffect(() => {
    AOS.init({ duration: 550, easing: 'ease-out-cubic', once: true, offset: 32, disable: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches })
  }, [])

  useEffect(() => {
    const frame = requestAnimationFrame(() => AOS.refreshHard())
    return () => cancelAnimationFrame(frame)
  }, [activePage])

  function navigate(page) {
    setActivePage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return <div className="app-layout"><Sidebar activePage={activePage} onNavigate={navigate} /><div className="app-main"><Navbar /><main className="page-content"><Page onNavigate={navigate} /></main></div></div>
}
