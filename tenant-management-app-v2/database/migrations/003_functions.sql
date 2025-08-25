-- In Supabase SQL Editor, create this function
CREATE OR REPLACE FUNCTION public.handle_new_user_with_organization(
  user_id UUID,
  email TEXT,
  full_name TEXT,
  organization_name TEXT
) RETURNS JSONB AS $$
DECLARE
  org_id UUID;
  profile JSONB;
  org JSONB;
BEGIN
  -- 1. Create the organization
  INSERT INTO public.organizations (name, slug, trial_ends_at)
  VALUES (organization_name, lower(regexp_replace(organization_name, '\s+', '-', 'g')), now() + interval '14 days')
  RETURNING id INTO org_id;

  -- 2. Create the user profile
  INSERT INTO public.user_profiles (id, email, full_name, organization_id, role)
  VALUES (user_id, email, full_name, org_id, 'owner');

  -- 3. Retrieve created data to return
  SELECT to_jsonb(t) INTO profile FROM public.user_profiles t WHERE t.id = user_id;
  SELECT to_jsonb(o) INTO org FROM public.organizations o WHERE o.id = org_id;

  RETURN jsonb_build_object('profile', profile, 'organization', org);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
