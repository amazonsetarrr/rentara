import { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { authService } from '../services/auth'
import { supabase } from '../services/supabase'
import Card, { CardHeader, CardContent } from '../components/ui/Card'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore()
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    organization: null
  })
  const [isLoading, setIsLoading] = useState({
    profile: false,
    email: false,
    password: false
  })
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState({})
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    full_name: ''
  })
  
  // Email form state
  const [emailForm, setEmailForm] = useState({
    new_email: '',
    password: ''
  })
  
  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })

  useEffect(() => {
    loadUserProfile()
  }, [user])

  const loadUserProfile = async () => {
    if (!user) return
    
    setIsLoading(prev => ({ ...prev, profile: true }))
    try {
      const { data, error } = await authService.getUserProfile(user.id)
      if (error) throw error
      
      setProfile({
        full_name: data.full_name || '',
        email: data.email || user.email || '',
        organization: data.organizations
      })
      setProfileForm({
        full_name: data.full_name || ''
      })
    } catch (error) {
      console.error('Error loading profile:', error)
      setErrors({ profile: 'Failed to load profile data' })
    } finally {
      setIsLoading(prev => ({ ...prev, profile: false }))
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setIsLoading(prev => ({ ...prev, profile: true }))
    setErrors({})
    setSuccess({})
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ full_name: profileForm.full_name })
        .eq('id', user.id)
      
      if (error) throw error
      
      setProfile(prev => ({ ...prev, full_name: profileForm.full_name }))
      setSuccess({ profile: 'Profile updated successfully' })
    } catch (error) {
      console.error('Error updating profile:', error)
      setErrors({ profile: 'Failed to update profile. Please try again.' })
    } finally {
      setIsLoading(prev => ({ ...prev, profile: false }))
    }
  }

  const handleUpdateEmail = async (e) => {
    e.preventDefault()
    setIsLoading(prev => ({ ...prev, email: true }))
    setErrors({})
    setSuccess({})
    
    try {
      // Verify current password first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: emailForm.password
      })
      
      if (signInError) {
        setErrors({ email: 'Current password is incorrect' })
        return
      }
      
      // Update email
      const { error } = await supabase.auth.updateUser({
        email: emailForm.new_email
      })
      
      if (error) throw error
      
      setSuccess({ 
        email: 'Email update initiated. Please check your new email for confirmation.' 
      })
      setEmailForm({ new_email: '', password: '' })
    } catch (error) {
      console.error('Error updating email:', error)
      setErrors({ email: 'Failed to update email. Please try again.' })
    } finally {
      setIsLoading(prev => ({ ...prev, email: false }))
    }
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    setIsLoading(prev => ({ ...prev, password: true }))
    setErrors({})
    setSuccess({})
    
    // Validate passwords
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setErrors({ password: 'New passwords do not match' })
      setIsLoading(prev => ({ ...prev, password: false }))
      return
    }
    
    if (passwordForm.new_password.length < 8) {
      setErrors({ password: 'Password must be at least 8 characters long' })
      setIsLoading(prev => ({ ...prev, password: false }))
      return
    }
    
    try {
      // Verify current password first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordForm.current_password
      })
      
      if (signInError) {
        setErrors({ password: 'Current password is incorrect' })
        return
      }
      
      // Update password
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.new_password
      })
      
      if (error) throw error
      
      setSuccess({ password: 'Password updated successfully' })
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      })
    } catch (error) {
      console.error('Error updating password:', error)
      setErrors({ password: 'Failed to update password. Please try again.' })
    } finally {
      setIsLoading(prev => ({ ...prev, password: false }))
    }
  }

  if (isLoading.profile && !profile.email) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-6">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your account and profile settings</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Account Overview */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Account Overview</h2>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <p className="text-gray-900">{profile.full_name || 'Not set'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <p className="text-gray-900">{profile.email}</p>
              </div>
              {profile.organization && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization
                  </label>
                  <p className="text-gray-900">{profile.organization.name}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Update Personal Details */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Personal Details</h2>
            <p className="text-sm text-gray-600 mt-1">Update your personal information</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <Input
                label="Full Name"
                value={profileForm.full_name}
                onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Enter your full name"
                required
              />
              
              {errors.profile && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                  {errors.profile}
                </div>
              )}
              
              {success.profile && (
                <div className="text-green-600 text-sm bg-green-50 p-3 rounded-md">
                  {success.profile}
                </div>
              )}
              
              <div className="flex justify-end">
                <Button
                  type="submit"
                  loading={isLoading.profile}
                  disabled={!profileForm.full_name || profileForm.full_name === profile.full_name}
                >
                  Update Profile
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Update Email */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Email Address</h2>
            <p className="text-sm text-gray-600 mt-1">Change your email address</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateEmail} className="space-y-4">
              <Input
                label="New Email Address"
                type="email"
                value={emailForm.new_email}
                onChange={(e) => setEmailForm(prev => ({ ...prev, new_email: e.target.value }))}
                placeholder="Enter new email address"
                required
              />
              
              <Input
                label="Current Password"
                type="password"
                value={emailForm.password}
                onChange={(e) => setEmailForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter your current password"
                required
              />
              
              {errors.email && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                  {errors.email}
                </div>
              )}
              
              {success.email && (
                <div className="text-green-600 text-sm bg-green-50 p-3 rounded-md">
                  {success.email}
                </div>
              )}
              
              <div className="flex justify-end">
                <Button
                  type="submit"
                  loading={isLoading.email}
                  disabled={!emailForm.new_email || !emailForm.password}
                >
                  Update Email
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
            <p className="text-sm text-gray-600 mt-1">Update your account password</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
                placeholder="Enter your current password"
                required
              />
              
              <Input
                label="New Password"
                type="password"
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
                placeholder="Enter new password (min 8 characters)"
                required
                minLength={8}
              />
              
              <Input
                label="Confirm New Password"
                type="password"
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm_password: e.target.value }))}
                placeholder="Confirm new password"
                required
              />
              
              {errors.password && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                  {errors.password}
                </div>
              )}
              
              {success.password && (
                <div className="text-green-600 text-sm bg-green-50 p-3 rounded-md">
                  {success.password}
                </div>
              )}
              
              <div className="flex justify-end">
                <Button
                  type="submit"
                  loading={isLoading.password}
                  disabled={!passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password}
                >
                  Change Password
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}