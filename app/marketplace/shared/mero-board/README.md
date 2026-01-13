# Mero Board

A comprehensive project and task management application integrated into the Mero Jugx platform.

## Overview

Mero Board enables organizations to manage their projects and tasks efficiently through workspace-based organization, team collaboration, and powerful task management features.

## Features

### ✅ Core Features

- **Workspace Management**
  - Create and organize workspaces
  - Workspace member management
  - Role-based access control (Owner, Admin, Member)
  - Workspace templates for quick setup

- **Project Management**
  - Create projects within workspaces
  - Project status tracking
  - Project templates
  - Template-based project creation

- **Task Management**
  - Create and manage tasks
  - Task assignment to team members
  - Task status workflow (Todo → In Progress → In Review → Done)
  - Task priorities (Low, Medium, High, Urgent)
  - Due dates and reminders
  - Task tags for organization
  - Task comments and discussions (with pagination)
  - Task attachments
  - Task activity timeline (with pagination)
  - Task dependencies (Blocks, Blocked By, Related)
  - Time tracking and logging (with pagination)
  - Advanced filtering and search
  - Multiple sorting options
  - Pagination support

- **Epic Management** ⭐ NEW
  - Create and manage epics
  - Epic status tracking (Planning, In Progress, Completed, Cancelled)
  - Epic assignment to team members
  - Epic start and end dates
  - Epic list view with pagination
  - Organize tasks by epic

- **Team Collaboration**
  - Workspace member invitations
  - Member role management
  - Task assignments
  - Activity tracking
  - Real-time notifications

- **Templates** ⭐ ENHANCED
  - Project templates (organization-specific and public)
  - Workspace templates (organization-specific and public)
  - Quick project/workspace setup from templates
  - **Automatic task population**: When using a workspace template, projects are automatically populated with tasks from matching project templates

- **Notifications**
  - Task creation notifications
  - Task assignment notifications
  - Task update notifications
  - Task comment notifications
  - All notifications appear in main dashboard

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for complete architecture documentation.

## Quick Start

### Prerequisites

- Mero Jugx platform running
- Organization account
- App access granted

### Accessing Mero Board

1. Navigate to Apps in your organization dashboard
2. Open Mero Board
3. Start creating workspaces and projects

## Usage Guide

### Creating a Workspace

1. Click "Create Workspace" button
2. Enter workspace name and description
3. Optionally select a workspace template
4. Click "Create"
5. **When using a template**: The workspace will be created with all projects from the template, and each project will be automatically populated with tasks from matching project templates

### Creating a Project

1. Navigate to a workspace
2. Click "Create Project"
3. Enter project details
4. Optionally select a project template
5. Click "Create"

### Managing Tasks

1. Navigate to a project
2. Click "Create Task"
3. Fill in task details (title, description, assignee, due date, tags)
4. Set priority and status
5. Click "Create"

### Inviting Team Members

1. Navigate to workspace members
2. Click "Invite Member"
3. Enter member email (must be organization member)
4. Select role
5. If member doesn't have app access, invitation will be sent automatically
6. Member accepts invitation from main dashboard

## API Documentation

### Reports Endpoints

```
# Workspace Reports (accessible from workspace reports page)
GET    /apps/:appSlug/workspaces/:workspaceId/report             # Workspace report
GET    /apps/:appSlug/workspaces/:workspaceId/productivity       # Team productivity (workspace-based)

# Project Reports (accessible from project reports page)
GET    /apps/:appSlug/projects/:projectId/report                 # Project report
GET    /apps/:appSlug/projects/:projectId/productivity           # Team productivity (project-based)
```

### Workspace Endpoints

## Development

### Project Structure

```
apps/mero-board/
├── backend/              # Backend module
│   ├── entities/        # Database entities
│   ├── dto/            # Data transfer objects
│   ├── services/       # Business logic
│   ├── controllers/    # API endpoints
│   └── mero-board.module.ts
│
└── frontend/            # Frontend module
    ├── pages/          # Page components
    ├── components/    # App-specific components
    ├── layouts/       # App layouts
    └── MeroBoardRouter.tsx
```

### Adding Features

1. Create backend entity (if needed)
2. Create DTOs
3. Implement service methods
4. Create controller endpoints
5. Create frontend page/component
6. Add route
7. Test multi-tenancy isolation

## Integration

Mero Board integrates with:
- **Platform Authentication**: Uses platform JWT and organization context
- **Notification System**: Sends notifications to main dashboard
- **App Invitation System**: Checks app access for workspace invitations
- **Shared Components**: Uses all shared UI components
- **Theme System**: Follows platform theme

## Support

For issues, questions, or feature requests, please contact support through the platform's ticket system.

## API Documentation

### Workspace Endpoints

