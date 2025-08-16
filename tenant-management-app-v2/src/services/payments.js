import { supabase } from './supabase'

export const paymentsService = {
  // ==================== PAYMENTS ====================
  
  // Get all payments for organization with filters
  async getPayments(filters = {}) {
    try {
      let query = supabase
        .from('payments')
        .select(`
          *,
          tenant:tenants(id, full_name, email),
          unit:units(id, unit_number),
          payment_type:payment_types(id, display_name, name),
          payment_transactions(
            id,
            amount,
            transaction_date,
            status,
            payment_method:payment_methods(display_name)
          )
        `)
        .order('due_date', { ascending: false })

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.tenant_id) {
        query = query.eq('tenant_id', filters.tenant_id)
      }
      if (filters.unit_id) {
        query = query.eq('unit_id', filters.unit_id)
      }
      if (filters.payment_type) {
        query = query.eq('payment_type_id', filters.payment_type)
      }
      if (filters.from_date) {
        query = query.gte('due_date', filters.from_date)
      }
      if (filters.to_date) {
        query = query.lte('due_date', filters.to_date)
      }

      const { data, error } = await query
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Create new payment record
  async createPayment(paymentData) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert([{
          tenant_id: paymentData.tenant_id,
          unit_id: paymentData.unit_id,
          payment_type_id: paymentData.payment_type_id,
          amount: paymentData.amount,
          description: paymentData.description,
          due_date: paymentData.due_date,
          is_recurring: paymentData.is_recurring || false,
          recurring_period: paymentData.recurring_period,
          created_by: paymentData.created_by
        }])
        .select(`
          *,
          tenant:tenants(full_name, email),
          unit:units(unit_number),
          payment_type:payment_types(display_name)
        `)
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Update payment status
  async updatePaymentStatus(paymentId, status, updates = {}) {
    try {
      const updateData = {
        status,
        updated_at: new Date().toISOString(),
        ...updates
      }

      const { data, error } = await supabase
        .from('payments')
        .update(updateData)
        .eq('id', paymentId)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // ==================== PAYMENT TRANSACTIONS ====================

  // Record a payment transaction
  async recordPayment(transactionData) {
    try {
      // Start transaction
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('amount, paid_amount, status')
        .eq('id', transactionData.payment_id)
        .single()

      if (paymentError) throw paymentError

      // Create transaction record
      const { data: transaction, error: transactionError } = await supabase
        .from('payment_transactions')
        .insert([{
          payment_id: transactionData.payment_id,
          payment_method_id: transactionData.payment_method_id,
          amount: transactionData.amount,
          transaction_reference: transactionData.reference,
          transaction_date: transactionData.transaction_date || new Date().toISOString(),
          notes: transactionData.notes,
          receipt_url: transactionData.receipt_url,
          recorded_by: transactionData.recorded_by
        }])
        .select()
        .single()

      if (transactionError) throw transactionError

      // Update payment record
      const newPaidAmount = (payment.paid_amount || 0) + transactionData.amount
      const newStatus = newPaidAmount >= payment.amount ? 'paid' : 
                       newPaidAmount > 0 ? 'partial' : payment.status

      await this.updatePaymentStatus(transactionData.payment_id, newStatus, {
        paid_amount: newPaidAmount,
        paid_date: newStatus === 'paid' ? new Date().toISOString().split('T')[0] : null
      })

      return { data: transaction, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // ==================== SECURITY DEPOSITS ====================

  // Get security deposits
  async getSecurityDeposits(filters = {}) {
    try {
      let query = supabase
        .from('security_deposits')
        .select(`
          *,
          tenant:tenants(id, full_name, email, phone),
          unit:units(id, unit_number),
          deposit_deductions(
            id,
            amount,
            reason,
            description,
            deduction_date
          )
        `)
        .order('received_date', { ascending: false })

      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.tenant_id) {
        query = query.eq('tenant_id', filters.tenant_id)
      }

      const { data, error } = await query
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Create security deposit record
  async createSecurityDeposit(depositData) {
    try {
      const { data, error } = await supabase
        .from('security_deposits')
        .insert([{
          tenant_id: depositData.tenant_id,
          unit_id: depositData.unit_id,
          amount: depositData.amount,
          received_date: depositData.received_date,
          payment_id: depositData.payment_id,
          notes: depositData.notes
        }])
        .select(`
          *,
          tenant:tenants(full_name, email),
          unit:units(unit_number)
        `)
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Add deduction to security deposit
  async addDepositDeduction(deductionData) {
    try {
      // Add deduction record
      const { data: deduction, error: deductionError } = await supabase
        .from('deposit_deductions')
        .insert([{
          security_deposit_id: deductionData.security_deposit_id,
          amount: deductionData.amount,
          reason: deductionData.reason,
          description: deductionData.description,
          photos: deductionData.photos,
          documents: deductionData.documents,
          created_by: deductionData.created_by
        }])
        .select()
        .single()

      if (deductionError) throw deductionError

      // Update security deposit total deductions
      const { data: deposit } = await supabase
        .from('security_deposits')
        .select('total_deductions')
        .eq('id', deductionData.security_deposit_id)
        .single()

      const newTotal = (deposit.total_deductions || 0) + deductionData.amount

      await supabase
        .from('security_deposits')
        .update({ total_deductions: newTotal })
        .eq('id', deductionData.security_deposit_id)

      return { data: deduction, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Process security deposit refund
  async processDepositRefund(depositId, refundData) {
    try {
      const { data, error } = await supabase
        .from('security_deposits')
        .update({
          refund_amount: refundData.refund_amount,
          refund_date: refundData.refund_date,
          refund_reason: refundData.refund_reason,
          refund_payment_id: refundData.refund_payment_id,
          status: refundData.refund_amount >= (refundData.original_amount - (refundData.total_deductions || 0)) 
            ? 'fully_refunded' 
            : 'partially_refunded'
        })
        .eq('id', depositId)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // ==================== RENT SCHEDULES ====================

  // Get rent schedules
  async getRentSchedules(filters = {}) {
    try {
      let query = supabase
        .from('rent_schedules')
        .select(`
          *,
          tenant:tenants(id, full_name, email),
          unit:units(id, unit_number, rent_amount)
        `)
        .order('start_date', { ascending: false })

      if (filters.tenant_id) {
        query = query.eq('tenant_id', filters.tenant_id)
      }
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active)
      }

      const { data, error } = await query
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Create rent schedule
  async createRentSchedule(scheduleData) {
    try {
      const { data, error } = await supabase
        .from('rent_schedules')
        .insert([{
          tenant_id: scheduleData.tenant_id,
          unit_id: scheduleData.unit_id,
          rent_amount: scheduleData.rent_amount,
          due_day: scheduleData.due_day,
          start_date: scheduleData.start_date,
          end_date: scheduleData.end_date,
          late_fee_amount: scheduleData.late_fee_amount || 0,
          late_fee_days: scheduleData.late_fee_days || 7
        }])
        .select(`
          *,
          tenant:tenants(full_name, email),
          unit:units(unit_number)
        `)
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Generate monthly rent payments from schedules
  async generateMonthlyRents(month, year) {
    try {
      console.log(`Generating rents for ${month}/${year}`)
      
      // Get active rent schedules
      const { data: schedules, error: schedulesError } = await this.getRentSchedules({ 
        is_active: true 
      })

      if (schedulesError) throw schedulesError

      const generatedPayments = []
      const rentTypeResult = await supabase
        .from('payment_types')
        .select('id')
        .eq('name', 'rent')
        .limit(1)
        .single()

      const rentTypeId = rentTypeResult.data?.id

      for (const schedule of schedules) {
        const dueDate = new Date(year, month - 1, schedule.due_day)
        
        // Check if payment already exists for this month
        const { data: existingPayment } = await supabase
          .from('payments')
          .select('id')
          .eq('tenant_id', schedule.tenant_id)
          .eq('payment_type_id', rentTypeId)
          .gte('due_date', `${year}-${String(month).padStart(2, '0')}-01`)
          .lt('due_date', `${year}-${String(month + 1).padStart(2, '0')}-01`)
          .limit(1)
          .single()

        if (!existingPayment) {
          const paymentData = {
            tenant_id: schedule.tenant_id,
            unit_id: schedule.unit_id,
            payment_type_id: rentTypeId,
            amount: schedule.rent_amount,
            description: `Monthly rent for ${new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
            due_date: dueDate.toISOString().split('T')[0],
            is_recurring: true,
            recurring_period: 'monthly'
          }

          const { data: payment, error } = await this.createPayment(paymentData)
          if (!error) {
            generatedPayments.push(payment)
          }
        }
      }

      return { data: generatedPayments, error: null }
    } catch (error) {
      console.error('Error generating monthly rents:', error)
      return { data: [], error }
    }
  },

  // ==================== ANALYTICS ====================

  // Get payment analytics
  async getPaymentAnalytics(filters = {}) {
    try {
      const { data: payments, error } = await this.getPayments(filters)
      if (error) throw error

      const analytics = {
        totalDue: 0,
        totalPaid: 0,
        totalOverdue: 0,
        totalPending: 0,
        totalPartial: 0,
        paymentsByStatus: {},
        paymentsByType: {},
        monthlyTrends: []
      }

      const now = new Date()
      
      payments.forEach(payment => {
        analytics.totalDue += payment.amount
        analytics.totalPaid += payment.paid_amount || 0
        
        // Status counts
        if (!analytics.paymentsByStatus[payment.status]) {
          analytics.paymentsByStatus[payment.status] = { count: 0, amount: 0 }
        }
        analytics.paymentsByStatus[payment.status].count++
        analytics.paymentsByStatus[payment.status].amount += payment.amount

        // Overdue calculation
        if (payment.status !== 'paid' && new Date(payment.due_date) < now) {
          analytics.totalOverdue += (payment.amount - (payment.paid_amount || 0))
        } else if (payment.status === 'pending') {
          analytics.totalPending += payment.amount
        } else if (payment.status === 'partial') {
          analytics.totalPartial += (payment.amount - payment.paid_amount)
        }

        // Type counts
        const typeName = payment.payment_type?.display_name || 'Unknown'
        if (!analytics.paymentsByType[typeName]) {
          analytics.paymentsByType[typeName] = { count: 0, amount: 0 }
        }
        analytics.paymentsByType[typeName].count++
        analytics.paymentsByType[typeName].amount += payment.amount
      })

      return { data: analytics, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // ==================== PAYMENT TYPES & METHODS ====================

  async getPaymentTypes() {
    try {
      const { data, error } = await supabase
        .from('payment_types')
        .select('*')
        .order('display_name')
      
      return { data, error }
    } catch (error) {
      return { data: [], error }
    }
  },

  async getPaymentMethods() {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true)
        .order('display_name')
      
      return { data, error }
    } catch (error) {
      return { data: [], error }
    }
  }
}