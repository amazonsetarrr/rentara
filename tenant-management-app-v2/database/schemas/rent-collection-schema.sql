-- Rent Collection & Payment Management Schema
-- Comprehensive payment tracking system for tenant management

-- 1. Payment Types/Categories
CREATE TABLE payment_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL, -- 'rent', 'security_deposit', 'booking_fee', 'utilities', etc.
  display_name VARCHAR NOT NULL,
  description TEXT,
  is_recurring BOOLEAN DEFAULT FALSE, -- true for rent, utilities
  is_refundable BOOLEAN DEFAULT FALSE, -- true for security deposit
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

-- 2. Payment Records - Main payments table
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  payment_type_id UUID REFERENCES payment_types(id),
  
  -- Payment Details
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'MYR',
  description TEXT,
  reference_number VARCHAR, -- Invoice/receipt number
  
  -- Payment Status
  status VARCHAR NOT NULL DEFAULT 'pending', 
  -- 'pending', 'paid', 'partial', 'overdue', 'cancelled', 'refunded'
  
  -- Due Date & Payment Date
  due_date DATE NOT NULL,
  paid_date DATE,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  
  -- Recurring Payment Info
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_period VARCHAR, -- 'monthly', 'weekly', 'quarterly'
  parent_payment_id UUID REFERENCES payments(id), -- For recurring payments
  
  -- Late Fees
  late_fee_amount DECIMAL(12,2) DEFAULT 0,
  late_fee_applied_date DATE,
  
  -- Audit
  created_by UUID REFERENCES user_profiles(id),
  updated_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Payment Methods
CREATE TABLE payment_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL, -- 'cash', 'bank_transfer', 'credit_card', 'fpx', etc.
  display_name VARCHAR NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  requires_reference BOOLEAN DEFAULT FALSE, -- Bank transfer needs reference number
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Payment Transactions - Actual payment records
CREATE TABLE payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  payment_method_id UUID REFERENCES payment_methods(id),
  
  -- Transaction Details
  amount DECIMAL(12,2) NOT NULL,
  transaction_reference VARCHAR, -- Bank reference, receipt number, etc.
  transaction_date TIMESTAMP DEFAULT NOW(),
  
  -- Status
  status VARCHAR NOT NULL DEFAULT 'completed',
  -- 'pending', 'completed', 'failed', 'cancelled'
  
  -- Additional Info
  notes TEXT,
  receipt_url VARCHAR, -- Link to receipt/proof of payment
  
  -- Audit
  recorded_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. Security Deposits Tracking
