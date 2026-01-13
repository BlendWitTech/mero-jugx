# Mero Jugx - System Architecture

## Overview

Mero Jugx is a multi-tenant SaaS platform that allows organizations to subscribe to and use multiple applications within a unified ecosystem. This document outlines the complete system architecture, project structure, and guidelines for developing applications within the platform.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Project Structure](#project-structure)
3. [Multi-Tenancy Implementation](#multi-tenancy-implementation)
4. [App Development Architecture](#app-development-architecture)
5. [Shared Code Organization](#shared-code-organization)
6. [Backend Architecture](#backend-architecture)
7. [Frontend Architecture](#frontend-architecture)
8. [Database Architecture](#database-architecture)
9. [API Architecture](#api-architecture)
10. [Security Architecture](#security-architecture)

---

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Mero Jugx Platform                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Frontend   │  │   Backend    │  │   Database   │      │
│  │   (React)    │  │   (NestJS)   │  │ (PostgreSQL) │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                  │               │
│         └─────────────────┼──────────────────┘               │
│                           │                                  │
│  ┌───────────────────────┼───────────────────────┐          │
│  │         Shared Code (shared/)                  │          │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐   │          │
│  │  │ Frontend │  │  Common  │  │ Backend  │   │          │
│  │  │  Shared │  │  Shared  │  │  Shared  │   │          │
│  │  └──────────┘  └──────────┘  └──────────┘   │          │
│  └───────────────────────────────────────────────┘          │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Apps (Future Development)                │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │   │
│  │  │ App 1    │  │ App 2    │  │ App 3    │          │   │
│  │  │ (mero-   │  │ (mero-   │  │ (mero-   │          │   │
│  │  │  board)  │  │  cem)    │  │  ...)    │          │   │
│  │  └──────────┘  └──────────┘  └──────────┘          │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Core Components

1. **Platform Core** (`src/` and `frontend/src/`)
   - Authentication & Authorization
   - Organization Management
   - User Management
   - App Marketplace
   - Payment Processing
   - Real-time Communication

2. **Shared Code** (`shared/`)
   - Frontend components, hooks, utilities
   - Common types, constants, utilities
   - Backend utilities, types, constants

3. **Apps** (Future: `apps/`)
   - Individual applications that organizations can subscribe to
   - Each app has its own backend module and frontend pages
   - Apps use shared components and follow platform patterns

---

## Project Structure

```
mero-jugx/
├── src/                          # Backend source code (NestJS)
│   ├── main.ts                   # Application entry point
│   ├── app.module.ts             # Root module
│   │
│   ├── auth/                     # Authentication module
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   ├── guards/               # JWT guards, MFA guards
│   │   ├── strategies/           # Passport strategies
│   │   └── dto/                  # Auth DTOs
│   │
│   ├── organizations/            # Organization management
│   ├── users/                    # User management
│   ├── apps/                     # App marketplace & management
│   ├── marketplace/              # Marketplace features
│   ├── roles/                    # Role & permission management
│   ├── packages/                 # Subscription packages
│   ├── payments/                 # Payment processing
│   ├── chat/                     # Real-time chat & calls
│   ├── tickets/                  # Support tickets
│   ├── notifications/            # Notification system
│   ├── analytics/                # Analytics & reporting
│   │
│   ├── database/                 # Database layer
│   │   ├── entities/             # TypeORM entities
│   │   ├── migrations/           # Database migrations
│   │   └── seeds/                # Database seeds
│   │
│   ├── common/                   # Shared backend utilities
│   │   ├── decorators/           # Custom decorators
│   │   ├── guards/               # Shared guards
│   │   ├── filters/              # Exception filters
│   │   ├── interceptors/        # Interceptors
│   │   ├── services/             # Shared services
│   │   └── utils/                # Utility functions
│   │
│   └── config/                   # Configuration
│       ├── database.config.ts
│       └── configuration.ts
│
├── frontend/                     # Frontend source code (React)
│   ├── src/
│   │   ├── App.tsx               # Main app component
│   │   ├── main.tsx              # Frontend entry point
│   │   │
│   │   ├── pages/                # Page components
│   │   │   ├── auth/            # Auth pages (login, register)
│   │   │   ├── dashboard/       # Dashboard page
│   │   │   ├── users/           # User management pages
│   │   │   ├── organizations/  # Organization pages
│   │   │   ├── apps/            # App marketplace & app view
│   │   │   ├── roles/           # Role management pages
│   │   │   ├── packages/       # Package management
│   │   │   ├── billing/         # Billing pages
│   │   │   ├── chat/           # Chat pages
│   │   │   ├── tickets/        # Ticket pages
│   │   │   └── ...             # Other pages
│   │   │
│   │   ├── components/          # Feature-specific components
│   │   │   ├── Taskbar/        # App taskbar
│   │   │   ├── LockScreen.tsx # App lock screen
│   │   │   ├── OrganizationSwitcher.tsx
│   │   │   └── ...             # Other components
│   │   │
│   │   ├── layouts/             # Layout components
│   │   │   ├── DashboardLayout.tsx
│   │   │   └── OrganizationDashboardLayout.tsx
│   │   │
│   │   ├── services/            # API service layer
│   │   │   ├── api.ts           # Axios instance
│   │   │   ├── authService.ts
│   │   │   ├── appSessionService.ts
│   │   │   └── ...              # Other services
│   │   │
│   │   ├── store/               # State management (Zustand)
│   │   │   └── authStore.ts
│   │   │
│   │   ├── contexts/            # React contexts
│   │   │   └── ThemeContext.tsx
│   │   │
│   │   ├── hooks/               # Custom hooks (app-specific)
│   │   │   ├── usePermissions.ts
│   │   │   └── ...
│   │   │
│   │   ├── config/              # Configuration
│   │   │   └── urlConfig.ts
│   │   │
│   │   └── utils/               # Helper utilities
│   │       ├── errorHandler.ts
│   │       ├── currency.ts
│   │       └── ...
│   │
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── Dockerfile
│
├── shared/                       # Shared code (used by both frontend & backend)
│   ├── frontend/                 # Frontend-specific shared code
│   │   ├── components/          # Reusable UI components
│   │   │   ├── ui/             # Basic UI primitives
│   │   │   │   ├── Button/
│   │   │   │   ├── Input/
│   │   │   │   ├── Card/
│   │   │   │   ├── Modal/
│   │   │   │   └── ...         # All UI components
│   │   │   ├── feedback/       # Feedback components
│   │   │   │   ├── Alert/
│   │   │   │   ├── ConfirmDialog/
│   │   │   │   └── EmptyState/
│   │   │   └── data-display/   # Data display components
│   │   │       ├── DataTable/
│   │   │       ├── Pagination/
│   │   │       └── SearchBar/
│   │   ├── hooks/              # Shared React hooks
│   │   │   ├── usePagination.ts
│   │   │   ├── useSearch.ts
│   │   │   └── useDebounce.ts
│   │   └── utils/              # Frontend utilities
│   │       ├── cn.ts           # Class name utility
│   │       └── helpers/
│   │
│   ├── backend/                 # Backend-specific shared code
│   │   ├── utils/              # Backend utilities
│   │   ├── types/               # Backend TypeScript types
│   │   └── constants/          # Backend constants
│   │
│   └── common/                  # Truly shared code (frontend + backend)
│       ├── types/              # Shared TypeScript types
│       ├── constants/          # Shared constants
│       └── utils/              # Shared utility functions
│
├── apps/                         # Individual applications (Future)
│   ├── mero-board/              # Example: Project management app
│   │   ├── backend/             # App backend module
│   │   │   ├── entities/        # App-specific entities
│   │   │   ├── dto/             # App-specific DTOs
│   │   │   ├── services/        # App-specific services
│   │   │   └── controllers/    # App-specific controllers
│   │   └── frontend/            # App frontend pages
│   │       └── pages/           # App-specific pages
│   │
│   └── mero-cem/                # Example: Another app
│       └── ...
│
├── test/                         # E2E tests
├── scripts/                      # Setup and utility scripts
├── docker-compose.yml            # Docker Compose configuration
├── Dockerfile                    # Backend Dockerfile
├── package.json                  # Root package.json
├── tsconfig.json                 # Backend TypeScript config
└── README.md                     # Project documentation
```

---

## Multi-Tenancy Implementation

### Core Principles

1. **Organization-Based Isolation**
   - Every tenant-aware entity has an `organization_id` column
   - All queries are automatically filtered by organization
   - Organization context comes from JWT token (never from request body)

2. **Data Isolation Strategy**
   - Row-Level Security (RLS) via application-level filtering
   - Database indexes on `organization_id` for performance
   - No cross-organization data leakage

3. **User-Organization Relationship**
   - Users can belong to multiple organizations
   - Each user-organization relationship has a role
   - Users can switch between organizations

### Implementation Pattern

```typescript
// Entity Example
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  // ... other fields
}

@Entity('organization_members')
export class OrganizationMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  user_id: string;

  @Column('uuid')
  organization_id: string;  // Multi-tenancy key

  @Column('uuid')
  role_id: string;

  // ... other fields
}

// Service Example
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(OrganizationMember)
    private memberRepository: Repository<OrganizationMember>,
  ) {}

  async getUsers(organizationId: string) {
    // Always filter by organization_id
    return this.memberRepository.find({
      where: { organization_id: organizationId },
      relations: ['user', 'role'],
    });
  }
}
```

---

## App Development Architecture

### App Structure

When developing an app inside Mero Jugx, follow this structure:

```
apps/
└── mero-board/                   # App name (kebab-case)
    ├── backend/                  # Backend module
    │   ├── entities/            # App-specific entities
    │   │   ├── workspace.entity.ts
    │   │   ├── project.entity.ts
    │   │   └── task.entity.ts
    │   │
    │   ├── dto/                 # App-specific DTOs
    │   │   ├── create-workspace.dto.ts
    │   │   └── ...
    │   │
    │   ├── services/             # App-specific services
    │   │   ├── workspace.service.ts
    │   │   └── project.service.ts
    │   │
    │   ├── controllers/         # App-specific controllers
    │   │   ├── workspace.controller.ts
    │   │   └── project.controller.ts
    │   │
    │   └── mero-board.module.ts # App module
    │
    └── frontend/                 # App frontend
        └── pages/               # App-specific pages
            ├── WorkspacePage.tsx
            ├── ProjectPage.tsx
            └── TaskPage.tsx
```

### App Integration Steps

1. **Backend Integration**
   ```typescript
   // 1. Create entities with organization_id
   @Entity('workspaces')
   export class Workspace {
     @PrimaryGeneratedColumn('uuid')
     id: string;

     @Column('uuid')
     organization_id: string;  // Required for multi-tenancy

     @Column()
     name: string;

     // ... other fields
   }

   // 2. Create DTOs
   export class CreateWorkspaceDto {
     @IsString()
     name: string;
   }

   // 3. Create service
   @Injectable()
   export class WorkspaceService {
     constructor(
       @InjectRepository(Workspace)
       private workspaceRepository: Repository<Workspace>,
     ) {}

     async create(organizationId: string, dto: CreateWorkspaceDto) {
       const workspace = this.workspaceRepository.create({
         ...dto,
         organization_id: organizationId,  // Always set from token
       });
       return this.workspaceRepository.save(workspace);
     }
   }

   // 4. Create controller
   @Controller('workspaces')
   @UseGuards(JwtAuthGuard)
   export class WorkspaceController {
     constructor(private workspaceService: WorkspaceService) {}

     @Post()
     create(
       @CurrentOrganization('id') organizationId: string,
       @Body() dto: CreateWorkspaceDto,
     ) {
       return this.workspaceService.create(organizationId, dto);
     }
   }

   // 5. Create module
   @Module({
     imports: [TypeOrmModule.forFeature([Workspace])],
     controllers: [WorkspaceController],
     providers: [WorkspaceService],
   })
   export class MeroBoardModule {}

   // 6. Register in app.module.ts
   @Module({
     imports: [
       // ... other modules
       MeroBoardModule,
     ],
   })
   export class AppModule {}
   ```

2. **Frontend Integration**
   ```typescript
   // 1. Create app pages using shared components
   import { Button, Card, Input } from '@shared/frontend';
   import api from '../../services/api';

   export default function WorkspacePage() {
     const { organization } = useAuthStore();
     
     // Use shared components
     return (
       <Card>
         <CardHeader>
           <CardTitle>Workspaces</CardTitle>
         </CardHeader>
         <CardContent>
           {/* App-specific content */}
         </CardContent>
       </Card>
     );
   }

   // 2. Add route in App.tsx
   <Route 
     path="apps/:appId/workspaces" 
     element={<WorkspacePage />} 
   />
   ```

### App Requirements

1. **Multi-Tenancy**
   - All entities must have `organization_id`
   - All queries must filter by organization
   - Use `@CurrentOrganization()` decorator

2. **Use Shared Components**
   - Import from `@shared/frontend`
   - Follow component patterns
   - Maintain theme consistency

3. **API Structure**
   - Use `/api/v1/apps/:appId/...` pattern
   - Include organization context in all requests
   - Follow RESTful conventions

4. **Database**
   - Create migrations for app entities
   - Index `organization_id` columns
   - Follow naming conventions

---

## Shared Code Organization

### Frontend Shared (`shared/frontend/`)

**Purpose:** Reusable React components, hooks, and utilities used across the platform and apps.

**Structure:**
```
shared/frontend/
├── components/          # UI components
│   ├── ui/            # Basic primitives (Button, Input, Card, etc.)
│   ├── feedback/      # Feedback (Alert, ConfirmDialog, EmptyState)
│   └── data-display/  # Data display (DataTable, Pagination, SearchBar)
├── hooks/             # React hooks (usePagination, useSearch, useDebounce)
└── utils/             # Frontend utilities (cn, classNames)
```

**Usage:**
```typescript
import { Button, Card, Input } from '@shared/frontend';
import { usePagination } from '@shared/frontend/hooks';
```

### Backend Shared (`shared/backend/`)

**Purpose:** Reusable backend utilities, types, and constants.

**Structure:**
```
shared/backend/
├── utils/             # Backend utility functions
├── types/             # Backend TypeScript types
└── constants/         # Backend constants
```

**Usage:**
```typescript
import { validateEmail } from '@shared/backend/utils';
import { BackendType } from '@shared/backend/types';
```

### Common Shared (`shared/common/`)

**Purpose:** Code shared between frontend and backend (types, constants, utilities).

**Structure:**
```
shared/common/
├── types/             # Shared TypeScript types/interfaces
├── constants/         # Shared constants (API endpoints, status codes)
└── utils/             # Shared utility functions
```

**Usage:**
```typescript
// Frontend
import { ApiResponse, UserRole } from '@shared/common/types';

// Backend
import { ApiResponse, UserRole } from '@shared/common/types';
```

---

## Backend Architecture

### Module Structure

Each feature follows this pattern:

```
feature-name/
├── feature-name.controller.ts    # REST endpoints
├── feature-name.service.ts      # Business logic
├── feature-name.module.ts       # Module definition
└── dto/                         # Data Transfer Objects
    ├── create-feature.dto.ts
    └── update-feature.dto.ts
```

### Key Patterns

1. **Dependency Injection**
   ```typescript
   @Injectable()
   export class UsersService {
     constructor(
       @InjectRepository(User)
       private userRepository: Repository<User>,
     ) {}
   }
   ```

2. **Guards for Authorization**
   ```typescript
   @UseGuards(JwtAuthGuard)
   @Controller('users')
   export class UsersController {
     // ...
   }
   ```

3. **Organization Context**
   ```typescript
   @Post()
   create(
     @CurrentOrganization('id') organizationId: string,
     @Body() dto: CreateDto,
   ) {
     // organizationId comes from JWT token
   }
   ```

---

## Frontend Architecture

### Component Hierarchy

```
App
└── Routes
    ├── Public Routes (Login, Register)
    └── Private Routes
        └── OrganizationDashboardLayout
            ├── Sidebar (Navigation)
            ├── Top Bar
            └── Outlet (Page Content)
                ├── DashboardPage
                ├── UsersPage
                ├── AppsPage
                └── AppViewPage (for apps)
                    └── App-specific pages
```

### State Management

- **Zustand** for global state (auth, organization)
- **React Query** for server state (API data)
- **Local state** for component-specific state

### Routing

- Main platform routes: `/org/:slug/...`
- App routes: `/org/:slug/apps/:appId/...`
- App subdomain routes: `app-slug.domain.com/...`

---

## Database Architecture

### Entity Relationships

```
User
  └── OrganizationMember (many-to-many)
      ├── Organization
      └── Role

Organization
  ├── OrganizationApp (many-to-many)
  │   └── App
  └── OrganizationPackage
      └── Package

App
  └── UserAppAccess (many-to-many with User)
```

### Multi-Tenancy Pattern

Every tenant-aware entity:
- Has `organization_id: uuid` column
- Has index on `organization_id`
- Queries always filter by `organization_id`

---

## API Architecture

### Endpoint Structure

```
/api/v1/
├── auth/                    # Authentication
├── users/                   # User management
├── organizations/           # Organization management
├── apps/                    # App marketplace
├── roles/                   # Role management
├── packages/                # Package management
├── payments/                # Payment processing
├── chat/                    # Chat endpoints
├── tickets/                 # Ticket system
└── apps/:appId/             # App-specific endpoints
    └── workspaces/          # Example: mero-board endpoints
```

### Request/Response Pattern

```typescript
// Request
POST /api/v1/apps/1/workspaces
Headers: {
  Authorization: 'Bearer <token>',
  'X-Organization-Id': '<org-id>'  // From JWT, not body
}
Body: {
  name: 'My Workspace'
}

// Response
{
  success: true,
  data: {
    id: 'uuid',
    name: 'My Workspace',
    organization_id: 'uuid',
    created_at: '2024-01-01T00:00:00Z'
  }
}
```

---

## Security Architecture

### Authentication Flow

1. User logs in → Receives JWT with `userId`
2. User selects organization → JWT updated with `organizationId`
3. All requests include JWT in `Authorization` header
4. Backend validates JWT and extracts `organizationId`
5. All queries filtered by `organizationId`

### Authorization

- **Role-Based Access Control (RBAC)**
  - Roles defined per organization
  - Permissions assigned to roles
  - Users have roles per organization

- **Permission Checks**
  ```typescript
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('users.create')
  @Post()
  create() {
    // Only users with 'users.create' permission can access
  }
  ```

### Data Isolation

- **Never trust client-provided organization IDs**
- **Always extract from JWT token**
- **Use decorators and guards for automatic filtering**

---

## Development Guidelines

### Adding a New App

1. **Backend:**
   - Create entities with `organization_id`
   - Create DTOs, services, controllers
   - Create module and register in `app.module.ts`
   - Create database migrations

2. **Frontend:**
   - Create pages using shared components
   - Add routes in `App.tsx`
   - Use `@shared/frontend` for all UI components

3. **Testing:**
   - Write unit tests for services
   - Write E2E tests for critical flows
   - Test multi-tenancy isolation

### Code Organization Rules

1. **Platform code** → `src/` and `frontend/src/`
2. **Shared code** → `shared/`
3. **App code** → `apps/<app-name>/`
4. **Never duplicate** → Always use shared components/utilities

---

## Integrated Applications

### Mero Board

**Mero Board** is the first integrated application in the Mero Jugx platform, providing comprehensive project and task management capabilities.

**📚 Documentation:**
- **[Mero Board README](./apps/mero-board/README.md)** - Complete feature overview, quick start guide, API endpoints, and usage instructions
- **[Mero Board Architecture](./apps/mero-board/ARCHITECTURE.md)** - Detailed application architecture, database schema, backend/frontend structure, API endpoints, and platform integration details

**Integration Points:**
- **Backend Module:** Registered in `src/app.module.ts` as `MeroBoardModule`
  - Location: `apps/mero-board/backend/`
  - Controllers: Workspace, Project, Task, Epic, Template, Report controllers
  - Services: Business logic with multi-tenancy support
  - Entities: Workspace, WorkspaceMember, TaskComment, TaskAttachment, TaskActivity, Templates
- **Frontend Router:** Integrated via `App.tsx` with route `/org/:slug/app/mero-board/*`
  - Location: `apps/mero-board/frontend/`
  - Pages: Workspaces, Projects, Tasks, Epics, Reports (workspace and project-level)
  - Components: Reusable app-specific components
  - Layout: Custom sidebar navigation with workspace/project hierarchy
- **Database:** Uses platform's multi-tenancy with `organization_id` filtering
  - All entities include `organization_id` for data isolation
  - Workspace-based access control with member roles
  - Cross-project dependencies within organization
- **Authentication:** Uses platform's JWT authentication and organization context
  - Organization context extracted from JWT token
  - Workspace member validation for access control
- **Shared Components:** Leverages `@shared/frontend` components for UI consistency
  - All UI components from shared library
  - Theme system integration
  - Consistent styling and behavior

**Key Features:**
- **Workspace Management**: Create, organize, and manage workspaces with member roles
- **Project Management**: Projects within workspaces with status tracking
- **Task Management**: Comprehensive task tracking with status, priorities, due dates, tags, comments, attachments, dependencies, and time tracking
- **Epic Management**: Group related tasks into epics for managing large features
- **Team Collaboration**: Member invitations, role management, task assignments, activity tracking
- **Templates**: Workspace and project templates (organization-specific and public) with automatic task population
- **Reports & Analytics**: Workspace and project reports with team productivity metrics
- **Multiple Views**: Kanban, List, Calendar, and Gantt chart views
- **Real-time Updates**: Notifications and activity tracking
- **Pagination**: Support for all list endpoints (workspaces, projects, tasks, comments, activities, time logs)

**Architecture Highlights:**
- Follows platform's multi-tenancy patterns
- Uses shared database entities (Project, Task, Epic) from platform core
- App-specific entities (Workspace, WorkspaceMember, TaskComment, etc.) with `organization_id`
- Service layer handles business logic and access control
- Frontend uses React Query for data fetching and caching
- Theme customization throughout all components

For detailed information about Mero Board's architecture, API endpoints, database schema, and development guidelines, see the [Mero Board Architecture documentation](./apps/mero-board/ARCHITECTURE.md).

## Next Steps

1. ✅ Project structure matches architecture
2. ✅ Shared folder organized
3. ✅ First app (Mero Board) integrated and documented
4. 📝 Follow this architecture for all future apps

---

**Last Updated:** 2024-12-29
**Version:** 1.0.0

