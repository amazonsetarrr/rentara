-- Database fixes for payment system and user profile issues
-- Run this in your Supabase SQL Editor

-- 1. Add computed columns for missing fields
-- Add full_name computed column to tenants table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tenants' AND column_name = 'full_name') THEN
        ALTER TABLE tenants ADD COLUMN full_name TEXT GENERATED ALWAYS AS (
            CASE 
                WHEN last_name IS NOT NULL THEN first_name || ' ' || last_name
                ELSE first_name
            END
        ) STORED;
    END IF;
END $$;

-- 2. Ensure payment tables exist (from rent-collection-schema.sql)
-- This will create the tables if they don't exist

-- Payment Types/Categories
CREATE TABLE IF NOT EXISTS payment_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  display_name VARCHAR NOT NULL,
  description TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  is_refundable BOOLEAN DEFAULT FALSE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

-- Payment Records - Main payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  payment_type_id UUID REFERENCES payment_types(id),
  
  -- Payment Details
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'MYR',
  description TEXT,
  reference_number VARCHAR,
  
  -- Payment Status
  status VARCHAR NOT NULL DEFAULT 'pending',
  
  -- Due Date & Payment Date
  due_date DATE NOT NULL,
  paid_date DATE,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  
  -- Recurring Payment Info
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_period VARCHAR,
  parent_payment_id UUID REFERENCES payments(id),
  
  -- Late Fees
  late_fee_amount DECIMAL(12,2) DEFAULT 0,
  late_fee_applied_date DATE,
  
  -- Audit
  created_by UUID REFERENCES user_profiles(id),
  updated_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Payment Methods
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  display_name VARCHAR NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  requires_reference BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Payment Transactions - Actual payment records
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  payment_method_id UUID REFERENCES payment_methods(id),
  
  -- Transaction Details
  amount DECIMAL(12,2) NOT NULL,
  transaction_reference VARCHAR,
  transaction_date TIMESTAMP DEFAULT NOW(),
  
  -- Status
  status VARCHAR NOT NULL DEFAULT 'completed',
  
  -- Additional Info
  notes TEXT,
  receipt_url VARCHAR,
  
  -- Audit
  recorded_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Enable RLS on payment tables if not already enabled
DO $$
BEGIN
    -- Enable RLS
    EXECUTE 'ALTER TABLE payment_types ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE payments ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY';
EXCEPTION
    WHEN OTHERS THEN
        -- RLS might already be enabled, continue
        NULL;
END $$;

-- 4. Create RLS Policies for payment tables
-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can manage their organization's payment data" ON payment_types;
DROP POLICY IF EXISTS "Users can manage their organization's payments" ON payments;
DROP POLICY IF EXISTS "Users can manage their organization's payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can manage their organization's transactions" ON payment_transactions;

-- Recreate policies
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

-- 5. Create indexes for performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_unit_id ON payments(unit_id);
CREATE INDEX IF NOT EXISTS idx_payments_organization_id ON payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON payments(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_id ON payment_transactions(payment_id);

-- 6. Insert default payment types for all organizations
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

-- 7. Insert default payment methods for all organizations
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
CROSS JOIN organizations org
ON CONFLICT DO NOTHING;

-- 8. Update triggers for updated_at if they don't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to payment tables
DROP TRIGGER IF EXISTS update_payment_types_updated_at ON payment_types;
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
DROP TRIGGER IF EXISTS update_payment_transactions_updated_at ON payment_transactions;

CREATE TRIGGER update_payment_types_updated_at BEFORE UPDATE ON payment_types 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 9. Verify tables exist
DO $$
BEGIN
    RAISE NOTICE 'Payment tables setup complete. Verifying tables exist:';
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_types') THEN
        RAISE NOTICE '✓ payment_types table exists';
    ELSE
        RAISE NOTICE '✗ payment_types table missing';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
        RAISE NOTICE '✓ payments table exists';
    ELSE
        RAISE NOTICE '✗ payments table missing';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_methods') THEN
        RAISE NOTICE '✓ payment_methods table exists';
    ELSE
        RAISE NOTICE '✗ payment_methods table missing';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_transactions') THEN
        RAISE NOTICE '✓ payment_transactions table exists';
    ELSE
        RAISE NOTICE '✗ payment_transactions table missing';
    END IF;
END $$;