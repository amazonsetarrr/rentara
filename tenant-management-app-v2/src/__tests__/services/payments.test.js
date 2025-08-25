import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  fetchPayments, 
  fetchPaymentAnalytics, 
  createPayment, 
  updatePaymentStatus,
  generateMonthlyRent
} from '../../services/payments'
import { supabase } from '../../services/supabase'

vi.mock('../../services/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(),
      then: vi.fn()
    })),
    rpc: vi.fn()
  }
}))

describe('payments service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchPayments', () => {
    it('fetches payments without filters', async () => {
      const mockPayments = [
        { id: '1', tenant_name: 'John Doe', amount: 1500, status: 'paid' },
        { id: '2', tenant_name: 'Jane Smith', amount: 1200, status: 'pending' }
      ]

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockPayments, error: null })
      }

      supabase.from.mockReturnValue(mockChain)

      const result = await fetchPayments()

      expect(result).toEqual({
        success: true,
        data: mockPayments
      })
      expect(supabase.from).toHaveBeenCalledWith('payment_records')
    })

    it('applies status filter', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null })
      }

      supabase.from.mockReturnValue(mockChain)

      await fetchPayments({ status: 'pending' })

      expect(mockChain.eq).toHaveBeenCalledWith('status', 'pending')
    })

    it('applies search filter', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null })
      }

      supabase.from.mockReturnValue(mockChain)

      await fetchPayments({ search: 'John' })

      expect(mockChain.ilike).toHaveBeenCalledWith('tenant_name', '%John%')
    })

    it('handles fetch errors', async () => {
      const mockError = { message: 'Database error' }
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: null, error: mockError })
      }

      supabase.from.mockReturnValue(mockChain)

      const result = await fetchPayments()

      expect(result).toEqual({
        success: false,
        error: mockError
      })
    })
  })

  describe('fetchPaymentAnalytics', () => {
    it('fetches payment analytics successfully', async () => {
      const mockAnalytics = {
        totalPayments: 150000,
        pendingPayments: 25000,
        overduePayments: 8000,
        collectionRate: 92.5
      }

      supabase.rpc.mockResolvedValue({
        data: mockAnalytics,
        error: null
      })

      const result = await fetchPaymentAnalytics()

      expect(result).toEqual({
        success: true,
        data: mockAnalytics
      })
      expect(supabase.rpc).toHaveBeenCalledWith('get_payment_analytics')
    })

    it('handles analytics fetch errors', async () => {
      const mockError = { message: 'Analytics error' }

      supabase.rpc.mockResolvedValue({
        data: null,
        error: mockError
      })

      const result = await fetchPaymentAnalytics()

      expect(result).toEqual({
        success: false,
        error: mockError
      })
    })
  })

  describe('createPayment', () => {
    it('creates payment successfully', async () => {
      const paymentData = {
        tenant_id: 'tenant-123',
        unit_id: 'unit-456',
        amount: 1500,
        type: 'rent',
        due_date: '2024-01-15'
      }

      const mockCreatedPayment = { id: 'payment-789', ...paymentData }
      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockCreatedPayment,
          error: null
        })
      }

      supabase.from.mockReturnValue(mockChain)

      const result = await createPayment(paymentData)

      expect(result).toEqual({
        success: true,
        data: mockCreatedPayment
      })
      expect(mockChain.insert).toHaveBeenCalledWith(paymentData)
    })

    it('handles payment creation errors', async () => {
      const mockError = { message: 'Creation failed' }
      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: mockError
        })
      }

      supabase.from.mockReturnValue(mockChain)

      const result = await createPayment({})

      expect(result).toEqual({
        success: false,
        error: mockError
      })
    })
  })

  describe('updatePaymentStatus', () => {
    it('updates payment status successfully', async () => {
      const updatedPayment = {
        id: 'payment-123',
        status: 'paid',
        payment_date: '2024-01-10'
      }

      const mockChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: updatedPayment,
          error: null
        })
      }

      supabase.from.mockReturnValue(mockChain)

      const result = await updatePaymentStatus('payment-123', 'paid', '2024-01-10')

      expect(result).toEqual({
        success: true,
        data: updatedPayment
      })
      expect(mockChain.update).toHaveBeenCalledWith({
        status: 'paid',
        payment_date: '2024-01-10'
      })
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'payment-123')
    })

    it('handles status update errors', async () => {
      const mockError = { message: 'Update failed' }
      const mockChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: mockError
        })
      }

      supabase.from.mockReturnValue(mockChain)

      const result = await updatePaymentStatus('payment-123', 'paid')

      expect(result).toEqual({
        success: false,
        error: mockError
      })
    })
  })

  describe('generateMonthlyRent', () => {
    it('generates monthly rent successfully', async () => {
      const rentData = {
        month: '2024-02',
        properties: ['property-1', 'property-2']
      }

      const mockResult = { generated: 15, skipped: 2 }

      supabase.rpc.mockResolvedValue({
        data: mockResult,
        error: null
      })

      const result = await generateMonthlyRent(rentData)

      expect(result).toEqual({
        success: true,
        data: mockResult
      })
      expect(supabase.rpc).toHaveBeenCalledWith('generate_monthly_rent', rentData)
    })

    it('handles rent generation errors', async () => {
      const mockError = { message: 'Generation failed' }

      supabase.rpc.mockResolvedValue({
        data: null,
        error: mockError
      })

      const result = await generateMonthlyRent({ month: '2024-02' })

      expect(result).toEqual({
        success: false,
        error: mockError
      })
    })
  })
})