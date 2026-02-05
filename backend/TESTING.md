# Testing Guide

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm test -- --coverage
```

## Test Structure

### Unit Tests
- `__tests__/errorHandler.test.js` - Error handling middleware tests
- `__tests__/pagination.test.js` - Pagination utility tests

### Integration Tests
- `__tests__/search.test.js` - Search API endpoint tests

## Writing Tests

### Test File Naming
- Unit tests: `<module>.test.js`
- Integration tests: `<feature>.test.js`

### Example Test
```javascript
import request from 'supertest'
import app from '../src/server.js'

describe('API Endpoint', () => {
  it('should return success', async () => {
    const res = await request(app)
      .get('/api/endpoint')
      .expect(200)
    
    expect(res.body.status).toBe('success')
  })
})
```

## Coverage Goals
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

## Mocking
Use Jest mocks for external dependencies:
```javascript
jest.mock('../src/models/Model.js')
```

## Best Practices
1. Test one thing per test case
2. Use descriptive test names
3. Mock external dependencies
4. Clean up after tests
5. Test both success and error cases
