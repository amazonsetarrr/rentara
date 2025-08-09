# Tenant Management Application Backend

This document provides an overview of the backend setup and usage for the Tenant Management Application, which utilizes Supabase as its backend service.

## Project Structure

The backend directory contains the following key components:

- **supabase/**: This directory contains all Supabase-related files.
  - **migrations/**: Holds Supabase-specific migration files to manage database schema changes.
  - **policies.sql**: Defines the security policies for the Supabase database.
  - **seed.sql**: Contains SQL commands to seed the database with initial data.
  
- **functions/**: This directory is for optional Supabase Edge Functions or Firebase Cloud Functions that can be used to extend the backend functionality.

- **storage-rules/**: Contains rules for file storage if using Firebase.

- **package.json**: Configuration file for npm, listing dependencies and scripts for the backend.

## Getting Started

To set up the backend, follow these steps:

1. **Install Dependencies**: Navigate to the backend directory and run:
   ```
   npm install
   ```

2. **Configure Environment Variables**: Copy the `.env.example` file to `.env` and fill in the required values.

3. **Run Migrations**: Use the Supabase CLI to apply migrations:
   ```
   supabase db push
   ```

4. **Seed the Database**: Run the seed script to populate the database with initial data:
   ```
   psql -h <your-db-host> -U <your-db-user> -d <your-db-name> -f seed.sql
   ```

5. **Start the Development Server**: If you have any functions, you can run them locally using:
   ```
   supabase functions serve
   ```

## Additional Resources

- Refer to the [Supabase Documentation](https://supabase.io/docs) for more information on using Supabase.
- Check the `docs/architecture.md` file for an overview of the application architecture.
- The `docs/api.md` file provides detailed documentation on the API endpoints available in the backend.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.