```
GET    /apps/:appSlug/workspaces?page=1&limit=20
POST   /apps/:appSlug/workspaces
GET    /apps/:appSlug/workspaces/:id
PUT    /apps/:appSlug/workspaces/:id
DELETE /apps/:appSlug/workspaces/:id
POST   /apps/:appSlug/workspaces/:id/members
PUT    /apps/:appSlug/workspaces/:id/members/:memberId/role
DELETE /apps/:appSlug/workspaces/:id/members/:memberId
```

### Project Endpoints

```
GET    /apps/:appSlug/projects?workspaceId=:id&page=1&limit=20
POST   /apps/:appSlug/projects
GET    /apps/:appSlug/projects/:id
PUT    /apps/:appSlug/projects/:id
DELETE /apps/:appSlug/projects/:id
```

### Task Endpoints

```
GET    /apps/:appSlug/projects/:projectId/tasks?page=1&limit=20
POST   /apps/:appSlug/projects/:projectId/tasks
GET    /apps/:appSlug/projects/:projectId/tasks/:id
PUT    /apps/:appSlug/projects/:projectId/tasks/:id
DELETE /apps/:appSlug/projects/:projectId/tasks/:id
POST   /apps/:appSlug/projects/:projectId/tasks/:id/comments
GET    /apps/:appSlug/projects/:projectId/tasks/:id/comments?page=1&limit=50
POST   /apps/:appSlug/projects/:projectId/tasks/:id/attachments
GET    /apps/:appSlug/projects/:projectId/tasks/:id/activities?page=1&limit=50
POST   /apps/:appSlug/projects/:projectId/tasks/:id/dependencies
POST   /apps/:appSlug/projects/:projectId/tasks/:id/time-logs
GET    /apps/:appSlug/projects/:projectId/tasks/:id/time-logs?page=1&limit=50
```

### Epic Endpoints

```
GET    /apps/:appSlug/projects/:projectId/epics?page=1&limit=20
POST   /apps/:appSlug/projects/:projectId/epics
GET    /apps/:appSlug/projects/:projectId/epics/:id
PUT    /apps/:appSlug/projects/:projectId/epics/:id
DELETE /apps/:appSlug/projects/:projectId/epics/:id
```

### Template Endpoints

```
# Project Templates
GET    /apps/:appSlug/project-templates
POST   /apps/:appSlug/project-templates
POST   /apps/:appSlug/project-templates/use

# Workspace Templates
GET    /apps/:appSlug/workspace-templates
POST   /apps/:appSlug/workspace-templates
POST   /apps/:appSlug/workspace-templates/use
```

**Note**: When using a workspace template, the system automatically populates projects with tasks from matching project templates for a fully functional setup.

### Reports Endpoints

```
# Workspace Reports (accessible from workspace reports page)
GET    /apps/:appSlug/workspaces/:workspaceId/report             # Workspace report
GET    /apps/:appSlug/workspaces/:workspaceId/productivity       # Team productivity (workspace-based)

# Project Reports (accessible from project reports page)
GET    /apps/:appSlug/projects/:projectId/report                 # Project report
GET    /apps/:appSlug/projects/:projectId/productivity           # Team productivity (project-based)
```

**Report Types:**
- **Workspace Report**: Overall workspace statistics, project breakdown, completion rates
- **Project Report**: Project-specific statistics, task breakdown, time tracking, team stats
- **Team Productivity Report**: Available for both workspaces and projects, shows individual member productivity, tasks assigned/completed, time logged, and completion rates

For complete API documentation, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Platform Documentation

Mero Board is an integrated application within the Mero Jugx platform. For platform-level documentation:

- **[Mero Jugx README](../../README.md)** - Platform overview, quick start, key features, and integrated applications
- **[Mero Jugx Architecture](../../ARCHITECTURE.md)** - Complete platform architecture, multi-tenancy patterns, app development guidelines, and Mero Board integration details
- **[Mero Jugx Setup Guide](../../SETUP.md)** - Platform setup, installation instructions, and Mero Board setup information

## Troubleshooting

### Common Issues

**Templates not showing:**
- Run database seeds: `npm run seed:run` (from project root)
- Ensure you're logged in to an organization with Mero Board access

**Cannot create workspace/project:**
- Verify you have app access in your organization
- Check database migrations: `npm run migration:run`
- Ensure you're a member of the organization

**Tasks not loading:**
- Check project ID in URL
- Verify workspace membership
- Check browser console for API errors

**Member invitations not working:**
- Ensure the user is a member of your organization
- Check app access permissions
- Verify email notifications are configured

## Support

For issues, questions, or feature requests:
- Check the [Mero Board Architecture](./ARCHITECTURE.md) for technical details
- Review [Platform Documentation](../../README.md) for platform-level help
- Contact support through the platform's ticket system

---

**Version**: 1.1.0  
**Last Updated**: 2024-12-29

**Changelog:**
- ✅ Added comprehensive API documentation
- ✅ Enhanced troubleshooting section
- ✅ Improved cross-references to platform documentation
- ✅ Added template usage instructions

