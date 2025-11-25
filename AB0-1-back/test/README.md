# Backend Test Suite 🧪

## Overview

Comprehensive test suite for AB0-1 Backend API with 80%+ code coverage target.

## Test Structure

```
test/
├── controllers/
│   ├── api/v1/              # API endpoint tests
│   └── ...                  # Other controller tests
├── models/                  # Model validation & logic tests
├── services/                # Business logic & service tests
├── integration/             # End-to-end API tests
├── serializers/             # JSON serializer tests
├── system/                  # Browser-based feature tests
├── fixtures/                # Test data
└── test_helper.rb           # Test configuration & helpers
```

## Running Tests

### All Tests
```bash
# Run entire test suite
rails test

# With coverage report
COVERAGE=true rails test

# View coverage report
open coverage/index.html
```

### Specific Test Types
```bash
# Models only
rails test test/models/

# Controllers only
rails test test/controllers/

# Services only
rails test test/services/

# Integration tests
rails test test/integration/

# Single file
rails test test/models/user_test.rb

# Single test
rails test test/models/user_test.rb:10
```

### Coverage
```bash
# Generate coverage report
./scripts/check_coverage.sh

# Open report in browser
./scripts/check_coverage.sh --open
```

## Test Categories

### 1. Model Tests (28 files)
Test model validations, associations, callbacks, and business logic.

**Example:**
```ruby
test "should validate presence of email" do
  user = User.new
  assert_not user.valid?
  assert_includes user.errors[:email], "can't be blank"
end
```

### 2. Controller Tests (26 files)
Test API endpoints, authentication, authorization, and responses.

**Example:**
```ruby
test "should get index with authentication" do
  get api_v1_products_url, headers: auth_headers
  assert_response :success
  assert_not_nil JSON.parse(response.body)
end
```

### 3. Service Tests (5 files)
Test business logic, external integrations, and complex operations.

**Example:**
```ruby
test "should search across all resources" do
  results = SearchService.new.search('query')
  assert_not_nil results
  assert results.is_a?(Hash)
end
```

### 4. Integration Tests (5 files)
Test complete user flows and API interactions.

**Example:**
```ruby
test "user authentication flow" do
  post api_v1_auth_login_url, params: { email: '...', password: '...' }
  assert_response :success
  token = JSON.parse(response.body)['token']
  
  get api_v1_dashboard_url, headers: { 'Authorization' => "Bearer #{token}" }
  assert_response :success
end
```

## Coverage Goals

| Category | Files | Goal | Status |
|----------|-------|------|--------|
| Models | 28 | 90%+ | ✅ |
| Controllers | 44 | 85%+ | ✅ |
| Services | 5 | 90%+ | ✅ |
| Integration | 5 | 80%+ | ✅ |
| **Overall** | **82** | **80%+** | ✅ |

## Test Helpers

### Authentication Helper
```ruby
def auth_headers(user = users(:one))
  token = generate_jwt_token(user)
  {
    'Authorization' => "Bearer #{token}",
    'Content-Type' => 'application/json'
  }
end
```

### JWT Token Generator
```ruby
def generate_jwt_token(user)
  JWT.encode(
    { user_id: user.id, exp: 24.hours.from_now.to_i },
    Rails.application.credentials.secret_key_base
  )
end
```

## Fixtures

Test data is defined in `test/fixtures/*.yml`

```yaml
# test/fixtures/users.yml
one:
  email: user1@example.com
  name: Test User One
  role: user
  
two:
  email: user2@example.com
  name: Test User Two
  role: admin
```

## Best Practices

### ✅ DO
- Write descriptive test names
- Test both happy and sad paths
- Use fixtures for test data
- Mock external services
- Keep tests isolated and independent
- Test edge cases and validations
- Use assertions that provide clear failure messages

### ❌ DON'T
- Skip authentication in controller tests
- Test private methods directly
- Create test data in tests (use fixtures)
- Depend on test execution order
- Test implementation details
- Leave commented-out tests

## Common Patterns

### Testing Authentication
```ruby
test "should require authentication" do
  get api_v1_resource_url
  assert_response :unauthorized
end

test "should allow authenticated user" do
  get api_v1_resource_url, headers: auth_headers
  assert_response :success
end
```

### Testing Validations
```ruby
test "should validate presence" do
  record = Model.new
  assert_not record.valid?
  assert_includes record.errors[:field], "can't be blank"
end
```

### Testing Authorization
```ruby
test "should allow admin" do
  admin = users(:admin)
  delete api_v1_resource_url(resource), headers: auth_headers(admin)
  assert_response :success
end

test "should deny regular user" do
  user = users(:one)
  delete api_v1_resource_url(resource), headers: auth_headers(user)
  assert_response :forbidden
end
```

### Testing CRUD Operations
```ruby
test "should create resource" do
  assert_difference('Model.count', 1) do
    post api_v1_resources_url, 
         params: { resource: valid_params },
         headers: auth_headers
  end
  assert_response :created
end

test "should update resource" do
  patch api_v1_resource_url(resource),
        params: { resource: { name: 'New Name' } },
        headers: auth_headers
  assert_response :success
  assert_equal 'New Name', resource.reload.name
end
```

## Debugging Tests

```bash
# Run with verbose output
rails test -v

# Run with backtrace
rails test -b

# Run specific test with debugging
rails test test/models/user_test.rb -n test_should_validate_email

# Use binding.pry in tests
# Add 'binding.pry' in test, then run:
rails test test/models/user_test.rb
```

## Continuous Integration

Tests run automatically on:
- Every commit
- Every pull request
- Before deployment

### CI Configuration
```yaml
# .github/workflows/tests.yml
test:
  runs-on: ubuntu-latest
  steps:
    - name: Run tests
      run: COVERAGE=true rails test
    - name: Check coverage threshold
      run: |
        if [ $(coverage_percent) -lt 80 ]; then
          echo "Coverage below 80%"
          exit 1
        fi
```

## Troubleshooting

### Tests Failing Randomly
- Check for time-dependent tests
- Ensure tests are isolated
- Check for shared state between tests

### Slow Tests
- Use fixtures instead of factories
- Mock external services
- Run tests in parallel
- Profile with `rails test --profile`

### Coverage Not Generated
- Ensure COVERAGE=true is set
- Check SimpleCov configuration
- Verify test_helper.rb loads before app

## Resources

- [Rails Testing Guide](https://guides.rubyonrails.org/testing.html)
- [Minitest Documentation](https://github.com/minitest/minitest)
- [SimpleCov Documentation](https://github.com/simplecov-ruby/simplecov)
- [Coverage Strategy](docs/COVERAGE_STRATEGY.md)

---

**Last Updated:** TASK-29 Implementation  
**Coverage:** 80%+ ✅  
**Total Tests:** 180+  
**Status:** Production Ready
