import { supabase } from './supabase'

// Separate System Owner Authentication (doesn't use Supabase Auth)
export const systemOwnerAuthService = {
  // Sign in system owner (using custom authentication)
  async signIn(email, password) {
    try {
      console.log('System owner sign in attempt for:', email)
      
      // Call our custom authentication function
      const { data, error } = await supabase.rpc('system_auth.create_session', {
        owner_email: email,
        password: password
      })

      if (error) {
        console.error('System owner auth error:', error)
        return { data: null, error }
      }

      const result = typeof data === 'string' ? JSON.parse(data) : data

      if (!result.success) {
        console.error('Authentication failed:', result.error)
        return { data: null, error: { message: result.error } }
      }

      // Store session token in localStorage
      localStorage.setItem('system_owner_token', result.token)
      localStorage.setItem('system_owner_data', JSON.stringify(result.owner))

      console.log('System owner authentication successful')
      return { 
        data: { 
          token: result.token, 
          owner: result.owner,
          expires_at: result.expires_at
        }, 
        error: null 
      }
    } catch (error) {
      console.error('System owner sign in error:', error)
      return { data: null, error }
    }
  },

  // Verify current session
  async verifySession() {
    try {
      const token = localStorage.getItem('system_owner_token')
      
      if (!token) {
        return { data: null, error: { message: 'No session token' } }
      }

      const { data, error } = await supabase.rpc('system_auth.verify_session', {
        session_token: token
      })

      if (error) {
        console.error('Session verification error:', error)
        this.signOut()
        return { data: null, error }
      }

      const result = typeof data === 'string' ? JSON.parse(data) : data

      if (!result.success) {
        console.error('Session verification failed:', result.error)
        this.signOut()
        return { data: null, error: { message: result.error } }
      }

      return { data: result.owner, error: null }
    } catch (error) {
      console.error('Session verification error:', error)
      this.signOut()
      return { data: null, error }
    }
  },

  // Sign out
  signOut() {
    localStorage.removeItem('system_owner_token')
    localStorage.removeItem('system_owner_data')
    // Clear any session context
    return { error: null }
  },

  // Get stored owner data
  getStoredOwnerData() {
    const data = localStorage.getItem('system_owner_data')
    return data ? JSON.parse(data) : null
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem('system_owner_token')
  },

  // Create new system owner (admin function)
  async createSystemOwner(email, password, fullName, permissions = {}) {
    try {
      const { data, error } = await supabase
        .from('system_auth.system_owners')
        .insert([{
          email,
          encrypted_password: await this.hashPassword(password),
          full_name: fullName,
          permissions: {
            manage_organizations: true,
            view_analytics: true,
            manage_billing: true,
            ...permissions
          }
        }])
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Hash password (client-side - in production, do this server-side)
  async hashPassword(password) {
    // Simple client-side hashing - in production, use proper server-side hashing
    const encoder = new TextEncoder()
    const data = encoder.encode(password + 'salt')
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  },

  // Execute authenticated queries (sets session context)
  async executeWithAuth(callback) {
    try {
      const { data: owner, error } = await this.verifySession()
      
      if (error || !owner) {
        throw new Error('Authentication required')
      }

      // Set session context for this connection
      await supabase.rpc('set_config', {
        setting_name: 'app.current_system_owner_email',
        new_value: owner.email,
        is_local: true
      })

      // Execute the callback
      const result = await callback()

      return result
    } catch (error) {
      console.error('Authenticated query error:', error)
      throw error
    }
  }
}