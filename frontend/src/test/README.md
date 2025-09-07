# DevStudio Frontend Testing Suite

This directory contains a comprehensive testing suite for the DevStudio Frontend application, covering all aspects of the application from unit tests to end-to-end testing.

## Test Structure

```
src/test/
├── setup.ts                 # Test environment setup and global mocks
├── utils.tsx                # Test utilities and helper functions
├── socketMock.ts            # Socket.io mocking utilities
├── runAllTests.ts           # Comprehensive test runner script
├── integration/             # Integration tests
│   ├── auth.integration.test.tsx
│   └── room.integration.test.tsx
└── e2e/                     # End-to-end tests
    ├── auth.e2e.test.ts
    ├── room.e2e.test.ts
    └── collaboration.e2e.test.ts
```

## Test Types

### 1. Unit Tests
Located alongside the source code in `__tests__` directories:
- **Services**: `src/services/__tests__/`
- **Components**: `src/components/**/__tests__/`
- **Hooks**: `src/hooks/__tests__/`
- **Utilities**: `src/utils/__tests__/`

### 2. Integration Tests
Located in `src/test/integration/`:
- **Authentication Flow**: Complete login/register/logout workflows
- **Room Management**: Room creation, joining, and real-time collaboration
- **File Operations**: File/folder management and collaborative editing

### 3. End-to-End Tests
Located in `src/test/e2e/`:
- **User Journeys**: Complete user workflows from login to collaboration
- **Cross-browser Testing**: Compatibility across different browsers
- **Mobile Responsiveness**: Touch interactions and responsive layouts

## Test Configuration

### Vitest Configuration (`vitest.config.ts`)
- **Environment**: jsdom for DOM testing
- **Coverage**: v8 provider with 80% threshold
- **Setup Files**: Global mocks and test utilities
- **Aliases**: Path aliases for clean imports

### Playwright Configuration (`playwright.config.ts`)
- **Browsers**: Chromium, Firefox, WebKit
- **Mobile Testing**: iOS and Android viewports
- **Dev Server**: Automatic startup for E2E tests
- **Reporting**: HTML reports with traces

## Running Tests

### Individual Test Types
```bash
# Unit tests only
npm run test

# Unit tests with coverage
npm run test:coverage

# Integration tests only
npm run test:integration

# End-to-end tests only
npm run test:e2e

# All tests
npm run test:all
```

### Test Runner Script
```bash
# Run comprehensive test suite
npx ts-node src/test/runAllTests.ts
```

## Test Utilities

### Mock Data (`utils.tsx`)
- `mockUser`: Sample user data
- `mockRoom`: Sample room data
- `mockFile`: Sample file data
- `mockApiResponse`: API response helpers

### Socket Mocking (`socketMock.ts`)
- `SocketMock`: Complete Socket.io mock implementation
- `simulateCollaborationEvents`: Helper for real-time event simulation
- `simulateConnectionIssues`: Network failure simulation

### Test Wrappers (`utils.tsx`)
- `AllTheProviders`: React context providers for testing
- `customRender`: Enhanced render function with providers
- `simulateTyping`: User interaction simulation

## Coverage Requirements

The test suite maintains the following coverage thresholds:
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

### Coverage Exclusions
- Demo components (`src/demo/**`)
- Example files (`src/examples/**`)
- Configuration files
- Type definitions

## Mocking Strategy

### Global Mocks (setup.ts)
- **localStorage/sessionStorage**: Browser storage APIs
- **ResizeObserver/IntersectionObserver**: Browser APIs
- **WebSocket**: Real-time communication
- **Monaco Editor**: Code editor component
- **Yjs**: Collaborative editing library

### Service Mocks
- **HTTP Client**: API request/response mocking
- **Socket.io**: Real-time event mocking
- **Authentication**: User session mocking

## Best Practices

### Test Organization
1. **Arrange-Act-Assert**: Clear test structure
2. **Descriptive Names**: Tests describe expected behavior
3. **Single Responsibility**: One assertion per test when possible
4. **Cleanup**: Proper mock cleanup between tests

### Component Testing
1. **User-Centric**: Test from user perspective
2. **Accessibility**: Include ARIA and keyboard navigation tests
3. **Error States**: Test error handling and edge cases
4. **Loading States**: Test async operations

### Integration Testing
1. **Real Workflows**: Test complete user journeys
2. **API Integration**: Mock realistic API responses
3. **State Management**: Test context and state updates
4. **Error Handling**: Test failure scenarios

### E2E Testing
1. **Critical Paths**: Focus on core user workflows
2. **Cross-Browser**: Test browser compatibility
3. **Mobile First**: Include mobile testing
4. **Performance**: Monitor load times and interactions

## Continuous Integration

### Pre-commit Hooks
- Run unit tests
- Check test coverage
- Lint test files

### CI Pipeline
1. **Unit Tests**: Fast feedback on code changes
2. **Integration Tests**: Verify component interactions
3. **E2E Tests**: Validate complete user workflows
4. **Coverage Reports**: Track test coverage trends

## Troubleshooting

### Common Issues

#### Test Timeouts
- Increase timeout for async operations
- Use `waitFor` for DOM updates
- Mock slow operations

#### Mock Issues
- Clear mocks between tests
- Verify mock implementations
- Check mock call counts

#### E2E Failures
- Ensure dev server is running
- Check browser compatibility
- Verify test data setup

### Debug Commands
```bash
# Run tests in watch mode
npm run test

# Run tests with UI
npm run test:ui

# Run E2E tests with UI
npm run test:e2e:ui

# Generate coverage report
npm run test:coverage
```

## Contributing

When adding new features:
1. **Write Tests First**: TDD approach when possible
2. **Update Mocks**: Add new mocks for external dependencies
3. **Integration Tests**: Add tests for new workflows
4. **E2E Coverage**: Include critical paths in E2E tests
5. **Documentation**: Update test documentation

### Test Checklist
- [ ] Unit tests for new functions/components
- [ ] Integration tests for new workflows
- [ ] E2E tests for new user journeys
- [ ] Mock updates for new dependencies
- [ ] Coverage thresholds maintained
- [ ] Documentation updated

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)