import { useAuthStore } from '../../stores/authStore'
import Button from '../ui/Button'

export default function Header({ onMenuClick }) {
  const { profile, signOut } = useAuthStore()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <header className="bg-white shadow border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <h1 className="ml-4 md:ml-0 text-xl font-semibold text-gray-900">
            Property Management
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden md:block text-sm text-gray-700">
            <span className="font-medium">{profile?.full_name}</span>
            <span className="text-gray-500 ml-2">({profile?.organizations?.name})</span>
          </div>
          
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  )
}