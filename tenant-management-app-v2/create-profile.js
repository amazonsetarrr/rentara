import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lwffcfzkeciihbmgrpsb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3ZmZjZnprZWNpaWhibWdycHNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4MzgxNzEsImV4cCI6MjA3MDQxNDE3MX0.3NWRxgPFiIvFGDwQu3IbumRI7CqGyYAeSdpQ9v-HQnY'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createProfile() {
  const userId = 'd1689f9e-f719-4a8c-8b8b-bd7e8ad0bae0'
  const email = 'zainiemel@gmail.com'
  
  try {
    console.log('1. Creating organization...')
    
    // Create organization
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert([{
        name: 'Your Organization',
        slug: 'your-organization',
        subscription_status: 'trial',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      }])
      .select()
      .single()
    
    if (orgError) {
      console.error('Organization creation failed:', orgError)
      return
    }
    
    console.log('Organization created:', orgData)
    
    console.log('2. Creating user profile...')
    
    // Create user profile
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .insert([{
        id: userId,
        email: email,
        full_name: 'Zaini Emel',
        organization_id: orgData.id,
        role: 'owner'
      }])
      .select()
    
    if (profileError) {
      console.error('Profile creation failed:', profileError)
      return
    }
    
    console.log('Profile created successfully:', profileData)
    console.log('\n✅ Done! You can now refresh the app and login should work.')
    
  } catch (error) {
    console.error('Script failed:', error)
  }
}

createProfile()