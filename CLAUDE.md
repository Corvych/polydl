# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands
- Build the app: `npm run build`
- Run the app on Android: `npx react-native run-android`
- Run the app on iOS: `npx react-native run-ios`
- Run tests: `npm test -- --watchAll=false`
- Run a single test: `npm test -- -t "test name"`
- Lint code: `npm run lint`
- Format code: `npm run format`

## Mobile App Structure
- **Mobile App** (`~/mobile`): Contains React Native screens, components, and context providers
- Key directories:
  - `mobile/app/(app)`: Main React Native app structure
  - `mobile/utils`: Shared utilities and custom hooks
  - `mobile/assets`: Images and assets
  - `mobile/navigation`: Navigation configuration

## Technologies & Libraries
- React Native (Expo managed workflow)
- React Navigation for routing
- Context API for state management
- Axios for API calls
- Jest + React Testing Library for testing

## Backend Integration
- REST API with JWT tokens for authentication
- API endpoints defined in `services/api.js`
- Environment variables handled via `config.js` or `.env` files

## Code Quality
- ESLint configured with Airbnb base rules
- Pre-commit hooks for linting/formatting
- Custom patterns for error handling and API responses

## Critical Files
- `mobile/app/(app)/index.tsx` (main entry point)
- `mobile/navigation/AppNavigator.tsx` (navigation setup)
- `services/api.js` (API client)
- `store(ContextAPI).js` (state management)

## Verification
After implementing changes:
1. Run `npm test` to verify functionality
2. Test navigation flow in Expo
3. Check API call responses