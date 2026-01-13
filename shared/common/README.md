# Common Shared Code

This directory contains code that is shared between frontend and backend.

## Structure

- `types/` - Shared TypeScript types, interfaces, and enums
- `constants/` - Shared constants (API endpoints, status codes, etc.)
- `utils/` - Shared utility functions (validation, formatting, etc.)

## Examples

### Types
```typescript
// shared/common/types/user.types.ts
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}
```

### Constants
```typescript
// shared/common/constants/api.constants.ts
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    LOGOUT: '/api/v1/auth/logout',
  },
  USERS: {
    LIST: '/api/v1/users',
    CREATE: '/api/v1/users',
  },
} as const;
```

### Utils
```typescript
// shared/common/utils/validation.utils.ts
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```

