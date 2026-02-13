# Git Workflow & Strategy 🎋

This document defines the version control standards for Mero Jugx.

## 1. Branching Model

We use a simplified **Gitflow** strategy to ensure stability and continuous delivery.

### Primary Branches
| Branch | Protection | Description |
| :--- | :--- | :--- |
| **`main`** | **Locked** | Production-ready code. Deploys to Production. |
| **`develop`** | **Protected** | Integration branch. Deploys to Staging. Merge target for features. |

### Supporting Branches
*   **`feat/feature-name`**: New features. Branch off `develop`.
*   **`fix/bug-name`**: Bug fixes. Branch off `develop`.
*   **`chore/task-name`**: Maintenance/Config. Branch off `develop`.
*   **`docs/doc-name`**: Documentation updates. Branch off `develop`.

## 2. Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/). This is **mandatory**.

**Format**: `<type>(<scope>): <subject>`

### Allowed Types
*   **feat**: A new feature (`feat(auth): add google login`)
*   **fix**: A bug fix (`fix(billing): correct vat calculation`)
*   **docs**: Documentation only (`docs: update readme`)
*   **style**: White-space, formatting, missing semi-colons
*   **refactor**: Code change that neither fixes a bug nor adds a feature
*   **test**: Adding missing tests
*   **chore**: Maintenance (`chore: update dependencies`)

## 3. Pull Request (PR) Workflow

1.  **Sync**: `git checkout develop && git pull origin develop`
2.  **Branch**: `git checkout -b feat/my-feature`
3.  **Work**: Write clean, tested code.
4.  **Commit**: Use conventional commits.
5.  **Push**: `git push origin feat/my-feature`
6.  **Create PR**: Open a PR to `develop`.
    *   **Title**: Matches commit convention.
    *   **Description**: What changed, Why, and How (Screenshots for UI).
    *   **Reviewers**: Tag at least one peer.
7.  **Merge**: Squash and Merge only.

## 4. Advanced: Handling Conflicts

If `develop` has moved ahead:

```bash
git checkout develop
git pull origin develop
git checkout feat/my-feature
git rebase develop
# Start resolving conflicts in your editor
git add .
git rebase --continue
git push origin feat/my-feature --force-with-lease
```

## 5. Releases

Releases are tagged on `main`.
*   **v1.0.0**: Major release (Breaking changes).
*   **v1.1.0**: Minor release (New features).
*   **v1.1.1**: Patch release (Bug fixes).
