# Shared Components Library

This document lists all available UI components in our shared component library. All components are designed to work with our theme system and follow consistent patterns.

## Table of Contents

- [UI Components](#ui-components)
- [Feedback Components](#feedback-components)
- [Data Display Components](#data-display-components)
- [Usage Examples](#usage-examples)

## UI Components

### Button
A versatile button component with multiple variants and sizes.

```tsx
import { Button } from '@/shared';

<Button variant="primary" size="md" onClick={handleClick}>
  Click Me
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
Form input component with label, error, and helper text support.

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

### Textarea
Textarea component with label, error, and helper text support.

```tsx
import { Textarea } from '@/shared';

<Textarea
  label="Description"
  rows={6}
  value={description}
  onChange={(e) => setDescription(e.target.value)}
/>
```

### Select
Select/dropdown component with options array.

```tsx
import { Select } from '@/shared';

<Select
  label="Priority"
  options={[
    { value: 'low', label: 'Low' },
    { value: 'high', label: 'High' },
  ]}
  placeholder="Select priority"
/>
```

### Checkbox
Checkbox component with label and error support.

```tsx
import { Checkbox } from '@/shared';

<Checkbox
  label="I agree to terms"
  checked={agreed}
  onChange={(e) => setAgreed(e.target.checked)}
/>
```

### Radio
Radio button component.

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

### Switch
Toggle switch component.

```tsx
import { Switch } from '@/shared';

<Switch
  label="Enable notifications"
  checked={enabled}
  onChange={(e) => setEnabled(e.target.checked)}
  description="Receive email notifications"
/>
```

### Label
Label component for form inputs.

```tsx
import { Label } from '@/shared';

<Label htmlFor="email" required>
  Email Address
</Label>
```

### Card
Card component with header, content, and footer sections.

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

### Badge
Badge component for status indicators.

```tsx
import { Badge } from '@/shared';

<Badge variant="success" dot>Active</Badge>
<Badge variant="danger">Inactive</Badge>
```

### Avatar
Avatar component with image or initials.

```tsx
import { Avatar } from '@/shared';

<Avatar src={user.avatar} name={user.name} size="md" status="online" />
```

### Modal
Modal/dialog component with overlay.

```tsx
import { Modal, ModalHeader, ModalContent, ModalFooter } from '@/shared';

<Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
  <ModalHeader title="Confirm Action" />
  <ModalContent>
    <p>Are you sure you want to proceed?</p>
  </ModalContent>
  <ModalFooter>
    <Button onClick={() => setIsOpen(false)}>Cancel</Button>
    <Button variant="primary">Confirm</Button>
  </ModalFooter>
</Modal>
```

### Dialog
Enhanced dialog component (alternative to Modal).

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared';

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Are you sure?</DialogTitle>
    </DialogHeader>
    <p>This action cannot be undone.</p>
    <DialogFooter>
      <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
      <Button variant="danger" onClick={handleConfirm}>Delete</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### AlertDialog
Alert dialog for confirmations.

```tsx
import { AlertDialog } from '@/shared';

<AlertDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Delete Item"
  description="Are you sure? This action cannot be undone."
  variant="destructive"
  confirmText="Delete"
  onConfirm={handleDelete}
/>
```

### Tabs
Tab navigation component.

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared';

<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>
```

### Accordion
Collapsible accordion component.

```tsx
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/shared';

<Accordion type="single" collapsible>
  <AccordionItem value="item-1">
    <AccordionTrigger>Is it accessible?</AccordionTrigger>
    <AccordionContent>
      Yes. It adheres to the WAI-ARIA design pattern.
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

### Collapsible
Collapsible content component.

```tsx
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/shared';

<Collapsible>
  <CollapsibleTrigger>Toggle</CollapsibleTrigger>
  <CollapsibleContent>
    Content that can be collapsed
  </CollapsibleContent>
</Collapsible>
```

### DropdownMenu
Dropdown menu component.

```tsx
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '@/shared';

<DropdownMenu
  trigger={<Button>Open Menu</Button>}
>
  <DropdownMenuItem icon={<User />}>Profile</DropdownMenuItem>
  <DropdownMenuItem icon={<Settings />}>Settings</DropdownMenuItem>
  <DropdownMenuSeparator />
  <DropdownMenuItem icon={<LogOut />}>Logout</DropdownMenuItem>
</DropdownMenu>
```

### Popover
Popover component for floating content.

```tsx
import { Popover, PopoverContent } from '@/shared';

<Popover trigger={<Button>Open Popover</Button>}>
  <PopoverContent>
    <p>Popover content goes here</p>
  </PopoverContent>
</Popover>
```

### Tooltip
Tooltip component for hover information.

```tsx
import { Tooltip } from '@/shared';

<Tooltip content="This is a tooltip">
  <Button>Hover me</Button>
</Tooltip>
```

### Sheet
Side sheet/drawer component.

```tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared';

<Sheet open={isOpen} onOpenChange={setIsOpen} side="right">
  <SheetContent>
    <SheetHeader>
      <SheetTitle>Sheet Title</SheetTitle>
    </SheetHeader>
    <p>Sheet content</p>
  </SheetContent>
</Sheet>
```

### Table
Table component with header, body, and footer.

```tsx
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>John Doe</TableCell>
      <TableCell>john@example.com</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Progress
Progress bar component.

```tsx
import { Progress } from '@/shared';

<Progress value={75} max={100} showValue variant="success" />
```

### Skeleton
Loading skeleton component.

```tsx
import { Skeleton } from '@/shared';

<Skeleton className="h-4 w-full" />
<Skeleton variant="circular" className="h-12 w-12" />
```

### Separator
Visual separator component.

```tsx
import { Separator } from '@/shared';

<Separator orientation="horizontal" />
<Separator orientation="vertical" />
```

### Breadcrumb
Breadcrumb navigation component.

```tsx
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from '@/shared';

<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink to="/">Home</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Current Page</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

### Slider
Range slider component.

```tsx
import { Slider } from '@/shared';

<Slider
  value={[50]}
  onValueChange={(value) => console.log(value)}
  min={0}
  max={100}
  step={1}
/>
```

### ScrollArea
Scrollable area component.

```tsx
import { ScrollArea } from '@/shared';

<ScrollArea className="h-72">
  <div>Long content here</div>
</ScrollArea>
```

### Toast
Toast notification component.

```tsx
import { Toast, ToastContainer } from '@/shared';

<ToastContainer
  toasts={[
    {
      id: '1',
      title: 'Success',
      description: 'Operation completed',
      variant: 'success',
    },
  ]}
/>
```

### Loading
Loading spinner component.

```tsx
import { Loading, CardSkeleton, TableSkeleton } from '@/shared';

<Loading size="md" text="Loading..." />
<CardSkeleton />
<TableSkeleton rows={5} cols={4} />
```

## Feedback Components

### Alert
Alert message component.

```tsx
import { Alert } from '@/shared';

<Alert variant="success" title="Success!" dismissible>
  Operation completed successfully.
</Alert>
```

### ConfirmDialog
Confirmation dialog component.

```tsx
import { ConfirmDialog } from '@/shared';

<ConfirmDialog
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={handleDelete}
  title="Delete Item"
  message="Are you sure? This action cannot be undone."
  variant="danger"
/>
```

### EmptyState
Empty state component.

```tsx
import { EmptyState } from '@/shared';

<EmptyState
  icon={<Inbox />}
  title="No tickets found"
  description="Create your first ticket to get started"
  action={{
    label: "Create Ticket",
    onClick: () => navigate('/tickets/create'),
  }}
/>
```

## Data Display Components

### DataTable
Reusable data table component.

```tsx
import { DataTable } from '@/shared';

const columns = [
  { key: 'name', header: 'Name' },
  { key: 'email', header: 'Email' },
];

<DataTable
  columns={columns}
  data={users}
  isLoading={isLoading}
  emptyMessage="No users found"
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

## Best Practices

1. **Always use shared components** when available instead of creating new ones
2. **Extend components** rather than duplicating them
3. **Use TypeScript** - All components are fully typed
4. **Follow naming conventions** - Use PascalCase for components
5. **Theme-aware** - All components work with our theme system
6. **Accessible** - Components follow accessibility best practices

## Importing Components

```tsx
// Import from barrel export (recommended)
import { Button, Input, Card, Modal } from '@/shared';

// Or import specific component
import { Button } from '@/shared/components/ui/Button';
```

## Adding New Components

1. Create component in appropriate folder (`ui/`, `forms/`, etc.)
2. Export from component's `index.ts`
3. Add to barrel export (`components/ui/index.ts`)
4. Document in this file
5. Add TypeScript types

