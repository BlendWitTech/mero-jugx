# Strategic Development Plan

## Overview
This document outlines the strategic plan for implementing role management, document storage, and UI improvements based on Discord-like design patterns.

---

## Phase 1: Role Management System Enhancement

### 1.1 Default Roles System
**Objective:** Ensure default roles (Organization Owner, Admin) are visible and properly managed for all organizations.

**Tasks:**
- [x] Backend: Default roles already seeded (`organization-owner`, `admin`)
- [ ] Backend: Update `getRoles()` to include system/default roles for all organizations
- [ ] Backend: Create endpoint to get available role templates based on package
- [ ] Frontend: Display default roles separately from custom roles
- [ ] Frontend: Show default roles as non-editable/non-deletable with badges

**Implementation:**
- Modify `roles.service.ts` to return both organization roles AND system default roles
- Add `GET /roles/templates` endpoint to fetch predefined roles based on package
- Update RolesPage to show two sections: "Default Roles" and "Custom Roles"
- Add visual distinction (badges, icons) for system vs custom roles

### 1.2 Predefined Role Templates
**Objective:** Create a system where organizations can select from predefined roles based on their package.

**Tasks:**
- [ ] Backend: Create `role_templates` table or use existing system roles
- [ ] Backend: Create seed data for predefined roles (Manager, Editor, Viewer, etc.)
- [ ] Backend: Create endpoint `GET /roles/templates?package_id=X`
- [ ] Backend: Create endpoint `POST /roles/from-template` to create role from template
- [ ] Frontend: Create "Select Role Template" modal/interface
- [ ] Frontend: Show available templates based on current package
- [ ] Frontend: Allow customization of template before creating

**Database Schema:**
```sql
-- Role templates (predefined roles available per package)
CREATE TABLE role_templates (
  id SERIAL PRIMARY KEY,
  package_id INTEGER REFERENCES packages(id),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  permission_ids INTEGER[],
  is_active BOOLEAN DEFAULT true
);
```

### 1.3 Role Assignment Flow
**Objective:** Implement streamlined flow: Select Role → Assign to User → Set Permissions → Save

**Tasks:**
- [ ] Frontend: Create "Assign Role" wizard/multi-step form
  - Step 1: Select role (from templates or existing)
  - Step 2: Select user(s)
  - Step 3: Customize permissions (if needed)
  - Step 4: Review and save
- [ ] Backend: Create `POST /roles/assign-bulk` endpoint
- [ ] Frontend: Add bulk role assignment feature
- [ ] Frontend: Show role assignment history/audit trail

---

## Phase 2: Organization Documents Management

### 2.1 Document Storage System
**Objective:** Add document storage and management capabilities to organizations.

**Tasks:**
- [ ] Backend: Create `organization_documents` table
- [ ] Backend: Create document upload endpoint
- [ ] Backend: Create document management endpoints (list, download, delete)
- [ ] Backend: Add file storage service (local/S3)
- [ ] Frontend: Add "Documents" section to organization details
- [ ] Frontend: Create document upload interface
- [ ] Frontend: Create document list/gallery view
- [ ] Frontend: Add document categories/tags

**Database Schema:**
```sql
CREATE TABLE organization_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_type VARCHAR(50),
  file_size BIGINT,
  category VARCHAR(100),
  description TEXT,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  deleted_at TIMESTAMP
);
```

### 2.2 Document Categories
**Objective:** Organize documents by type/category for better management.

**Categories:**
- Legal Documents (Contracts, Agreements, Licenses)
- Financial Documents (Invoices, Receipts, Tax Documents)
- Identity Documents (Registration, Certificates)
- Operational Documents (Policies, Procedures, Manuals)
- Marketing Materials (Logos, Branding, Assets)

**Tasks:**
- [ ] Backend: Add document category enum/table
- [ ] Frontend: Add category filter and organization
- [ ] Frontend: Create document preview functionality

