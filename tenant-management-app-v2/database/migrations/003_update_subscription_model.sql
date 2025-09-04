-- Update Subscription Model: Standardize durations
-- Trial: 14 Days, Monthly: 30 Days, Annual: 1 Year
-- All plans have the same features

-- Update existing trial subscriptions to 14-day duration
UPDATE organizations 
SET 
  subscription_ends_at = subscription_started_at + INTERVAL '14 days',
  trial_ends_at = subscription_started_at + INTERVAL '14 days'
WHERE 
  subscription_status = 'trial' 
  AND subscription_ends_at IS NOT NULL;

-- Update existing monthly subscriptions to 30-day duration  
UPDATE organizations 
SET subscription_ends_at = subscription_started_at + INTERVAL '30 days'
WHERE 
  subscription_status = 'active' 
  AND billing_cycle = 'monthly'
  AND subscription_ends_at IS NOT NULL;

-- Update existing annual subscriptions to 1-year duration (no change needed)
UPDATE organizations 
SET subscription_ends_at = subscription_started_at + INTERVAL '1 year'
WHERE 
  subscription_status = 'active' 
  AND billing_cycle = 'annual'
  AND subscription_ends_at IS NOT NULL;

-- Create helper function to get standard subscription duration
CREATE OR REPLACE FUNCTION get_standard_subscription_duration(
  plan_status VARCHAR,
  billing_cycle_param VARCHAR DEFAULT 'monthly'
)
RETURNS INTERVAL
LANGUAGE plpgsql
AS $$
BEGIN
  CASE plan_status
    WHEN 'trial' THEN
      RETURN INTERVAL '14 days';
    WHEN 'active' THEN
      CASE billing_cycle_param
        WHEN 'annual' THEN
          RETURN INTERVAL '1 year';
        ELSE
          RETURN INTERVAL '30 days';
      END CASE;
    ELSE
      RETURN INTERVAL '30 days'; -- Default to monthly
  END CASE;
END;
$$;

-- Create helper function to calculate subscription end date
CREATE OR REPLACE FUNCTION calculate_subscription_end_date(
  start_date TIMESTAMP,
  plan_status VARCHAR,
  billing_cycle_param VARCHAR DEFAULT 'monthly'
)
RETURNS TIMESTAMP
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN start_date + get_standard_subscription_duration(plan_status, billing_cycle_param);
END;
$$;

-- Update the get_subscription_duration function to use standard durations
CREATE OR REPLACE FUNCTION get_subscription_duration(org_id UUID)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  org_record RECORD;
  days_total INTEGER;
  days_remaining INTEGER;
  duration_info JSON;
  standard_duration INTERVAL;
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
  
  -- Get standard duration for this subscription type
  standard_duration := get_standard_subscription_duration(
    org_record.subscription_status, 
    org_record.billing_cycle
  );
  
  -- Calculate total subscription duration using standard durations
  days_total := EXTRACT(DAYS FROM standard_duration);
  
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
    END,
    'standard_durations', json_build_object(
      'trial_days', 14,
      'monthly_days', 30,
      'annual_days', 365
    )
  );
  
  RETURN duration_info;
END;
$$;

-- Update the organization_subscription_info view
DROP VIEW IF EXISTS organization_subscription_info;
CREATE VIEW organization_subscription_info AS
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
  -- Use standard durations for calculations
  CASE 
    WHEN o.subscription_status = 'trial' THEN 14
    WHEN o.billing_cycle = 'annual' THEN 365
    ELSE 30
  END AS total_days,
  EXTRACT(DAYS FROM (o.subscription_ends_at - NOW())) AS days_remaining,
  EXTRACT(DAYS FROM (NOW() - o.subscription_started_at)) AS days_used,
  (NOW() > o.subscription_ends_at) AS is_expired,
  CASE 
    WHEN o.subscription_status = 'trial' THEN 
      ROUND((EXTRACT(DAYS FROM (NOW() - o.subscription_started_at))::DECIMAL / 14) * 100, 1)
    WHEN o.billing_cycle = 'annual' THEN 
      ROUND((EXTRACT(DAYS FROM (NOW() - o.subscription_started_at))::DECIMAL / 365) * 100, 1)
    ELSE 
      ROUND((EXTRACT(DAYS FROM (NOW() - o.subscription_started_at))::DECIMAL / 30) * 100, 1)
  END AS progress_percentage
FROM organizations o
WHERE o.subscription_ends_at IS NOT NULL;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_standard_subscription_duration(VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_subscription_end_date(TIMESTAMP, VARCHAR, VARCHAR) TO authenticated;
GRANT SELECT ON organization_subscription_info TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION get_standard_subscription_duration(VARCHAR, VARCHAR) IS 'Returns standard duration for subscription type: Trial=14 days, Monthly=30 days, Annual=1 year';
COMMENT ON FUNCTION calculate_subscription_end_date(TIMESTAMP, VARCHAR, VARCHAR) IS 'Calculates subscription end date using standard durations';
COMMENT ON VIEW organization_subscription_info IS 'Subscription info view using standardized durations: Trial=14 days, Monthly=30 days, Annual=1 year';