CREATE TABLE security_deposits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Deposit Details
  amount DECIMAL(12,2) NOT NULL,
  received_date DATE NOT NULL,
  payment_id UUID REFERENCES payments(id), -- Link to payment record
  
  -- Refund Details
  refund_amount DECIMAL(12,2) DEFAULT 0,
  refund_date DATE,
  refund_reason TEXT,
  refund_payment_id UUID REFERENCES payments(id), -- Link to refund payment
  
  -- Deductions
  total_deductions DECIMAL(12,2) DEFAULT 0,
  
  -- Status
  status VARCHAR NOT NULL DEFAULT 'held',
  -- 'held', 'partially_refunded', 'fully_refunded', 'forfeited'
  
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. Security Deposit Deductions
CREATE TABLE deposit_deductions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  security_deposit_id UUID REFERENCES security_deposits(id) ON DELETE CASCADE,
  
  -- Deduction Details
  amount DECIMAL(12,2) NOT NULL,
  reason VARCHAR NOT NULL, -- 'damage', 'cleaning', 'unpaid_rent', 'utilities', etc.
  description TEXT,
  deduction_date DATE DEFAULT CURRENT_DATE,
  
  -- Evidence
  photos JSONB, -- Array of photo URLs
  documents JSONB, -- Array of document URLs
  
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Rent Schedules - For automatic rent generation
CREATE TABLE rent_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Schedule Details
  rent_amount DECIMAL(12,2) NOT NULL,
  due_day INTEGER NOT NULL, -- Day of month (1-31)
  start_date DATE NOT NULL,
  end_date DATE, -- NULL for ongoing
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Late Fee Settings
  late_fee_amount DECIMAL(12,2) DEFAULT 0,
  late_fee_days INTEGER DEFAULT 7, -- Apply late fee after X days
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 8. Payment Reminders
CREATE TABLE payment_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  
  -- Reminder Details
  reminder_type VARCHAR NOT NULL, -- 'before_due', 'overdue', 'final_notice'
  days_offset INTEGER NOT NULL, -- Days before/after due date
  
  -- Status
  sent_at TIMESTAMP,
  status VARCHAR DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  
  -- Channels
  email_sent BOOLEAN DEFAULT FALSE,
  sms_sent BOOLEAN DEFAULT FALSE,
  whatsapp_sent BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE payment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposit_deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rent_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their organization's payment data" ON payment_types
  FOR ALL USING (organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage their organization's payments" ON payments
  FOR ALL USING (organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage their organization's payment methods" ON payment_methods
  FOR ALL USING (organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage their organization's transactions" ON payment_transactions
  FOR ALL USING (
    payment_id IN (
      SELECT id FROM payments WHERE organization_id IN (
        SELECT organization_id FROM user_profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage their organization's deposits" ON security_deposits
  FOR ALL USING (organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage their organization's deposit deductions" ON deposit_deductions
  FOR ALL USING (
    security_deposit_id IN (
      SELECT id FROM security_deposits WHERE organization_id IN (
        SELECT organization_id FROM user_profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage their organization's rent schedules" ON rent_schedules
  FOR ALL USING (organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage their organization's payment reminders" ON payment_reminders
  FOR ALL USING (
    payment_id IN (
      SELECT id FROM payments WHERE organization_id IN (
        SELECT organization_id FROM user_profiles WHERE id = auth.uid()
      )
    )
  );

-- Indexes for performance
CREATE INDEX idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX idx_payments_unit_id ON payments(unit_id);
CREATE INDEX idx_payments_organization_id ON payments(organization_id);
CREATE INDEX idx_payments_due_date ON payments(due_date);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payment_transactions_payment_id ON payment_transactions(payment_id);
CREATE INDEX idx_security_deposits_tenant_id ON security_deposits(tenant_id);
CREATE INDEX idx_rent_schedules_tenant_id ON rent_schedules(tenant_id);

-- Triggers for updated_at
CREATE TRIGGER update_payment_types_updated_at BEFORE UPDATE ON payment_types 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_security_deposits_updated_at BEFORE UPDATE ON security_deposits 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_rent_schedules_updated_at BEFORE UPDATE ON rent_schedules 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Insert default payment types
INSERT INTO payment_types (name, display_name, description, is_recurring, is_refundable, organization_id) 
SELECT 
  type.name, 
  type.display_name, 
  type.description, 
  type.is_recurring, 
  type.is_refundable,
  org.id
FROM (
  VALUES 
    ('rent', 'Monthly Rent', 'Regular monthly rent payment', true, false),
    ('security_deposit', 'Security Deposit', 'Refundable security deposit', false, true),
    ('booking_fee', 'Booking Fee', 'Non-refundable booking/reservation fee', false, false),
    ('utilities', 'Utilities', 'Water, electricity, internet bills', true, false),
    ('maintenance', 'Maintenance Fee', 'Repair and maintenance charges', false, false),
    ('late_fee', 'Late Fee', 'Penalty for overdue payments', false, false),
    ('cleaning_fee', 'Cleaning Fee', 'Professional cleaning charges', false, false)
) AS type(name, display_name, description, is_recurring, is_refundable)
CROSS JOIN organizations org
ON CONFLICT (organization_id, name) DO NOTHING;

-- Insert default payment methods
INSERT INTO payment_methods (name, display_name, requires_reference, organization_id)
SELECT 
  method.name,
  method.display_name,
  method.requires_reference,
  org.id
FROM (
  VALUES 
    ('cash', 'Cash', false),
    ('bank_transfer', 'Bank Transfer', true),
    ('online_banking', 'Online Banking', true),
    ('credit_card', 'Credit Card', false),
    ('debit_card', 'Debit Card', false),
    ('fpx', 'FPX', true),
    ('grab_pay', 'GrabPay', false),
    ('touch_n_go', 'Touch ''n Go', false),
    ('boost', 'Boost', false)
) AS method(name, display_name, requires_reference)
CROSS JOIN organizations org;