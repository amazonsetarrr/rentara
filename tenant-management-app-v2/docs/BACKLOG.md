# Development Backlog

## High Priority Issues

### Security Vulnerabilities
- [ ] **Password hashing weakness**: Replace SHA256 with proper bcrypt hashing in all schema files
- [ ] **Hardcoded credentials**: Remove hardcoded email `zainiemel@gmail.com` from `clean-system-owner-schema.sql:228`
- [ ] **Session management**: Implement proper token validation for custom session system
- [ ] **RLS bypass potential**: Review system owner policies to prevent unauthorized data access

### Architecture Inconsistencies
- [ ] **Mixed authentication systems**: Decide between integrating with Supabase Auth or separate auth system
- [ ] **Conflicting approaches**: Consolidate three different schema implementations into one coherent approach
- [ ] **Missing error handling**: Add proper network failure handling in services

## Medium Priority Issues

### Rent Collection System - Next Features
- [ ] **Record Payment Modal**: Allow users to record payments with receipt upload
- [ ] **Generate Monthly Rent**: Auto-create rent payments from schedules
- [ ] **Security Deposit Management**: Track deposits, deductions, and refunds
- [ ] **Payment Reminders**: Email/SMS automation for due/overdue payments
- [ ] **Receipt Generation**: PDF receipt generation and emailing
- [ ] **Late Fee Automation**: Auto-apply late fees based on rent schedules
- [ ] **Payment Import/Export**: CSV import/export for bulk operations
- [ ] **Payment Analytics**: Advanced reporting and trends
- [ ] **Multi-currency Support**: Handle different currencies beyond MYR

### Code Quality
- [ ] **Missing TypeScript**: Add TypeScript support and configure type checking
- [ ] **Inconsistent patterns**: Standardize error handling approaches across components
- [ ] **Dead code**: Remove unused functions and imports after ESLint fixes

### Database Schema
- [ ] **RLS conflicts**: Resolve conflicting policies between multiple schema files
- [ ] **Missing indexes**: Add performance indexes for large datasets
- [ ] **No migration strategy**: Create clear upgrade path between schema versions

## Low Priority Issues

### Code Cleanup
- [ ] **Console logging**: Remove console.log statements from production code
- [ ] **Code comments**: Add proper documentation where needed
- [ ] **Component optimization**: Review component re-render patterns

## Rent Collection Database Setup
- [ ] **Run rent-collection-schema.sql**: Execute in Supabase to enable payment features
- [ ] **Configure payment methods**: Add organization-specific payment options
- [ ] **Set up recurring rent schedules**: Configure automatic rent generation
- [ ] **Test payment workflows**: End-to-end payment recording and tracking

## Notes
- ESLint errors fixed as first priority
- Security issues should be addressed before production deployment
- Database schema needs to be consolidated into single approach
- Rent collection system foundation complete, ready for feature additions