# Contributing to Selorg Backend

Thank you for your interest in contributing to the Selorg Backend project! This document provides guidelines and best practices for development.

## Development Setup

### Prerequisites
- Node.js 18+ LTS
- MongoDB 6.0+
- npm 9+
- Git

### Getting Started

1. Clone the repository:
```bash
git clone <repository-url>
cd selorg_backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the development server:
```bash
npm run dev
```

## Project Structure

```
selorg_backend/
├── src/v1/
│   ├── config/         # Configuration files
│   ├── controller/     # Route handlers (thin layer)
│   ├── service/        # Business logic layer
│   ├── model/          # Mongoose schemas
│   ├── route/          # Express routes
│   ├── middleware/     # Custom middleware
│   ├── validations/    # Zod validation schemas
│   ├── utils/          # Utility functions
│   ├── auths/          # Authentication helpers
│   └── view/           # EJS templates
├── tests/              # Test files
├── app.js              # Express app setup
├── server.js           # Server bootstrap
└── package.json        # Dependencies
```

## Coding Standards

### Architecture Principles

1. **Service Layer Pattern**
   - All business logic must be in services (`src/v1/service/`)
   - Controllers should only handle HTTP concerns
   - Services should be framework-agnostic

2. **Validation First**
   - All endpoints must have Zod validation schemas
   - Validate at the route level using middleware
   - Never trust user input

3. **Error Handling**
   - Use `ApiError` class for expected errors
   - Let middleware handle error responses
   - Always log errors with context

### File Naming Conventions

- Controllers: `*Controller.js` (e.g., `userController.js`)
- Services: `*Service.js` (e.g., `userService.js`)
- Models: `*Model.js` (e.g., `userModel.js`)
- Routes: `*Route.js` (e.g., `userRoute.js`)
- Validation: `*Validation.js` (e.g., `userValidation.js`)

### Code Style

- Use `const` and `let` (never `var`)
- Use async/await (avoid callbacks)
- Use arrow functions for utilities
- Use descriptive variable names
- Add JSDoc comments to all exported functions
- Keep functions small and focused (< 50 lines)

### Example Service

```javascript
const { ApiError } = require("../utils/apiError");
const Model = require("../model/someModel");

/**
 * ServiceName - Brief description
 */
class ServiceName {
  /**
   * Method description
   * @param {string} param1 - Parameter description
   * @returns {Promise<Object>} Return value description
   */
  async methodName(param1) {
    // Validation
    if (!param1) {
      throw new ApiError(400, "param1 is required");
    }

    // Business logic
    const result = await Model.findOne({ field: param1 });
    
    if (!result) {
      throw new ApiError(404, "Resource not found");
    }

    return result;
  }
}

module.exports = new ServiceName();
```

### Example Controller

```javascript
const someService = require("../service/someService");
const { success, failure } = require("../utils/apiResponse");

/**
 * Controller function description
 */
exports.functionName = async (req, res) => {
  try {
    const result = await someService.methodName(req.params.id);
    
    return success(res, {
      message: "Success message",
      data: result
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to perform action"
    });
  }
};
```

## Git Workflow

### Branch Naming
- Feature: `feature/feature-name`
- Bug fix: `fix/bug-description`
- Hotfix: `hotfix/critical-bug`
- Refactor: `refactor/component-name`

### Commit Messages
Follow conventional commits:
```
type(scope): brief description

Longer description if needed

type: feat, fix, docs, style, refactor, test, chore
```

Examples:
```
feat(auth): add OTP expiry validation
fix(cart): calculate GST correctly
docs(api): update README with new endpoints
refactor(order): extract pricing logic to service
```

## Testing

### Writing Tests

1. **Unit Tests** - Test individual functions
2. **Integration Tests** - Test API endpoints
3. **Service Tests** - Test business logic

### Running Tests

```bash
npm test                  # Run all tests
npm test -- --coverage    # With coverage report
npm test -- --watch       # Watch mode
```

### Test Structure

```javascript
describe('ServiceName', () => {
  describe('methodName', () => {
    it('should return expected result', async () => {
      // Arrange
      const input = { };
      
      // Act
      const result = await service.methodName(input);
      
      // Assert
      expect(result).toBeDefined();
    });

    it('should throw error for invalid input', async () => {
      await expect(service.methodName(null))
        .rejects
        .toThrow('param1 is required');
    });
  });
});
```

## Pull Request Process

1. **Before Submitting**
   - Run tests: `npm test`
   - Check linting: `npm run lint` (if configured)
   - Update documentation if needed
   - Add/update tests for your changes

2. **PR Description**
   - Clear title describing the change
   - Link to related issues
   - List of changes made
   - Screenshots/examples if applicable

3. **Review Process**
   - At least one approval required
   - All tests must pass
   - No merge conflicts

## Common Tasks

### Adding a New Feature

1. Create service in `src/v1/service/`
2. Create validation schema in `src/v1/validations/`
3. Create controller in `src/v1/controller/`
4. Create route in `src/v1/route/`
5. Register route in `app.js`
6. Add tests
7. Update README

### Adding a New Model

1. Create model in `src/v1/model/`
2. Add indexes for performance
3. Add virtuals if needed
4. Document schema in comments
5. Update relevant services

## Security Guidelines

- Never commit sensitive data (.env files, keys, secrets)
- Always validate and sanitize user input
- Use parameterized queries (Mongoose does this)
- Implement proper authorization checks
- Log security events
- Keep dependencies updated

## Performance Considerations

- Use `.lean()` for read-only queries
- Add indexes for frequently queried fields
- Implement pagination for list endpoints
- Use caching for static/slow data
- Avoid N+1 queries (use populate wisely)

## Questions or Issues?

- Check existing documentation
- Search closed issues
- Open a new issue with:
  - Clear description
  - Steps to reproduce
  - Expected vs actual behavior
  - Environment details

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Follow project guidelines

Thank you for contributing to Selorg Backend!

