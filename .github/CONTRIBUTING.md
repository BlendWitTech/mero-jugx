# Contributing to Mero Jugx

Thank you for your interest in contributing to Mero Jugx! This document provides guidelines and instructions for contributing.

## Getting Started

1. **Read the Documentation**
   - [Developer Guide](../DEVELOPER_GUIDE.md) - Setup and development workflow
   - [Git Branching Strategy](../.git-branching-strategy.md) - Branching and workflow
   - [API Documentation](../docs/API-DOCUMENTATION.md) - API reference

2. **Set Up Development Environment**
   - Follow the [Developer Guide](../DEVELOPER_GUIDE.md) setup instructions
   - Ensure all tests pass locally
   - Verify database migrations work

3. **Find an Issue**
   - Check existing issues
   - Create a new issue if needed
   - Assign yourself to the issue

## Development Process

### 1. Create a Branch

```bash
# Update develop
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/your-feature-name

# Or bugfix branch
git checkout -b bugfix/your-bug-name
```

### 2. Make Changes

- Write clean, readable code
- Follow code style guidelines
- Add comments for complex logic
- Write tests for new features
- Update documentation

### 3. Commit Changes

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git commit -m "feat(scope): description"
git commit -m "fix(scope): description"
```

### 4. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Create a pull request:
- From your branch to `develop`
- Fill out the PR template
- Request review
- Address feedback

### 5. Code Review

- Respond to review comments
- Make requested changes
- Update PR as needed
- Wait for approval before merging

## Code Standards

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow ESLint rules
- Use Prettier for formatting
- Write self-documenting code

### NestJS (Backend)

- Follow NestJS conventions
- Use dependency injection
- Create DTOs for all inputs
- Validate inputs
- Handle errors gracefully

### React (Frontend)

- Use functional components
- Use hooks for state
- Keep components small
- Use TypeScript for props

### Database

- Always create migrations
- Never modify existing migrations
- Validate migrations before committing
- Use transactions for multi-step operations

## Testing

- Write tests for new features
- Ensure all tests pass
- Test edge cases
- Test with different user roles

## Documentation

- Update relevant documentation
- Add code comments for complex logic
- Update API docs if endpoints change
- Update user guides if features change

## Questions?

- Check existing documentation
- Ask in team chat
- Create a question issue
- Contact maintainers

---

Thank you for contributing! 🎉

