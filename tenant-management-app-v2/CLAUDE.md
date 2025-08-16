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