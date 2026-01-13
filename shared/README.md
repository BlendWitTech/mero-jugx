# Shared Code Directory

This directory contains shared code that can be used across both frontend and backend applications.

## Structure

```
shared/
├── frontend/          # Frontend-specific shared code
│   ├── components/   # React components (UI, forms, feedback, etc.)
│   ├── hooks/        # React hooks
│   ├── utils/        # Frontend utilities
│   ├── services/     # Frontend services
│   ├── types/        # Frontend TypeScript types
│   └── constants/    # Frontend constants
│
├── backend/          # Backend-specific shared code
│   ├── utils/        # Backend utilities
│   ├── types/        # Backend TypeScript types
│   ├── constants/    # Backend constants
│   ├── decorators/   # Custom decorators
│   └── guards/       # Custom guards
│
└── common/           # Truly shared code (used by both frontend and backend)
    ├── types/        # Shared TypeScript types/interfaces
    ├── constants/    # Shared constants (API endpoints, status codes, etc.)
    └── utils/        # Shared utility functions
```

## Usage

### Frontend

```typescript
// Import from frontend shared
import { Button, Input, Card } from '@shared/frontend';
import { usePagination } from '@shared/frontend/hooks';

// Import from common shared
import { ApiResponse, UserRole } from '@shared/common/types';
import { API_ENDPOINTS } from '@shared/common/constants';
```

### Backend

```typescript
// Import from backend shared
import { validateEmail } from '@shared/backend/utils';

// Import from common shared
import { ApiResponse, UserRole } from '@shared/common/types';
import { API_ENDPOINTS } from '@shared/common/constants';
```

## Path Aliases

### Frontend (`frontend/tsconfig.json` and `frontend/vite.config.ts`)
- `@shared/*` → `../shared/*`

### Backend (`tsconfig.json`)
- `@shared/*` → `shared/*` (to be configured)

## Best Practices

1. **Frontend-specific code** → `shared/frontend/`
2. **Backend-specific code** → `shared/backend/`
3. **Code used by both** → `shared/common/`
4. **Avoid circular dependencies** - Common should not depend on frontend/backend
5. **Keep it minimal** - Only truly reusable code should be in shared

