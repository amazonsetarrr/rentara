# Tenant Management Application

## Overview
The Tenant Management Application is designed to streamline the management of tenants, providing a user-friendly interface for both administrators and tenants. This application leverages a React frontend built with Vite for fast development and a Supabase backend for robust data management and authentication.

## Project Structure
The project is organized into the following main directories:

- **frontend**: Contains the React application.
  - **src**: Source files for the React application.
    - **components**: Reusable UI components.
    - **pages**: Page-level components representing different views.
    - **hooks**: Custom React hooks for state management.
    - **utils**: Helper functions for the frontend.
    - **services**: API calls to Supabase.
    - **styles**: Tailwind CSS configurations or custom styles.
    - **main.jsx**: Entry point of the React application.
  - **public**: Static assets for the frontend.
  - **vite.config.js**: Configuration for Vite.
  - **package.json**: Frontend dependencies and scripts.
  - **tailwind.config.js**: Tailwind CSS configuration.
  
- **backend**: Contains the Supabase backend setup.
  - **supabase**: Supabase-specific files.
    - **migrations**: Database migration files.
    - **policies.sql**: Security policies for the database.
    - **seed.sql**: SQL commands to seed the database.
    - **functions**: Optional Supabase Edge Functions.
  - **package.json**: Backend dependencies and scripts.
  
- **docs**: Documentation for the project.
  - **architecture.md**: Application architecture details.
  - **api.md**: API endpoints documentation.
  - **setup.md**: Guide for setting up the project locally.

- **config**: Configuration files.
  - **env.example**: Sample environment variable configuration.
  - **supabase.env.example**: Supabase environment variable configuration.

## Getting Started
To get started with the Tenant Management Application, follow the setup guide located in the `docs/setup.md` file. This guide will walk you through the installation and configuration process for both the frontend and backend.

## License
This project is licensed under the MIT License. See the LICENSE file for more details.