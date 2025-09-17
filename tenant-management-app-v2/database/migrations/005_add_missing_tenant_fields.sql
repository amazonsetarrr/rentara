-- Migration: Add missing Malaysian tenant and guarantor fields
-- This adds the columns that the application expects but are missing from the current schema

-- Add Malaysian tenant identification and nationality fields
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS ic_number VARCHAR;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS nationality VARCHAR DEFAULT 'malaysian';

-- Add work permit and visa fields for foreign tenants
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS work_permit_type VARCHAR DEFAULT 'none';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS visa_expiry_date DATE;

-- Add guarantor information fields
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS guarantor_name VARCHAR;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS guarantor_phone VARCHAR;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS guarantor_ic VARCHAR;

-- Add indexes for performance on new fields
CREATE INDEX IF NOT EXISTS idx_tenants_nationality ON tenants(nationality);
CREATE INDEX IF NOT EXISTS idx_tenants_work_permit_type ON tenants(work_permit_type);
CREATE INDEX IF NOT EXISTS idx_tenants_visa_expiry_date ON tenants(visa_expiry_date);
CREATE INDEX IF NOT EXISTS idx_tenants_ic_number ON tenants(ic_number);

-- Add comments for documentation
COMMENT ON COLUMN tenants.ic_number IS 'Malaysian IC number or foreign identification number';
COMMENT ON COLUMN tenants.nationality IS 'Tenant nationality (malaysian/foreign)';
COMMENT ON COLUMN tenants.work_permit_type IS 'Type of work permit for foreign tenants (none/work_permit/student_pass/dependent_pass/etc)';
COMMENT ON COLUMN tenants.visa_expiry_date IS 'Visa or permit expiry date for foreign tenants';
COMMENT ON COLUMN tenants.guarantor_name IS 'Guarantor full name (usually for foreign tenants)';
COMMENT ON COLUMN tenants.guarantor_phone IS 'Guarantor phone number';
COMMENT ON COLUMN tenants.guarantor_ic IS 'Guarantor IC number';

-- Verify the columns were added successfully
DO $$
BEGIN
    RAISE NOTICE 'Migration 005: Adding missing tenant fields...';

    -- Check each column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'ic_number') THEN
        RAISE NOTICE '✓ ic_number column added';
    ELSE
        RAISE NOTICE '✗ ic_number column failed to add';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'nationality') THEN
        RAISE NOTICE '✓ nationality column added';
    ELSE
        RAISE NOTICE '✗ nationality column failed to add';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'work_permit_type') THEN
        RAISE NOTICE '✓ work_permit_type column added';
    ELSE
        RAISE NOTICE '✗ work_permit_type column failed to add';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'visa_expiry_date') THEN
        RAISE NOTICE '✓ visa_expiry_date column added';
    ELSE
        RAISE NOTICE '✗ visa_expiry_date column failed to add';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'guarantor_name') THEN
        RAISE NOTICE '✓ guarantor_name column added';
    ELSE
        RAISE NOTICE '✗ guarantor_name column failed to add';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'guarantor_phone') THEN
        RAISE NOTICE '✓ guarantor_phone column added';
    ELSE
        RAISE NOTICE '✗ guarantor_phone column failed to add';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'guarantor_ic') THEN
        RAISE NOTICE '✓ guarantor_ic column added';
    ELSE
        RAISE NOTICE '✗ guarantor_ic column failed to add';
    END IF;

    RAISE NOTICE 'Migration 005 completed successfully!';
END $$;