### 2.3 Organization Details Enhancement
**Objective:** Expand organization details form to include document upload and additional fields.

**New Fields:**
- Tax ID / Registration Number
- Business License Number
- Industry/Sector
- Company Size
- Founded Date
- Legal Entity Type
- Documents Section (upload, view, manage)

**Tasks:**
- [ ] Backend: Add new fields to `organizations` table (migration)
- [ ] Backend: Update `UpdateOrganizationDto`
- [ ] Frontend: Add new form fields to OrganizationsPage
- [ ] Frontend: Add document upload section
- [ ] Frontend: Add document gallery/preview

---

## Phase 3: UI/UX Improvements (Discord-like Design)

### 3.1 Dropdown Menu System
**Objective:** Fix dropdown menus to appear above table borders with Discord-like styling.

**Status:** ✅ In Progress
- [x] Fixed z-index and positioning
- [x] Added backdrop overlay
- [ ] Improve styling to match Discord (rounded corners, shadows, spacing)
- [ ] Add smooth animations
- [ ] Ensure proper positioning on scroll

### 3.2 Responsive Design
**Objective:** Make all pages fully responsive.

**Status:** ✅ Dashboard Done
- [x] Dashboard responsive
- [ ] Users page responsive
- [ ] Roles page responsive
- [ ] Organizations page responsive
- [ ] All modals responsive
- [ ] Tables responsive (horizontal scroll on mobile)

### 3.3 Design System Consistency
**Objective:** Create consistent design language inspired by Discord.

**Design Elements:**
- **Colors:** Dark theme option, consistent color palette
- **Typography:** Clear hierarchy, readable fonts
- **Spacing:** Consistent padding and margins
- **Shadows:** Subtle, layered shadows for depth
- **Borders:** Rounded corners, subtle borders
- **Hover States:** Smooth transitions
- **Icons:** Consistent icon library (Lucide React)

**Tasks:**
- [ ] Create design tokens file (colors, spacing, typography)
- [ ] Update all components to use design tokens
- [ ] Add dark mode support
- [ ] Create reusable component library
- [ ] Add loading skeletons (better than spinners)
- [ ] Improve empty states

---

## Phase 4: Role Selection & Assignment Flow

### 4.1 Role Selection Interface
**Objective:** Create intuitive role selection interface similar to Discord's role picker.

**Features:**
- Visual role cards with colors
- Role preview (permissions list)
- Search/filter roles
- Group by: Default, Custom, Templates
- Show role usage (how many users)

**Tasks:**
- [ ] Create RoleSelector component
- [ ] Add role colors (like Discord)
- [ ] Add role preview modal
- [ ] Add search functionality
- [ ] Add filtering by type

### 4.2 User-Role Assignment Interface
**Objective:** Streamlined interface for assigning roles to users.

**Features:**
- Multi-select users
- Role dropdown/search
- Permission customization (optional)
- Bulk assignment
- Assignment history

**Tasks:**
- [ ] Create UserRoleAssignment component
- [ ] Add multi-select user picker
- [ ] Add role selection dropdown
- [ ] Add permission customization panel
- [ ] Add bulk operations
- [ ] Show assignment confirmation

---

## Phase 5: Package-Based Role Templates

### 5.1 Role Template System
**Objective:** Define role templates available per package.

**Template Structure:**
```typescript
interface RoleTemplate {
  id: number;
  package_id: number;
  name: string;
  slug: string;
  description: string;
  default_permissions: number[];
  is_default: boolean; // Available to all packages
}
```

**Default Templates (All Packages):**
1. **Organization Owner** - Full access
2. **Admin** - Most permissions except package management

**Package-Specific Templates:**
- **Starter Package:** Manager, Member
- **Professional Package:** Manager, Editor, Viewer, Member
- **Enterprise Package:** All above + Custom roles

