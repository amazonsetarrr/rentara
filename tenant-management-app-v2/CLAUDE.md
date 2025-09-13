# Claude Configuration for Tenant Management App

## Project Information
- **Project**: Tenant Management App v2
- **Framework**: React 19.1.1 with Vite
- **Testing**: Vitest with React Testing Library
- **Styling**: Tailwind CSS
- **Backend**: Supabase
- **Deployment**: Vercel

## Known Issues & Solutions

### React 19 Dependency Conflicts
**Issue**: @testing-library/react has peer dependency conflicts with React 19
**Solution**: 
- Use @testing-library/react@^16.3.0 with `--legacy-peer-deps`
- Ensure `.npmrc` contains `legacy-peer-deps=true` for Vercel deployments
- This prevents npm install failures on Vercel

### Build Commands
- **Development**: `npm run dev`
- **Build**: `npm run build` 
- **Lint**: `npm run lint`
- **Test**: `npm run test`
- **Test Coverage**: `npm run test:coverage`

## Deployment Notes
- Vercel deployments require `.npmrc` with `legacy-peer-deps=true` due to React 19 compatibility issues
- Always test builds locally before pushing to avoid deployment failures

## Dependencies Management
When updating dependencies:
1. Check React version compatibility
2. Use `--legacy-peer-deps` for React Testing Library updates
3. Test build locally before committing

## Implemented Features

### Authentication & User Management
- **Organization Creation**: Full signup flow with organization setup on authentication page
- **Login/Signup Mode Switching**: Seamless navigation between login and registration forms
- **Form Validation**: Comprehensive client-side validation for user registration and organization setup
- **Auth Integration**: Connected with Supabase `authService.signUpWithOrganization()` method
- **Error Handling**: Proper error states and user feedback during authentication

### Branding & UI
- **Official Rentara Branding**: Complete brand identity implementation
  - Custom Rentara logo (`src/assets/logo.png`) with improved design and better contrast
  - Custom Rentara icon (`src/assets/icon.png`) for smaller UI elements
  - Browser favicon updated with Rentara branding (`public/favicon.png`)
  - Sidebar logo replacement (removed generic building icons)
  - Auth page branding with full logo display on left panel
  - Mobile responsive logo display
  - Organization creation button with branded icon

### Malaysian Localization
- **State/City Dropdowns**: Malaysian-specific location selection functionality
- **Regional Data**: Integrated Malaysian administrative divisions

### Payment & Subscription Management  
- **Subscription Duration Tracking**: Enhanced subscription status monitoring
- **Payment UI Enhancements**: Improved payment management interface
- **Duration Status Indicators**: Visual feedback for subscription states

### Technical Infrastructure
- **Component Architecture**: 
  - `SignupForm.jsx` - Complete user registration with organization setup
  - Enhanced `AuthPage.jsx` with dual-mode functionality
  - Updated `Sidebar.jsx` with branded elements
- **State Management**: Proper form state isolation between login/signup modes
- **Testing**: Playwright integration for end-to-end functionality verification
- **Build Optimization**: Maintained performance while adding new features

### UI/UX Improvements
- **Button Alignment**: Fixed centering issues in "Create your organization" button
- **Responsive Design**: Mobile-first approach with proper breakpoints
- **Visual Consistency**: Maintained design system across all new components
- **User Flow**: Intuitive navigation between authentication states

## SuperAdmin Portal Configuration

### Access Credentials & URLs
- **Live Portal**: https://rentara-v2.vercel.app/superadmin/dashboard
- **Login URL**: https://rentara-v2.vercel.app/superadmin/auth
- **SuperAdmin Credentials**: 
  - **Email**: `admin@rentara.com`
  - **Password**: `admin123`
- **Portal Status**: ✅ Active and operational

### SuperAdmin Features
- **Dashboard**: Organization metrics, user counts, system overview
- **Organization Management**: Create, activate/suspend, view organizations (4 active orgs)
- **User Management**: Cross-organization user administration with search, filters, and actions
- **Navigation**: Seamless routing between Dashboard, Users, and Organizations sections

### Database Schema Notes
- **Column Compatibility**: Code supports both `is_super_admin` and `is_system_owner` columns for backward compatibility
- **Migration Available**: `database/migrations/004_rename_system_owner_to_super_admin.sql`
- **Table Dependencies**: Graceful handling of missing `properties` and `tenants` tables
- **Audit Logging**: SuperAdmin actions logged to `super_admin_audit_log` table

### Implementation Details
- **Authentication**: Uses Supabase auth with `is_super_admin` flag validation
- **State Management**: `useSuperAdminStore` with comprehensive user and organization management
- **Error Handling**: Fallback metrics, graceful table missing scenarios
- **Security**: Protected routes, action logging, impersonation capabilities

### Available Routes
- `/superadmin/auth` - Authentication portal
- `/superadmin/dashboard` - Main dashboard with organization management
- `/superadmin/users` - Comprehensive user management across all organizations
- `/superadmin/organizations` - Advanced organization management (placeholder)

### Recent Updates (Latest)
- **SuperAdmin Refactoring**: Renamed from "System Owner" to "SuperAdmin" for clarity in property management context
- **Metrics Fixed**: Resolved "-" display issue with backward-compatible database queries
- **User Management**: Added comprehensive user administration with search, filters, and bulk actions
- **Documentation**: Created detailed feature backlog with 6 high-priority enhancements
- **Logo Enhancement**: Updated to improved Rentara logo design with better contrast and cleaner aesthetics
- **Version Control**: Proper git workflow with descriptive commits and co-authoring attribution