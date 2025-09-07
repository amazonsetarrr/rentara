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

## Recent Updates (Latest)
- **Logo Enhancement**: Updated to improved Rentara logo design with better contrast and cleaner aesthetics
- **Documentation**: Comprehensive CHANGELOG.md maintenance with detailed feature tracking
- **Version Control**: Proper git workflow with descriptive commits and co-authoring attribution