# Shared UI Components

Mero Jugx uses a centralized component library to ensure design consistency across the Platform, Mero Board, and all future apps.

## 📦 Location

All shared code resides in `shared/frontend/`. Apps should import from here rather than creating unique UI elements.

```typescript
import { Button, Card, Input } from '@shared/frontend';
```

---

## 🧩 Key Components

### Layout & Navigation

- **NavigationSidebar** (`components/layout/NavigationSidebar.tsx`)
    - The standard collapsible sidebar used in the Dashboard.
    - Supports `locked` (always open) and `hover` (expand on mouseover) modes.
    - Configurable via `NavigationItem[]` props.

- **AppHeader** (`components/layouts/AppHeader/AppHeader.tsx`)
    - Standard top bar for Apps.
    - Includes: Title, Back Button, User Profile, Notifications, and App Minimization.

- **MainContentArea** (`components/layout/MainContentArea.tsx`)
    - Standard wrapper ensuring consistent padding and background colors for page content.

### Foundation (`components/ui/`)

- **Button**: Theme-aware buttons with variants (default, outline, ghost, destructive).
- **Input / Select**: Form controls with built-in validation styling.
- **Card**: Container for grouping content with standard shadows/borders.
- **Modal**: Accessible dialog overlays.

### Feedback (`components/feedback/`)

- **Alert**: Contextual info banners (Success, Warning, Error).
- **ConfirmDialog**: Standard "Are you sure?" checks.
- **EmptyState**: Placeholder UI for lists with no data.

---

## 🎨 Theming

All components are built with **Tailwind CSS** and rely on CSS variables for theming. This allows individual Apps to override specific colors (e.g., `primary`, `secondary`) without changing the component code.

## 🛠️ Usage Example

```tsx
import { Card, Button, Alert } from '@shared/frontend';

export const MyFeature = () => {
  return (
    <Card title="New Feature">
      <Alert variant="info" message="This is a shared component!" />
      <div className="p-4">
        <Button onClick={() => console.log('Clicked')}>
            Action
        </Button>
      </div>
    </Card>
  );
};
```
