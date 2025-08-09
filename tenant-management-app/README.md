# Tenant Management App

This is a tenant management application built with React, Supabase, and Tailwind CSS.

## Project Structure

- `frontend`: Contains the React frontend application.
- `backend`: Contains the Supabase backend configuration.
- `docs`: Contains the documentation.
- `config`: Contains the configuration files.

## Getting Started

### Prerequisites

- Node.js
- npm
- Supabase account

### Frontend Setup

1. Navigate to the `frontend` directory:

   ```bash
   cd frontend
   ```

2. Install the dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the `frontend` directory and add your Supabase URL and anon key:

   ```
   VITE_SUPABASE_URL=YOUR_SUPABASE_URL
   VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
   ```

4. Run the development server:

   ```bash
   npm run dev
   ```

### Backend Setup

1. [Set up a new Supabase project](https://supabase.com/docs/guides/getting-started/quickstarts/react#create-a-project).

2. Apply the database migrations located in the `backend/supabase/migrations` directory.

## Next Steps

- Implement the functionality for managing tenants, properties, leases, and payments.
- Add authentication and authorization.
- Write tests for the application.
