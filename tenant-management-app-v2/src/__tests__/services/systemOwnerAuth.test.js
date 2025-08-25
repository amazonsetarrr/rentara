import { describe, it, expect, vi, beforeEach } from 'vitest'
import { signInSystemOwner, checkSystemOwnerSchema } from '../../services/systemOwnerAuth'
import { supabase } from '../../services/supabase'

vi.mock('../../services/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn()
    }))
  }
}))

describe('systemOwnerAuth service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('signInSystemOwner', () => {
    it('successfully signs in system owner', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'admin@example.com',
        role: 'system_owner'
      }

      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const result = await signInSystemOwner('admin@example.com', 'password123')

      expect(result).toEqual({
        success: true,
        user: mockUser
      })
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'admin@example.com',
        password: 'password123'
      })
    })

    it('handles authentication failure', async () => {
      const mockError = { message: 'Invalid credentials' }

      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: mockError
      })

      const result = await signInSystemOwner('admin@example.com', 'wrongpassword')

      expect(result).toEqual({
        success: false,
        error: mockError
      })
    })

    it('handles network errors', async () => {
      supabase.auth.signInWithPassword.mockRejectedValue(
        new Error('Network error')
      )

      const result = await signInSystemOwner('admin@example.com', 'password123')

      expect(result).toEqual({
        success: false,
        error: { message: 'Network error' }
      })
    })

    it('validates email format', async () => {
      const result = await signInSystemOwner('invalid-email', 'password123')

      expect(result).toEqual({
        success: false,
        error: { message: 'Please enter a valid email address' }
      })
      expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled()
    })

    it('validates password presence', async () => {
      const result = await signInSystemOwner('admin@example.com', '')

      expect(result).toEqual({
        success: false,
        error: { message: 'Password is required' }
      })
      expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled()
    })
  })

  describe('checkSystemOwnerSchema', () => {
    it('successfully validates schema exists', async () => {
      const mockFromChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { table_name: 'system_owners' },
          error: null
        })
      }

      supabase.from.mockReturnValue(mockFromChain)

      const result = await checkSystemOwnerSchema()

      expect(result).toEqual({
        success: true,
        schemaExists: true
      })
    })

    it('handles schema validation errors', async () => {
      const mockFromChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Table not found' }
        })
      }

      supabase.from.mockReturnValue(mockFromChain)

      const result = await checkSystemOwnerSchema()

      expect(result).toEqual({
        success: false,
        error: { message: 'Table not found' }
      })
    })

    it('handles timeout errors', async () => {
      const mockFromChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockImplementation(() => 
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 100)
          )
        )
      }

      supabase.from.mockReturnValue(mockFromChain)

      const result = await checkSystemOwnerSchema()

      expect(result).toEqual({
        success: false,
        error: { message: 'Schema validation timeout. Please try again.' }
      })
    }, 10000)
  })
})