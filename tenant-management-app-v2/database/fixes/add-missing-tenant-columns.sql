-- URGENT FIX: Add missing tenant columns to resolve schema cache errors
-- Run this immediately in Supabase SQL Editor to fix the 'guarantor_ic' column error

-- This addresses the error: "Could not find the 'guarantor_ic' column of 'tenants' in the schema cache"

BEGIN;

-- Add all missing columns that the application expects
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS ic_number VARCHAR;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS nationality VARCHAR DEFAULT 'malaysian';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS work_permit_type VARCHAR DEFAULT 'none';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS visa_expiry_date DATE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS guarantor_name VARCHAR;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS guarantor_phone VARCHAR;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS guarantor_ic VARCHAR;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_tenants_nationality ON tenants(nationality);
CREATE INDEX IF NOT EXISTS idx_tenants_work_permit_type ON tenants(work_permit_type);
CREATE INDEX IF NOT EXISTS idx_tenants_visa_expiry_date ON tenants(visa_expiry_date);
CREATE INDEX IF NOT EXISTS idx_tenants_ic_number ON tenants(ic_number);

-- Verify all columns exist
DO $$
DECLARE
    missing_columns TEXT[] := ARRAY[]::TEXT[];
    col_name TEXT;
    required_columns TEXT[] := ARRAY[
        'ic_number',
        'nationality',
        'work_permit_type',
        'visa_expiry_date',
        'guarantor_name',
        'guarantor_phone',
        'guarantor_ic'
    ];
BEGIN
    -- Check each required column
    FOREACH col_name IN ARRAY required_columns
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'tenants' AND column_name = col_name
        ) THEN
            missing_columns := array_append(missing_columns, col_name);
        END IF;
    END LOOP;

    -- Report results
    IF array_length(missing_columns, 1) IS NULL THEN
        RAISE NOTICE '✅ SUCCESS: All required tenant columns now exist!';
        RAISE NOTICE 'The schema cache error should be resolved.';
    ELSE
        RAISE NOTICE '❌ FAILED: Missing columns: %', array_to_string(missing_columns, ', ');
    END IF;
END $$;

COMMIT;

-- Force schema refresh (optional - Supabase usually handles this automatically)
SELECT pg_notify('pgrst', 'reload schema');