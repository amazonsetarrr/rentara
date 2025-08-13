# System Owner Portal Setup Guide

This guide explains how to set up and use the System Owner Portal for managing all tenant organizations in your multi-tenant property management application.

## Overview

The System Owner Portal provides a dedicated interface for system administrators to:
- View and manage all tenant organizations
- Monitor system-wide metrics and analytics
- Suspend/activate organizations
- Track usage and billing information
- Audit system activities

## Database Setup

1. **Apply the main schema first** (if not already done):
   ```sql
   -- Execute the contents of supabase-setup.sql in your Supabase SQL Editor
   ```

2. **Apply the system owner extensions**:
   ```sql
   -- Execute the contents of system-owner-schema.sql in your Supabase SQL Editor
   ```

## Creating Your First System Owner

Since system owners need special privileges, you'll need to create them manually through the database:

1. **Create a regular Supabase user first** through the regular signup process or Supabase Auth dashboard.

2. **Upgrade the user to system owner** by running this SQL in your Supabase SQL Editor:
   ```sql
   -- Replace 'your-email@example.com' with the actual email
   -- Replace 'Admin Name' with the actual name
   
   -- First, get the user ID
   SELECT id FROM auth.users WHERE email = 'your-email@example.com';
   
   -- Update user profile to be system owner
   UPDATE user_profiles 
   SET is_system_owner = TRUE, 
       role = 'system_owner',
       organization_id = NULL
   WHERE email = 'your-email@example.com';
   
   -- Create system owner record
   INSERT INTO system_owners (id, full_name, email, permissions)
   SELECT 
     id,
     'Admin Name',
     email,
     '{"manage_organizations": true, "view_analytics": true, "manage_billing": true}'::jsonb
   FROM auth.users 
   WHERE email = 'your-email@example.com';
   ```

## Accessing the System Owner Portal

1. **Navigate to the System Owner Portal**:
   ```
   http://localhost:5173/system-owner
   ```

2. **Sign in** with your system owner credentials

3. **Dashboard Features**:
   - View system-wide metrics (total organizations, users, properties, tenants)
   - Manage organizations (activate/suspend)
   - Monitor subscription statuses
   - Access audit logs

## Portal Structure

```
/system-owner/
├── /auth              # System owner login
├── /dashboard         # Main overview dashboard
├── /organizations     # Organization management (coming soon)
├── /analytics         # System analytics (coming soon)
└── /settings          # System settings (coming soon)
```

## Key Features

### 1. Organization Management
- View all tenant organizations
- See subscription status and plans
- Activate/suspend organizations
- Monitor trial periods

### 2. System Metrics
- Total organizations count
- Total users across all tenants
- Total properties managed
- Active tenants count

### 3. Security Features
- Separate authentication from regular users
- Row Level Security (RLS) policies
- Audit logging for all system owner actions
- IP address tracking

### 4. Multi-Tenant Isolation
- System owners can view data across all organizations
- Regular users remain isolated to their organization
- Clear separation between system and tenant data

## Development Notes

### File Structure
```
src/
├── services/
│   └── systemOwnerAuth.js      # System owner authentication
├── stores/
│   └── systemOwnerStore.js     # System owner state management
├── pages/
│   ├── SystemOwnerAuth.jsx     # Login page
│   └── SystemOwnerDashboard.jsx # Main dashboard
├── components/auth/
│   └── SystemOwnerProtectedRoute.jsx # Route protection
└── SystemOwnerApp.jsx          # System owner app router
```

### Adding New System Owner Features

1. **Create new pages** in `src/pages/`
2. **Add routes** in `SystemOwnerApp.jsx`
3. **Implement business logic** in `systemOwnerStore.js`
4. **Add database functions** as needed

### Environment Considerations

- **Development**: Access via `http://localhost:5173/system-owner`
- **Production**: Ensure proper domain routing for `/system-owner/*` paths

## Security Best Practices

1. **Use strong passwords** for system owner accounts
2. **Enable MFA** on system owner accounts (when available)
3. **Regularly audit** system owner activities
4. **Limit system owner access** to necessary personnel only
5. **Monitor login patterns** and suspicious activities

## Troubleshooting

### Common Issues

1. **Can't access system owner portal**
   - Verify user has `is_system_owner = true` in database
   - Check that system owner record exists in `system_owners` table

2. **RLS permission errors**
   - Ensure all RLS policies are created correctly
   - Verify user authentication is working

3. **Navigation issues**
   - Check that routing is properly configured in `App.jsx`
   - Verify `SystemOwnerApp.jsx` is handling routes correctly

### Database Queries for Debugging

```sql
-- Check if user is system owner
SELECT up.email, up.is_system_owner, so.permissions 
FROM user_profiles up
LEFT JOIN system_owners so ON up.id = so.id
WHERE up.email = 'your-email@example.com';

-- View all system owners
SELECT up.email, up.full_name, up.created_at
FROM user_profiles up
WHERE up.is_system_owner = true;

-- Check organization count
SELECT COUNT(*) as total_organizations FROM organizations;
```

## Future Enhancements

- Advanced analytics dashboard
- Billing management integration
- Automated organization provisioning
- Email notifications for system events
- Advanced audit logging with search
- Organization usage quotas and limits
- Automated trial expiration handling

## Support

For technical support or questions about the System Owner Portal, please refer to the main application documentation or contact your development team.