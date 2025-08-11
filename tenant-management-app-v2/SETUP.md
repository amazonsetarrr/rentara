# Supabase Setup Guide

Follow these steps to set up your Supabase database for the multi-tenant property management system.

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down your project URL and anon key

## 2. Configure Environment Variables

1. Copy `.env.example` to `.env`
2. Add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

## 3. Execute Database Schema

1. Open the Supabase dashboard
2. Go to **SQL Editor**
3. Copy and paste the entire content from `supabase-setup.sql`
4. Click **Run** to execute the script

This will create:
- ✅ All required tables (organizations, user_profiles, properties, units, tenants, lease_history)
- ✅ Row Level Security (RLS) policies for multi-tenant data isolation
- ✅ Database indexes for optimal performance
- ✅ Triggers for automatic timestamp updates

## 4. Verify Setup

After running the SQL script, verify in Supabase dashboard:

### Authentication
- Go to **Authentication** → **Settings** 
- Ensure "Enable email confirmations" is set based on your preference

### Database Tables
- Go to **Table Editor**
- Verify all 6 tables are created:
  - `organizations`
  - `user_profiles` 
  - `properties`
  - `units`
  - `tenants`
  - `lease_history`

### Row Level Security
- Each table should show **RLS enabled** status
- Policies should be visible under each table

## 5. Test the Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. The multi-tenant system is now ready with:
   - Organization-based data separation
   - User authentication and profiles
   - Property and unit management
   - Tenant and lease tracking
   - Automatic security policies

## Database Schema Overview

```
organizations (tenant isolation)
├── user_profiles (users belong to organizations)
├── properties (organization-specific properties)
│   └── units (units belong to properties)
│       └── tenants (tenants occupy units)
└── lease_history (tracks tenant movements)
```

## Security Features

- **Row Level Security**: Users can only access data from their organization
- **Multi-tenant isolation**: Complete data separation between organizations
- **Role-based access**: Owner, admin, and member roles
- **Audit trails**: Created/updated timestamps and user tracking

## Next Steps

1. Run the application and test user registration
2. Create sample properties and units
3. Add tenants and verify data isolation
4. Customize subscription limits as needed

**Need help?** Check the development guide or create an issue in the repository.