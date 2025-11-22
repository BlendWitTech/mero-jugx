# GitHub Workflow & Collaboration Guide

Complete guide for working with GitHub, Git workflow, branching strategy, and collaboration practices for Mero Jugx.

## 📋 Table of Contents

1. [Git Branching Strategy](#git-branching-strategy)
2. [Daily Workflow](#daily-workflow)
3. [Pull Request Process](#pull-request-process)
4. [Issue Management](#issue-management)
5. [Commit Guidelines](#commit-guidelines)
6. [CI/CD Pipeline](#cicd-pipeline)
7. [Code Review Process](#code-review-process)

---

## 🌳 Git Branching Strategy

### Branch Hierarchy

```
main (Production - Protected)
  └── version-control (Release Branch)
        └── develop (Development Integration)
              ├── feature/feature-name
              ├── bugfix/bug-name
              └── hotfix/hotfix-name
```

### Branch Descriptions

#### `main` Branch (Production)
- **Purpose**: Production-ready code deployed to live servers
- **Access**: Restricted - Only authorized personnel can merge
- **Rules**:
  - ✅ Can only receive merges from `version-control` branch
  - ✅ Protected branch with strict rules
  - ✅ Requires maintainer approval
  - ❌ No direct commits
  - ❌ No force pushes

#### `version-control` Branch (Release)
- **Purpose**: Staging area for production releases
- **Access**: Team members with write access
- **Rules**:
  - ✅ Receives merges from `develop`
  - ✅ Used for final testing before production
  - ✅ Can be merged to `main` via PR (requires approval)
  - ❌ No direct commits (except hotfixes)

#### `develop` Branch (Development)
- **Purpose**: Main development integration branch
- **Access**: All developers
- **Rules**:
  - ✅ Receives merges from feature/bugfix branches
  - ✅ Regular integration point for all features
  - ✅ Should always be in a deployable state
  - ✅ Can be merged to `version-control` for releases

#### Feature Branches
- **Naming**: `feature/feature-name` (e.g., `feature/user-authentication`)
- **Created from**: `develop`
- **Purpose**: Develop new features
- **Lifecycle**: Merged back to `develop` when complete

#### Bugfix Branches
- **Naming**: `bugfix/bug-name` (e.g., `bugfix/login-error`)
- **Created from**: `develop`
- **Purpose**: Fix bugs found in development
- **Lifecycle**: Merged back to `develop` when fixed

#### Hotfix Branches
- **Naming**: `hotfix/hotfix-name` (e.g., `hotfix/security-patch`)
- **Created from**: `main`
- **Purpose**: Critical production fixes
- **Lifecycle**: Merged to both `main` and `develop`

---

## 🔄 Daily Workflow

### Starting a New Feature

```bash
# 1. Ensure you're on develop and up to date
git checkout develop
git pull origin develop

# 2. Create a new feature branch
git checkout -b feature/your-feature-name

# 3. Make your changes
# ... code changes ...

# 4. Stage and commit your changes
git add .
git commit -m "feat(scope): description of changes"

# 5. Push to remote
git push origin feature/your-feature-name

# 6. Create Pull Request on GitHub
# PR: feature/your-feature-name -> develop
```

### Working on Existing Feature

```bash
# 1. Switch to your feature branch
git checkout feature/your-feature-name

# 2. Pull latest changes from develop (if needed)
git pull origin develop

# 3. Make changes and commit
git add .
git commit -m "feat(scope): additional changes"

# 4. Push updates
git push origin feature/your-feature-name
```

### Preparing for Release

```bash
# 1. Ensure develop is up to date
git checkout develop
git pull origin develop

# 2. Merge to version-control
git checkout version-control
git pull origin version-control
git merge develop
git push origin version-control

# 3. Test in staging environment (version-control branch)

# 4. When ready, create PR: version-control -> main
# (Requires maintainer approval)
```

### Hotfix Workflow

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-fix

# 2. Make the fix
# ... fix critical issue ...

# 3. Commit and push
git add .
git commit -m "fix(scope): critical production fix"
git push origin hotfix/critical-fix

# 4. Create PRs:
# - hotfix/critical-fix -> main (immediate)
# - hotfix/critical-fix -> develop (after main merge)
```

---

## 🔀 Pull Request Process

### Creating a Pull Request

1. **Push your branch to GitHub**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create PR on GitHub**
   - Go to repository on GitHub
   - Click "New Pull Request"
   - Select: `feature/your-feature-name` → `develop`
   - Fill out PR template

3. **PR Title Format**
   - Use conventional commit format: `type(scope): description`
   - Examples:
     - `feat(auth): add OAuth2 login`
     - `fix(payments): resolve eSewa verification issue`
     - `docs(readme): update installation instructions`

4. **PR Description Should Include**:
   - What changes were made
   - Why the changes were needed
   - How to test the changes
   - Screenshots (if UI changes)
   - Related issues (use `Closes #123`)

### PR Review Checklist

Before requesting review, ensure:
- [ ] Code follows project standards
- [ ] All tests pass (`npm test`)
- [ ] Linting passes (`npm run lint:check`)
- [ ] Migrations validated (`npm run migration:validate`)
- [ ] No console.log statements
- [ ] Error handling implemented
- [ ] Documentation updated (if needed)
- [ ] PR description is complete

### Review Process

1. **Automated Checks**: CI/CD pipeline runs automatically
   - Linting
   - Tests
   - Migration validation
   - Build verification

2. **Code Review**: At least one approval required
   - Reviewers check code quality
   - Suggest improvements
   - Approve when ready

3. **Merge**: Once approved and CI passes
   - Squash and merge (recommended for feature branches)
   - Delete branch after merge

---

## 🐛 Issue Management

### Creating Issues

Use GitHub issue templates:
- **Bug Report**: For reporting bugs
- **Feature Request**: For requesting new features
- **Question**: For asking questions

### Issue Labels

- `bug` - Something isn't working
- `feature` - New feature or request
- `enhancement` - Improvement to existing feature
- `documentation` - Documentation improvements
- `question` - Further information is requested
- `help wanted` - Extra attention is needed
- `good first issue` - Good for newcomers
- `priority: high` - High priority
- `priority: medium` - Medium priority
- `priority: low` - Low priority

### Issue Workflow

1. **Create Issue**: Use appropriate template
2. **Assign Labels**: Categorize the issue
3. **Assign to Developer**: If applicable
4. **Link to PR**: When work begins (`Closes #123`)
5. **Close Issue**: Automatically when PR is merged

---

## 📝 Commit Guidelines

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): subject

body (optional)

footer (optional)
```

### Commit Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes

### Examples

```bash
# Feature
git commit -m "feat(auth): add email verification"

# Bug fix
git commit -m "fix(payments): resolve eSewa timeout issue"

# Documentation
git commit -m "docs(readme): update installation steps"

# Breaking change
git commit -m "feat(api)!: change authentication endpoint

BREAKING CHANGE: /auth/login endpoint now requires MFA token"
```

### Commit Best Practices

- ✅ Write clear, descriptive commit messages
- ✅ Keep commits focused (one logical change per commit)
- ✅ Use present tense ("add feature" not "added feature")
- ✅ Reference issues: `Closes #123` or `Fixes #456`
- ❌ Don't commit large files or generated code
- ❌ Don't commit secrets or credentials
- ❌ Don't commit commented-out code

---

## 🚀 CI/CD Pipeline

### Automated Checks

The CI/CD pipeline runs on:
- Push to `develop`, `version-control`, or feature branches
- Pull requests to `develop` or `version-control`

### Pipeline Jobs

1. **Lint Code**: Runs ESLint checks
2. **Run Tests**: Executes Jest test suite
3. **Validate Migrations**: Checks database migrations
4. **Build Application**: Verifies build succeeds

### Pipeline Status

- ✅ **Green**: All checks passed
- ❌ **Red**: One or more checks failed
- ⏸️ **Yellow**: Pipeline is running

### Fixing CI Failures

1. Check the failed job logs
2. Fix the issue locally
3. Run the same command locally to verify:
   ```bash
   npm run lint:check
   npm test
   npm run migration:validate
   npm run build
   ```
4. Commit and push the fix

---

## 👥 Code Review Process

### For Authors

1. **Self-Review First**
   - Review your own code before requesting review
   - Check for obvious mistakes
   - Ensure code follows standards

2. **Request Review**
   - Assign appropriate reviewers
   - Add context in PR description
   - Respond to feedback promptly

3. **Address Feedback**
   - Make requested changes
   - Discuss if you disagree
   - Update PR when changes are made

### For Reviewers

1. **Review Promptly**
   - Aim to review within 24 hours
   - If busy, acknowledge receipt

2. **Be Constructive**
   - Provide specific, actionable feedback
   - Explain the "why" behind suggestions
   - Be respectful and professional

3. **Check Key Areas**
   - Code quality and standards
   - Security considerations
   - Performance implications
   - Test coverage
   - Documentation

4. **Approve or Request Changes**
   - Approve when code is ready
   - Request changes if improvements needed
   - Comment on specific lines for clarity

---

## ⚠️ Important Rules

### ❌ Never Do This

- **Never push directly to `main`**
- **Never commit to `main` locally**
- **Never create branches from `main`** (except hotfixes)
- **Never force push to `main` or `version-control`**
- **Never commit secrets or credentials**
- **Never skip CI checks**

### ✅ Always Do This

- **Always create feature branches from `develop`**
- **Always run `npm run migration:validate` before committing**
- **Always write descriptive commit messages**
- **Always test your changes locally**
- **Always update documentation when needed**
- **Always follow code review feedback**

---

## 🔗 Quick Links

- **Repository**: [GitHub Repository](https://github.com/BlendWitTech/mero-jugx)
- **Issues**: [GitHub Issues](https://github.com/BlendWitTech/mero-jugx/issues)
- **Pull Requests**: [GitHub PRs](https://github.com/BlendWitTech/mero-jugx/pulls)
- **Actions**: [GitHub Actions](https://github.com/BlendWitTech/mero-jugx/actions)

---

## 📚 Additional Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Git Best Practices](https://www.git-tower.com/learn/git/ebook/en/command-line/advanced-topics/best-practices)

---

**Last Updated**: 2025-11-22

