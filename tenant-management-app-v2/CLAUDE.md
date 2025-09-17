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

### Advanced Business Management Systems
- **Property Management System**:
  - Complete CRUD operations for properties with detailed forms
  - Property details modal with comprehensive information display
  - Edit property functionality with validation
  - Unit management with property association

- **Tenant Management System**:
  - Tenant registration and profile management
  - Tenant-unit assignment and tracking
  - Comprehensive tenant information storage

- **Payment Management System**:
  - Multiple payment recording methods (AddPaymentModal, RecordPaymentModal)
  - Payment details viewing with transaction history
  - Payment analytics and reporting capabilities
  - Integration with rent generation system

- **Rent Management System**:
  - Automated rent generation (GenerateRentModal)
  - Rent scheduling system (AddRentScheduleModal)  
  - Recurring payment setup and management
  - Rent tracking and payment status monitoring

- **Reporting & Analytics**:
  - Payment analytics dashboard (PaymentAnalytics component)
  - Business intelligence and financial reporting
  - Data visualization for management insights

### Technical Infrastructure
- **Component Architecture** (40+ components organized by functionality):
  
  **Pages (13 components):**
  - `AuthPage.jsx` - Enhanced dual-mode authentication (login/signup)
  - `Dashboard.jsx` - Main tenant management dashboard
  - `PropertiesPage.jsx`, `UnitsPage.jsx`, `TenantsPage.jsx` - Core management pages
  - `PaymentsPage.jsx`, `ReportsPage.jsx`, `SettingsPage.jsx` - Business functionality
  - `SuperAdminAuth.jsx`, `SuperAdminDashboard.jsx`, `SuperAdminUsers.jsx` - SuperAdmin portal
  - `NotFoundPage.jsx`, `SuperAdminNotFound.jsx` - 404 error handling
  
  **Forms (9 components):**
  - `SignupForm.jsx` - Complete user registration with organization setup
  - `LoginForm.jsx` - User authentication form
  - `AddPropertyForm.jsx`, `AddUnitForm.jsx`, `AddTenantForm.jsx` - Entity creation
  - `EditPropertyForm.jsx` - Property modification
  - `QuickPaymentForm.jsx` - Streamlined payment recording from dashboard
  
  **Modals (8 components):**
  - `PropertyDetailsModal.jsx` - Property information display
  - `AddPaymentModal.jsx`, `RecordPaymentModal.jsx` - Payment management
  - `ViewPaymentDetailsModal.jsx` - Payment information display
  - `GenerateRentModal.jsx`, `AddRentScheduleModal.jsx` - Rent management
  - `AddOrganizationModal.jsx` - Organization creation
  
  **UI Components (10 components):**
  - `Button.jsx`, `Card.jsx`, `Input.jsx`, `Select.jsx` - Basic UI elements
  - `Table.jsx`, `Modal.jsx`, `Spinner.jsx` - Complex UI components
  - `Badge.jsx`, `SubscriptionDuration.jsx` - Status indicators
  
  **Layout & Navigation (4 components):**
  - `Layout.jsx` - Main application layout wrapper
  - `Header.jsx`, `Sidebar.jsx` - Navigation elements with Rentara branding
  
  **Authentication & Security (3 components):**
  - `ProtectedRoute.jsx` - Route protection for authenticated users
  - `SuperAdminProtectedRoute.jsx` - SuperAdmin route protection
  - `ErrorBoundary.jsx` - React error boundary with logging
  
  **Specialized Components (3 components):**
  - `LogMonitor.jsx` - Development debugging and logging interface
  - `PaymentAnalytics.jsx` - Business intelligence and reporting

- **State Management**: Zustand-based stores with proper isolation
  - `authStore.js` - User authentication and session management
  - `superAdminStore.js` - SuperAdmin functionality and user management
- **Testing**: Playwright integration for end-to-end functionality verification
- **Build Optimization**: Maintained performance while adding extensive feature set

### UI/UX Improvements
- **Button Alignment**: Fixed centering issues in "Create your organization" button
- **Responsive Design**: Mobile-first approach with proper breakpoints across 40+ components
- **Visual Consistency**: Maintained design system across all components and modals
- **User Flow**: Intuitive navigation between authentication states and business functions
- **Error Handling**: User-friendly 404 pages with helpful navigation options
- **Development Tools**: LogMonitor component with keyboard shortcuts (Ctrl+Shift+L)
- **Loading States**: Comprehensive spinner implementations for all async operations

## SuperAdmin Portal Configuration

### Access Credentials & URLs
- **Live Portal**: https://rentara-v2.vercel.app/superadmin/dashboard
- **Login URL**: https://rentara-v2.vercel.app/superadmin/auth
- **SuperAdmin Credentials**: 
  - **Email**: `admin@rentara.com`
  - **Password**: `admin123`
- **Portal Status**: ✅ Active and operational

