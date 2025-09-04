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

### Changed
- Updated `AuthPage.jsx` to support both login and signup modes
- Enhanced auth page UX with seamless navigation between forms

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

### Technical Details
- Created `src/components/forms/SignupForm.jsx` with full validation
- Added bidirectional navigation between login/signup modes
- Maintains existing UI patterns and styling consistency
- Handles success/error states appropriately
- Form state isolation between modes

---

## Previous Releases

### Features in Development
- Malaysian state/city dropdown functionality
- Payment management modals and UI enhancements
- Subscription duration tracking and status indicators
- Enhanced UI testing infrastructure with Playwright