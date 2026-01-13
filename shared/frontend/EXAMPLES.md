# Shared Components - Usage Examples

## Complete Form Example

```tsx
import { useState } from 'react';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@/shared';
import { useSearch } from '@/shared/hooks';

function UserForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate and submit
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create User</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
            required
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={errors.email}
            required
          />
          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            error={errors.password}
            required
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" type="button" onClick={() => setFormData({ name: '', email: '', password: '' })}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Create User
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

## Pagination Example

```tsx
import { useQuery } from '@tanstack/react-query';
import { Button, Card, CardContent } from '@/shared';
import { usePagination } from '@/shared/hooks';
import api from '@/services/api';

function TicketsList() {
  const { page, limit, totalPages, nextPage, prevPage, hasNextPage, hasPrevPage } = usePagination({
    initialPage: 1,
    initialLimit: 10,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['tickets', page, limit],
    queryFn: async () => {
      const response = await api.get(`/tickets?page=${page}&limit=${limit}`);
      return response.data;
    },
  });

  return (
    <Card>
      <CardContent>
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <>
            <div className="space-y-2">
              {data?.tickets.map((ticket) => (
                <div key={ticket.id}>{ticket.title}</div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-4">
              <Button
                variant="outline"
                onClick={prevPage}
                disabled={!hasPrevPage}
              >
                Previous
              </Button>
              <span>
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={nextPage}
                disabled={!hasNextPage}
              >
                Next
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
```

## Search with Debounce Example

```tsx
import { useQuery } from '@tanstack/react-query';
import { Input, Card } from '@/shared';
import { useSearch } from '@/shared/hooks';
import api from '@/services/api';

function SearchableList() {
  const { searchValue, debouncedValue, setSearchValue } = useSearch({
    debounceMs: 300,
  });

  const { data } = useQuery({
    queryKey: ['items', debouncedValue],
    queryFn: async () => {
      const response = await api.get(`/items?search=${debouncedValue}`);
      return response.data;
    },
    enabled: debouncedValue.length > 2,
  });

  return (
    <Card>
      <div className="p-4">
        <Input
          placeholder="Search items..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
        />
        <div className="mt-4">
          {data?.items.map((item) => (
            <div key={item.id}>{item.name}</div>
          ))}
        </div>
      </div>
    </Card>
  );
}
```

## Modal with Form Example

```tsx
import { useState } from 'react';
import { Modal, Button, Input } from '@/shared';

function CreateTicketModal({ isOpen, onClose }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async () => {
    // Submit logic
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Ticket"
      size="lg"
      footer={
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Create
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>
    </Modal>
  );
}
```

## Button Variants Example

```tsx
import { Button } from '@/shared';
import { Plus, Trash2, Edit } from 'lucide-react';

function ButtonExamples() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="danger">Danger</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="link">Link</Button>
      </div>
      
      <div className="flex gap-2">
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
      </div>
      
      <div className="flex gap-2">
        <Button leftIcon={<Plus />}>Add Item</Button>
        <Button rightIcon={<Edit />}>Edit</Button>
        <Button isLoading>Loading...</Button>
        <Button fullWidth>Full Width</Button>
      </div>
    </div>
  );
}
```

## Loading States Example

```tsx
import { Loading, Skeleton, CardSkeleton, TableSkeleton } from '@/shared';

function LoadingExamples() {
  return (
    <div className="space-y-4">
      {/* Spinner */}
      <Loading size="md" text="Loading data..." />
      
      {/* Skeleton loaders */}
      <Skeleton width="200px" height="20px" />
      <Skeleton width="100%" height="40px" rounded />
      
      {/* Card skeleton */}
      <CardSkeleton />
      
      {/* Table skeleton */}
      <TableSkeleton rows={5} cols={4} />
    </div>
  );
}
```

