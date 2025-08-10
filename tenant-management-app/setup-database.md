# 🗄️ Database Setup Instructions

## Quick Setup for Supabase

### Step 1: Go to Supabase Dashboard
1. Visit: https://supabase.com/dashboard
2. Sign in to your account
3. Select your project: `tenant-management-app`

### Step 2: Open SQL Editor
1. In the left sidebar, click **"SQL Editor"**
2. Click **"New Query"**

### Step 3: Run This SQL Code
Copy and paste this entire SQL code into the editor:

```sql
-- Create properties table
CREATE TABLE properties (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create tenants table
CREATE TABLE tenants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone_number VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create leases table
CREATE TABLE leases (
  id SERIAL PRIMARY KEY,
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  rent_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create payments table
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  lease_id INTEGER REFERENCES leases(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Step 4: Execute the SQL
1. Click the **"Run"** button (or press Ctrl+Enter)
2. You should see "Success" message

### Step 5: Test the Setup
1. Go back to your app at http://localhost:3000
2. Try adding a tenant again
3. It should work now!

## 🚨 If You Get Errors

**Error: "relation already exists"**
- This means the tables are already created
- You can skip this step

**Error: "permission denied"**
- Make sure you're in the correct project
- Check that you have admin access

## ✅ Verification

After running the SQL, you should see:
- 4 tables created: `properties`, `tenants`, `leases`, `payments`
- No error messages
- Success confirmation

## 🔗 Next Steps

Once the database is set up:
1. Your "Add Tenant" button will work
2. You can add properties, tenants, leases, and payments
3. The dashboard will show real data
4. All CRUD operations will function properly
