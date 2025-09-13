# Changelog

All notable changes to the Tenant Management App v2 will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Organization creation functionality on authentication page
- New `SignupForm` component for user registration with organization setup
- Mode switching between login and signup forms on auth page
- Comprehensive form validation for organization signup
- Integration with existing `authService.signUpWithOrganization()` method
- **[BRANDING]** Official Rentara logo and branding assets
  - Added custom Rentara logo (`src/assets/logo.png`) 
  - Added custom Rentara icon (`src/assets/icon.png`)
  - Updated browser favicon to use custom Rentara icon
  - Replaced placeholder icons throughout the application
  - **[UPDATED]** Improved logo design with better contrast and cleaner aesthetics
- **[SUPERADMIN]** Complete SuperAdmin portal system
  - Full SuperAdmin authentication and authorization
  - SuperAdmin dashboard with system-wide metrics
  - Comprehensive user management across all organizations
  - Organization management interface
  - SuperAdmin feature backlog documentation

### Changed
- Updated `AuthPage.jsx` to support both login and signup modes
- Enhanced auth page UX with seamless navigation between forms  
- **[BRANDING]** Updated application branding throughout UI
  - Replaced generic building icons with custom Rentara icon in sidebar
  - Updated auth page left panel to display full Rentara logo
  - Updated mobile logo display with custom Rentara icon
  - Updated organization creation button icon with Rentara branding
- **[REFACTOR]** System Owner → SuperAdmin terminology change
  - Renamed all SystemOwner* components to SuperAdmin*
  - Updated file structure and imports across codebase
  - Clarified role terminology for property management context

### Fixed
- **[MAJOR]** Organization creation button on login/auth page now functional
  - Previously was a non-functional button with no click handler
  - Now properly switches to signup form and handles organization creation
  - Users can now create organizations directly from the auth page
  - Verified with Playwright testing for complete functionality
- **[UI]** "Create your organization" button alignment and centering
  - Fixed off-centered icon and text in the organization creation button
  - Added proper flex alignment classes (`flex items-center justify-center`)
  - Button content now perfectly centered both horizontally and vertically
- **[CRITICAL]** SuperAdmin metrics display
  - Fixed broken metrics showing "-" for all counts
  - Organizations metric now displays actual count
  - Added fallback queries for database column compatibility
  - Enhanced error handling for missing tables

### Technical Details
- Created `src/components/forms/SignupForm.jsx` with full validation
- Added bidirectional navigation between login/signup modes
- Maintains existing UI patterns and styling consistency
- Handles success/error states appropriately
- Form state isolation between modes
- **[SUPERADMIN]** Complete SuperAdmin infrastructure
  - `src/pages/SuperAdminDashboard.jsx` - System overview with metrics
  - `src/pages/SuperAdminUsers.jsx` - Comprehensive user management
  - `src/stores/superAdminStore.js` - Centralized state management
  - `src/services/superAdminAuth.js` - Authentication service
  - `database/migrations/004_rename_system_owner_to_super_admin.sql` - Schema migration
  - Backward compatibility for database column names (`is_super_admin`/`is_system_owner`)
  - Real-time search and filtering capabilities
  - Role-based access controls and security measures

---

## Previous Releases

### Features in Development
- Malaysian state/city dropdown functionality
- Payment management modals and UI enhancements
- Subscription duration tracking and status indicators
- Enhanced UI testing infrastructure with Playwright