import { useState } from 'react'
import LoginForm from '../components/auth/LoginForm'
import SignupForm from '../components/auth/SignupForm'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
        {isLogin ? (
          <LoginForm onSwitchToSignup={() => setIsLogin(false)} />
        ) : (
          <SignupForm onSwitchToLogin={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  )
}