# Testing Guide

## Test Setup

This project uses Jest with React Testing Library for testing.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Writing Tests

#### Unit Tests (lib/)
Test individual functions and utilities:

```typescript
// __tests__/lib/my-utility.test.ts
import { myFunction } from '@/lib/my-utility';

describe('myFunction', () => {
  it('should do something', () => {
    const result = myFunction('input');
    expect(result).toBe('expected output');
  });
});
```

#### Component Tests (components/)
Test React components:

```typescript
// __tests__/components/MyComponent.test.tsx
import { render, screen } from '@testing-library/react';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

#### API Route Tests (app/api/)
Test API endpoints:

```typescript
// __tests__/app/api/my-route.test.ts
import { GET } from '@/app/api/my-route/route';
import { NextRequest } from 'next/server';

describe('GET /api/my-route', () => {
  it('should return 200 with data', async () => {
    const req = new NextRequest('http://localhost:3000/api/my-route');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('result');
  });
});
```

### Test Coverage

Minimum coverage thresholds:
- Branches: 50%
- Functions: 50%
- Lines: 50%
- Statements: 50%

Coverage reports are generated in `coverage/` directory.

### CI/CD

Tests run automatically on:
- Every push to `main` or `develop`
- Every pull request

GitHub Actions workflow:
1. Lint & Type Check
2. Build Application
3. Run Tests with Coverage
4. Security Audit

### Pre-commit Hooks

Husky runs these checks before every commit:
- ESLint
- TypeScript type check
- Related tests

To bypass (NOT recommended):
```bash
git commit --no-verify -m "message"
```

### Mocking External Services

#### HubSpot API
```typescript
jest.mock('@/lib/hubspot', () => ({
  fetchDeal: jest.fn().mockResolvedValue({ id: '123', name: 'Test' }),
}));
```

#### Database
```typescript
jest.mock('@/lib/db', () => ({
  query: jest.fn().mockResolvedValue({ rows: [] }),
}));
```

#### NextAuth
```typescript
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn().mockResolvedValue({
    user: { email: 'test@farther.com', name: 'Test User' },
  }),
}));
```

### Best Practices

1. **Test behavior, not implementation** - Focus on what the code does, not how it does it
2. **Arrange, Act, Assert** - Structure tests clearly:
   - Arrange: Set up test data
   - Act: Execute the code being tested
   - Assert: Verify the results
3. **One assertion per test** - Keep tests focused and easy to debug
4. **Use descriptive test names** - `it('should return 404 when deal not found')` not `it('test 1')`
5. **Clean up after tests** - Use `afterEach()` to reset mocks and state
6. **Test edge cases** - Empty inputs, null values, boundary conditions

### Debugging Tests

```bash
# Run specific test file
npm test -- auth.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should return canonical email"

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand
```

Then open `chrome://inspect` in Chrome and click "inspect".
