# Tenant Management System

A multi-tenant property management SaaS platform built with React, Vite, Tailwind CSS, and Supabase.

## Features

- Multi-tenant architecture with organization-based data isolation
- Property, unit, and tenant management
- Real-time dashboard with occupancy stats
- Mobile-first responsive design
- Role-based user management
- Subscription-ready architecture

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + RLS + Real-time)
- **State Management**: Zustand
- **Authentication**: Supabase Auth
- **Deployment**: Vercel

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and add your Supabase credentials:
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── components/
│   ├── ui/           # Reusable UI components
│   ├── auth/         # Authentication components
│   ├── layout/       # Layout components
│   ├── forms/        # Form components
│   ├── dashboard/    # Dashboard components
│   └── reports/      # Reporting components
├── pages/            # Page components
├── services/         # API services
├── hooks/            # Custom hooks
├── stores/           # Zustand stores
└── utils/            # Utility functions
```

## Development Phases

- [x] Phase 1: Foundation setup
- [ ] Phase 2: Supabase configuration
- [ ] Phase 3: Authentication system
- [ ] Phase 4: Core CRUD operations
- [ ] Phase 5: Dashboard and reports
- [ ] Phase 6: Mobile optimization
- [ ] Phase 7: Production deployment
