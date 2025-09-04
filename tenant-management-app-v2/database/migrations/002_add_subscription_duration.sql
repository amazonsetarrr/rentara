-- Add subscription duration tracking to organizations table
-- This migration adds fields to track subscription billing cycle and end dates

-- Add new columns to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR DEFAULT 'monthly', -- 'monthly', 'annual'
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP DEFAULT NOW();

-- Update existing organizations to have subscription_started_at as created_at
UPDATE organizations 
SET subscription_started_at = created_at 
WHERE subscription_started_at IS NULL;

-- Set subscription_ends_at for trial organizations (14 days from created_at if trial_ends_at is not set)
UPDATE organizations 
SET subscription_ends_at = COALESCE(trial_ends_at, created_at + INTERVAL '14 days')
WHERE subscription_status = 'trial' AND subscription_ends_at IS NULL;

-- Set subscription_ends_at for active organizations (30 days for monthly, 1 year for annual)
UPDATE organizations 
SET subscription_ends_at = CASE 
  WHEN billing_cycle = 'annual' THEN subscription_started_at + INTERVAL '1 year'
  ELSE subscription_started_at + INTERVAL '30 days'
END
WHERE subscription_status = 'active' AND subscription_ends_at IS NULL;

-- Add index for efficient querying of subscription end dates
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_ends 
ON organizations(subscription_ends_at);

-- Add index for billing cycle queries
CREATE INDEX IF NOT EXISTS idx_organizations_billing_cycle 
ON organizations(billing_cycle);

-- Create a function to calculate subscription duration
CREATE OR REPLACE FUNCTION get_subscription_duration(org_id UUID)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  org_record RECORD;
  days_total INTEGER;
  days_remaining INTEGER;
  duration_info JSON;
BEGIN
  SELECT 
    subscription_status,
    subscription_plan,
    subscription_started_at,
    subscription_ends_at,
    billing_cycle,
    created_at
  INTO org_record
  FROM organizations 
  WHERE id = org_id;
  
  IF NOT FOUND THEN
    RETURN '{"error": "Organization not found"}'::JSON;
  END IF;
  
  -- Calculate total subscription duration
  days_total := EXTRACT(DAYS FROM (org_record.subscription_ends_at - org_record.subscription_started_at));
  
  -- Calculate days remaining
  days_remaining := EXTRACT(DAYS FROM (org_record.subscription_ends_at - NOW()));
  
  -- Build duration info object
  duration_info := json_build_object(
    'status', org_record.subscription_status,
    'plan', org_record.subscription_plan,
    'billing_cycle', org_record.billing_cycle,
    'started_at', org_record.subscription_started_at,
    'ends_at', org_record.subscription_ends_at,
    'days_total', GREATEST(days_total, 0),
    'days_remaining', days_remaining,
    'days_used', GREATEST(days_total - days_remaining, 0),
    'is_expired', (NOW() > org_record.subscription_ends_at),
    'progress_percentage', CASE 
      WHEN days_total > 0 THEN ROUND((GREATEST(days_total - days_remaining, 0)::DECIMAL / days_total) * 100, 1)
      ELSE 0 
    END
  );
  
  RETURN duration_info;
END;
$$;

-- Create a view for easy subscription duration queries
CREATE OR REPLACE VIEW organization_subscription_info AS
SELECT 
  o.id,
  o.name,
  o.slug,
  o.subscription_status,
  o.subscription_plan,
  o.billing_cycle,
  o.subscription_started_at,
  o.subscription_ends_at,
  o.created_at,
  EXTRACT(DAYS FROM (o.subscription_ends_at - o.subscription_started_at)) AS total_days,
  EXTRACT(DAYS FROM (o.subscription_ends_at - NOW())) AS days_remaining,
  EXTRACT(DAYS FROM (NOW() - o.subscription_started_at)) AS days_used,
  (NOW() > o.subscription_ends_at) AS is_expired,
  CASE 
    WHEN EXTRACT(DAYS FROM (o.subscription_ends_at - o.subscription_started_at)) > 0 
    THEN ROUND(
      (EXTRACT(DAYS FROM (NOW() - o.subscription_started_at))::DECIMAL / 
       EXTRACT(DAYS FROM (o.subscription_ends_at - o.subscription_started_at))) * 100, 1
    )
    ELSE 0 
  END AS progress_percentage
FROM organizations o
WHERE o.subscription_ends_at IS NOT NULL;

-- Grant necessary permissions
GRANT SELECT ON organization_subscription_info TO authenticated;
GRANT EXECUTE ON FUNCTION get_subscription_duration(UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_subscription_duration(UUID) IS 'Returns detailed subscription duration information for an organization';
COMMENT ON VIEW organization_subscription_info IS 'Provides subscription duration metrics for all organizations';