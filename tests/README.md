# Guestbook Contract Test Suite

This directory contains a comprehensive test suite for the Guestbook smart contract using Clarinet and Vitest.

## Overview

The test suite provides thorough coverage of all contract functionality including:

- **Basic Operations**: Message posting, liking, and reading
- **Edge Cases**: Special characters, unicode, boundary values, error conditions
- **Performance Testing**: High-volume operations, scalability, gas cost analysis
- **State Consistency**: Multi-user scenarios, concurrent operations
- **Helper Utilities**: Reusable test patterns and data generators

## Test Files

### Core Tests
- `guestbook.test.ts` - Main contract functionality tests
- `guestbook-edge-cases.test.ts` - Edge cases and stress testing
- `guestbook-performance.test.ts` - Performance and gas analysis

### Utilities
- `test-helpers.ts` - Helper functions and utilities for testing
- `setup-verification.test.ts` - Verifies test environment setup

## Running Tests

### Prerequisites
- Node.js (v18 or later)
- Clarinet installed and configured
- All dependencies installed (`npm install`)

### Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui

# Run specific test file
npm test guestbook.test.ts

# Run setup verification only
npm test setup-verification
```

### Test Environment

The tests run in a Clarinet simnet environment with:
- Isolated blockchain state for each test
- Pre-configured test accounts (deployer, wallet_1, wallet_2, etc.)
- Automatic contract deployment and cleanup
- Custom Clarity value matchers for assertions

## Test Structure

### Basic Test Pattern
```typescript
describe("Feature Name", () => {
  beforeEach(() => {
    // Reset simnet state
    simnet.setEpoch("3.0");
  });

  it("should test specific behavior", () => {
    // Arrange
    const content = "Test message";
    
    // Act
    const response = simnet.callPublicFn(
      "guestbook",
      "post-message",
      [Cl.stringUtf8(content)],
      wallet1
    );
    
    // Assert
    expect(response.result).toBeOk(Cl.uint(1));
  });
});
```

### Using Test Helpers
```typescript
import { GuestbookTestHelpers, TestDataGenerator } from './test-helpers';

const helpers = new GuestbookTestHelpers(accounts);

// Post a message
const messageId = helpers.postMessage("Hello World", wallet1);

// Like a message
const success = helpers.likeMessage(messageId, wallet2);

// Verify message details
const isValid = helpers.verifyMessage(
  messageId, 
  wallet1, 
  "Hello World", 
  1 // expected likes
);
```

## Test Coverage

The test suite covers:

### Contract Functions
- ✅ `post-message` - All scenarios including edge cases
- ✅ `like-message` - Success, failure, and duplicate prevention
- ✅ `get-message` - Message retrieval and validation
- ✅ `get-last-message-id` - ID tracking verification
- ✅ `has-user-liked` - Like status checking

### Error Conditions
- ✅ Non-existent message operations
- ✅ Duplicate like attempts
- ✅ Invalid input handling
- ✅ Boundary value testing

### Performance Scenarios
- ✅ High-volume message posting
- ✅ Multiple users liking messages
- ✅ Concurrent operation simulation
- ✅ Gas cost analysis
- ✅ Memory efficiency testing

### Data Integrity
- ✅ Unicode and special character handling
- ✅ Maximum length message testing
- ✅ State consistency across operations
- ✅ Multi-user interaction patterns

## Contract Deployment

The tests expect the guestbook contract to be deployed in the simnet environment. The contract deployment is handled automatically by the Clarinet testing framework based on the `Clarinet.toml` configuration.

If tests fail with "Contract does not exist" errors, verify:
1. `Clarinet.toml` is properly configured
2. Contract syntax is valid (`clarinet check`)
3. Contract file exists at `contracts/guestbook.clar`

## Troubleshooting

### Common Issues

**Tests fail with "Contract does not exist"**
- Ensure `clarinet check` passes
- Verify `Clarinet.toml` contract configuration
- Check that contract file exists and has correct syntax

**Import errors in test files**
- Verify all dependencies are installed
- Check TypeScript configuration in `tsconfig.json`
- Ensure Clarinet SDK is properly installed

**Slow test execution**
- Consider reducing test data size for performance tests
- Use `test:watch` for faster feedback during development
- Run specific test files instead of full suite

### Debug Mode

To debug failing tests:
1. Add `console.log` statements in test files
2. Use `test:watch` for immediate feedback
3. Run individual test files to isolate issues
4. Check simnet state between test operations

## Contributing

When adding new tests:
1. Follow existing naming conventions
2. Use descriptive test names that explain the scenario
3. Include both positive and negative test cases
4. Add appropriate setup and cleanup in `beforeEach`
5. Use helper functions for common operations
6. Document complex test scenarios

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Clarity**: Test names should clearly describe what is being tested
3. **Coverage**: Test both success and failure scenarios
4. **Performance**: Include performance tests for critical operations
5. **Maintainability**: Use helper functions to reduce code duplication
6. **Documentation**: Comment complex test logic and edge cases
