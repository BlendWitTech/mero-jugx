# Shared Components & Utilities

This directory contains reusable components, hooks, and utilities that can be used throughout the application.

## Structure

```
shared/frontend/
├── components/          # Reusable UI components
│   ├── ui/            # Basic UI primitives (Button, Input, Modal, etc.)
│   ├── forms/         # Form components
│   ├── data-display/  # Data display components (Table, Pagination, etc.)
│   └── feedback/      # Feedback components (Toast, Alert, etc.)
├── hooks/             # Shared React hooks (usePagination, useSearch, useDebounce)
└── utils/             # Frontend utility functions (cn, classNames, etc.)
```

**Note:** 
- **Services** should be in `frontend/src/services/` (app-specific)
- **Types** should be in `shared/common/types/` (if shared with backend) or `frontend/src/` (if app-specific)
- **Constants** should be in `shared/common/constants/` (if shared with backend) or `frontend/src/` (if app-specific)

## Usage

### Importing Components

```typescript
// Import from barrel export
import { Button, Input, Modal, Card } from '@/shared';

// Or import specific component
import { Button } from '@/shared/components/ui/Button';
```

### Importing Hooks

```typescript
import { usePagination, useSearch, useDebounce } from '@/shared/hooks';
```

## Complete Component List

### UI Components

#### Button

A versatile button component with multiple variants and sizes.

```tsx
import { Button } from '@/shared';

<Button variant="primary" size="md" onClick={handleClick}>
  Click Me
</Button>

<Button variant="danger" isLoading={isSubmitting}>
  Delete
</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'link'
- `size`: 'sm' | 'md' | 'lg'
- `isLoading`: boolean
- `leftIcon`: ReactNode
- `rightIcon`: ReactNode
- `fullWidth`: boolean

### Input

A form input component with label, error, and icon support.

```tsx
import { Input } from '@/shared';

<Input
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={errors.email}
  helperText="Enter your email address"
/>
```

### Modal

A modal/dialog component with overlay and keyboard support.

```tsx
import { Modal } from '@/shared';

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
  size="md"
>
  <p>Are you sure you want to proceed?</p>
</Modal>
```

### Card

A card component with header, content, and footer sections.

```tsx
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/shared';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Textarea

A textarea component with label, error, and helper text support.

```tsx
import { Textarea } from '@/shared';

<Textarea
  label="Description"
  rows={6}
  value={description}
  onChange={(e) => setDescription(e.target.value)}
  error={errors.description}
  helperText="Enter a detailed description"
/>
```

### Select

A select/dropdown component with options array.

```tsx
import { Select } from '@/shared';

<Select
  label="Priority"
  options={[
    { value: 'low', label: 'Low' },
    { value: 'high', label: 'High' },
  ]}
  placeholder="Select priority"
  error={errors.priority}
/>
```

### Checkbox

A checkbox component with label and error support.

```tsx
import { Checkbox } from '@/shared';

<Checkbox
  label="I agree to terms"
  checked={agreed}
  onChange={(e) => setAgreed(e.target.checked)}
  error={errors.agreed}
/>
```

### Radio

A radio button component.

```tsx
import { Radio } from '@/shared';

<Radio
  label="Option 1"
  name="option"
  value="1"
  checked={selected === '1'}
  onChange={(e) => setSelected(e.target.value)}
/>
```

### Badge

A badge component for status indicators.

```tsx
import { Badge } from '@/shared';

<Badge variant="success" dot>Active</Badge>
<Badge variant="danger">Inactive</Badge>
<Badge variant="warning" size="sm">Pending</Badge>
```

### Avatar

An avatar component with image or initials.

```tsx
import { Avatar } from '@/shared';

<Avatar src={user.avatar} name={user.name} size="md" status="online" />
<Avatar name="John Doe" size="lg" />
```

### Loading Components

Loading spinners and skeleton loaders.

```tsx
import { Loading, Skeleton, CardSkeleton, TableSkeleton } from '@/shared';

<Loading size="md" text="Loading..." />
<Skeleton width="200px" height="20px" />
<CardSkeleton />
<TableSkeleton rows={5} cols={4} />
```

### Alert

Alert messages with variants.

```tsx
import { Alert } from '@/shared';

<Alert variant="success" title="Success!" dismissible onDismiss={handleDismiss}>
  Operation completed successfully.
</Alert>
<Alert variant="error">Something went wrong.</Alert>
```

### EmptyState

Empty state component for when there's no data.

```tsx
import { EmptyState } from '@/shared';
import { Inbox } from 'lucide-react';

<EmptyState
  icon={<Inbox className="h-12 w-12" />}
  title="No tickets found"
  description="Create your first ticket to get started"
  action={{
    label: "Create Ticket",
    onClick: () => navigate('/tickets/create'),
  }}
/>
```

### ConfirmDialog

Confirmation dialog for destructive actions.

```tsx
import { ConfirmDialog } from '@/shared';

<ConfirmDialog
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={handleDelete}
  title="Delete Item"
  message="Are you sure? This action cannot be undone."
  variant="danger"
  confirmText="Delete"
/>
```

### SearchBar

Search input with debouncing.

```tsx
import { SearchBar } from '@/shared';

<SearchBar
  placeholder="Search users..."
  onSearch={(value) => handleSearch(value)}
  debounceMs={300}
/>
```

### Pagination

Pagination controls component.

```tsx
import { Pagination } from '@/shared';

<Pagination
  page={page}
  totalPages={totalPages}
  onPageChange={(newPage) => setPage(newPage)}
  showFirstLast
  showPageNumbers
/>
```

### DataTable

Reusable data table component.

```tsx
import { DataTable } from '@/shared';

const columns = [
  { key: 'name', header: 'Name' },
  { key: 'email', header: 'Email' },
  { key: 'role', header: 'Role', render: (user) => <Badge>{user.role}</Badge> },
];

<DataTable
  columns={columns}
  data={users}
  isLoading={isLoading}
  emptyMessage="No users found"
  onRowClick={(user) => navigate(`/users/${user.id}`)}
/>
```

## Hooks

### usePagination

Hook for managing pagination state.

```tsx
import { usePagination } from '@/shared/hooks';

const {
  page,
  limit,
  totalPages,
  skip,
  nextPage,
  prevPage,
  goToPage,
  hasNextPage,
  hasPrevPage,
} = usePagination({
  initialPage: 1,
  initialLimit: 10,
  totalItems: 100,
});
```

### useSearch

Hook for search input with debouncing.

```tsx
import { useSearch } from '@/shared/hooks';

const { searchValue, debouncedValue, setSearchValue, clear } = useSearch({
  debounceMs: 300,
  onSearch: (value) => {
    // Perform search
  },
});
```

### useDebounce

Generic debounce hook.

```tsx
import { useDebounce } from '@/shared/hooks';

const debouncedValue = useDebounce(searchTerm, 300);
```

## Utilities

### classNames (cn)

Utility for merging class names.

```tsx
import { cn } from '@/shared/utils/helpers';

<div className={cn('base-class', condition && 'conditional-class', className)} />
```

## Best Practices

1. **Always use shared components** when available instead of creating new ones
2. **Extend components** rather than duplicating them
3. **Use TypeScript** - All components are fully typed
4. **Follow naming conventions** - Use PascalCase for components
5. **Document props** - Add JSDoc comments for complex props

## Adding New Components

1. Create component in appropriate folder (`ui/`, `forms/`, etc.)
2. Export from component's `index.ts`
3. Add to barrel export (`components/ui/index.ts`)
4. Document in this README
5. Add TypeScript types

## Examples

See `EXAMPLES.md` for more detailed usage examples.

