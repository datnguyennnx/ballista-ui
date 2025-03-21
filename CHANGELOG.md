# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-03-21

### Added
- Initial release of Ballista UI
- Created API configuration with endpoint definitions:
  - Load test endpoint
  - Stress test endpoint
  - API test endpoint
  - WebSocket endpoint
- Implemented TypeScript types matching backend:
  - Test configurations (Load, Stress, API)
  - Test metrics and results
  - WebSocket message types
  - API response types
- Added real-time test monitoring:
  - WebSocket connection handling
  - Progress tracking
  - Metrics display
  - Error handling
- Implemented test configuration interfaces:
  - Load test configuration
  - Stress test configuration
  - API test configuration
- Added type-safe API response handling
- Implemented error handling and display
- Added test status tracking and display

### Improved
- Enhanced type safety across the application
- Standardized API response handling
- Consistent error handling patterns
- Real-time updates for test progress
- Clean and maintainable code structure

### Technical Features
- TypeScript support with strict type checking
- Real-time WebSocket communication
- Proper error boundary implementation
- Type-safe API integration
- Modular component architecture 