**Tasks:**
- [ ] Create role template seed data
- [ ] Backend: `GET /roles/templates` endpoint
- [ ] Backend: `POST /roles/from-template` endpoint
- [ ] Frontend: Template selection UI
- [ ] Frontend: Template preview with permissions

---

## Implementation Priority

### High Priority (Week 1)
1. ✅ Fix dropdown menu z-index and positioning
2. ✅ Make dashboard responsive
3. Show default roles in RolesPage
4. Add document storage backend (table, endpoints)
5. Add document upload to organization details

### Medium Priority (Week 2)
1. Role template system (backend)
2. Role selection interface (frontend)
3. User-role assignment flow
4. Document management UI
5. Organization details enhancement

### Low Priority (Week 3)
1. Dark mode support
2. Design system tokens
3. Advanced role customization
4. Document categories and filtering
5. Bulk operations

---

## Technical Considerations

### Backend Changes Needed
1. **New Tables:**
   - `organization_documents`
   - `role_templates` (or extend existing roles table)

2. **New Endpoints:**
   - `GET /roles/templates` - Get available role templates
   - `POST /roles/from-template` - Create role from template
   - `GET /organizations/me/documents` - List organization documents
   - `POST /organizations/me/documents` - Upload document
   - `DELETE /organizations/me/documents/:id` - Delete document

3. **Modified Endpoints:**
   - `GET /roles` - Include system/default roles
   - `PUT /organizations/me` - Accept new fields (tax_id, etc.)

### Frontend Changes Needed
1. **New Components:**
   - `RoleSelector` - Role selection component
   - `UserRoleAssignment` - Assignment wizard
   - `DocumentUpload` - File upload component
   - `DocumentGallery` - Document display component
   - `RoleTemplateCard` - Template preview card

2. **Modified Components:**
   - `RolesPage` - Show default + custom roles
   - `OrganizationsPage` - Add document section
   - `UsersPage` - Improve role assignment flow
   - All dropdown menus - Fix positioning

3. **New Pages:**
   - `/documents` - Document management page (optional)

---

## Design Guidelines (Discord-Inspired)

### Color Palette
- **Primary:** Blue/Purple gradient
- **Background:** Light gray (#F9FAFB) / Dark gray (#2F3136)
- **Cards:** White (#FFFFFF) / Dark gray (#36393F)
- **Borders:** Subtle gray (#E5E7EB) / Dark gray (#40444B)
- **Text:** Dark gray (#111827) / Light gray (#DCDDDE)
- **Accents:** Primary colors for actions

### Typography
- **Headings:** Bold, clear hierarchy
- **Body:** Readable, adequate line-height
- **Labels:** Small, uppercase for form labels
- **Code/IDs:** Monospace font

### Spacing
- **Card Padding:** 16px (mobile) / 24px (desktop)
- **Section Spacing:** 24px (mobile) / 32px (desktop)
- **Element Spacing:** 8px, 12px, 16px, 24px scale

### Components
- **Buttons:** Rounded (8px), clear hover states
- **Inputs:** Rounded (6px), subtle borders
- **Cards:** Rounded (12px), subtle shadows
- **Modals:** Centered, backdrop blur
- **Dropdowns:** Rounded (8px), shadow-xl, z-index 100+

---

## Success Metrics

1. **Role Management:**
   - Default roles visible to all organizations ✅
   - Role templates selectable based on package
   - Smooth role assignment flow

2. **Document Management:**
   - Documents uploadable and viewable
   - Documents organized by category
   - Document access controlled by permissions

3. **UI/UX:**
   - All dropdowns appear above content ✅
   - All pages responsive ✅
   - Consistent design language
   - Smooth animations and transitions

---

## Next Steps

1. **Immediate (Today):**
   - Complete dropdown menu fixes
   - Review and approve this plan

2. **This Week:**
   - Implement default roles display
   - Create document storage backend
   - Add document upload to organization details

3. **Next Week:**
   - Implement role template system
   - Create role selection interface
   - Enhance user-role assignment flow