### SuperAdmin Features
- **Dashboard**: Organization metrics, user counts, system overview with real-time data
- **Organization Management**: Create, activate/suspend, view organizations with comprehensive controls
- **User Management**: Cross-organization user administration with search, filters, bulk actions, and impersonation capabilities
- **Navigation**: Seamless routing between Dashboard, Users, and Organizations sections
- **Error Handling**: Dedicated 404 error page for SuperAdmin routes
- **Analytics**: System-wide metrics with backward-compatible database queries
- **Audit Logging**: All SuperAdmin actions logged to `super_admin_audit_log` table

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

### Error Handling & User Experience
- **404 Error Pages**: Comprehensive error handling for non-existent routes
  - `NotFoundPage.jsx` - User-friendly 404 page for tenant portal with navigation options
  - `SuperAdminNotFound.jsx` - Specialized 404 page for SuperAdmin portal
  - Catch-all routes (`*`) implemented in both App.jsx and SuperAdminApp.jsx
  - Display current requested URL and provide helpful navigation links
  - Consistent styling with existing UI design system
- **Error Boundary**: React error boundary with logging and debugging capabilities
- **Logging System**: Comprehensive application logging with LogMonitor component

### Recent Updates (Latest)
- **Loki/Grafana Integration**: Centralized logging and monitoring system
  - Added `LokiTransport.js` for shipping logs to Grafana Loki
  - Enhanced Logger service with remote logging capabilities
  - Batching, retry logic, and environment-specific configuration
  - LogMonitor component with Loki status monitoring and controls
  - Comprehensive setup documentation in `docs/LOKI_SETUP.md`
  - Pre-built Grafana dashboard for application monitoring
  - Environment variables for secure configuration management
  - Integration eliminates need for console debugging and provides real-time monitoring

- **Record Payment Quick Action**: Streamlined payment recording from dashboard (commit `a226541`)
  - Added `QuickPaymentForm.jsx` with smart tenant/payment selection
  - Modal-based workflow consistent with other quick actions
  - Real-time payment details and remaining balance display
  - Comprehensive validation with Malaysian Ringgit (RM) currency formatting
  
- **404 Error Handling System**: Complete error handling for non-existent routes (commit `3580498`)
  - Added `NotFoundPage.jsx` and `SuperAdminNotFound.jsx` components
  - Implemented catch-all routes in both tenant and SuperAdmin portals
  - User-friendly error messages with navigation options
  
- **SuperAdmin User Management Enhancement**: Comprehensive user administration (commit `eeea773`)
  - Added `SuperAdminUsers.jsx` page with search, filters, and bulk actions
  - Cross-organization user management capabilities
  - Enhanced `superAdminStore.js` with user management methods
  - Navigation between Dashboard, Users, and Organizations sections
  
- **SuperAdmin Terminology Refactoring**: Clarity improvements (commit `960961a`)
  - Renamed from "System Owner" to "SuperAdmin" across entire codebase
  - Updated all SystemOwner* components to SuperAdmin*
  - Clarified role terminology for property management context
  
- **Advanced Business Features**: Complete property management system
  - Property, tenant, and unit management with CRUD operations
  - Payment management system with multiple recording methods
  - Rent generation and scheduling system
  - Payment analytics and business intelligence reporting
  
- **UI/UX Enhancements**: 
  - Logo enhancement with improved Rentara branding (commit `b4e62af`)
  - Responsive design improvements across all components
  - Error boundary implementation with logging capabilities
  - LogMonitor component for development debugging
  
- **Technical Infrastructure**: 
  - Expanded to 40+ components across 6 functional categories
  - Enhanced state management with Zustand stores
  - Comprehensive modal and form systems
  - Version control with descriptive commits and co-authoring attribution

## Feature Completion Status

### ✅ Fully Implemented & Active
- **Authentication System**: Complete login/signup with organization creation
- **SuperAdmin Portal**: Dashboard, user management, organization controls
- **Property Management**: Full CRUD operations with detailed modals
- **Tenant Management**: Complete tenant lifecycle management
- **Payment System**: Multiple payment methods, analytics, and quick recording from dashboard
- **Rent Management**: Automated generation and scheduling
- **Error Handling**: 404 pages and React error boundaries
- **UI Component Library**: 40+ reusable components
- **Branding**: Complete Rentara brand implementation
- **Malaysian Localization**: State/city dropdown functionality
- **Dashboard Quick Actions**: Add Property, Unit, Tenant, and Record Payment
- **Centralized Logging**: Loki/Grafana integration with real-time monitoring

### 🚧 In Progress / Planned Enhancements
- **Advanced Analytics**: Enhanced reporting dashboards
- **Mobile Optimization**: Further responsive design improvements  
- **Testing Coverage**: Expanded Playwright test suites
- **Performance Optimization**: Component lazy loading and caching

### 📊 Current Architecture Scale
- **13 Pages**: Complete user journeys for tenant and SuperAdmin portals
- **40+ Components**: Organized across 6 functional categories
- **9 Forms**: Comprehensive data entry and validation (including QuickPaymentForm)
- **8 Modals**: Rich interaction patterns
- **10 UI Components**: Reusable design system
- **2 Zustand Stores**: Centralized state management
- **Multiple Services**: Authentication, logging, business logic