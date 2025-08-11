import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  // Don't show layout on auth pages
  if (location.pathname === '/auth') {
    return children
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}