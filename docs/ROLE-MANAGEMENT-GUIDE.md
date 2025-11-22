# Role Management Guide for Organizations

Complete guide on how organizations can select roles and assign permissions based on their package.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Package-Based Role System](#package-based-role-system)
3. [How to Create Roles](#how-to-create-roles)
4. [How to Assign Permissions](#how-to-assign-permissions)
5. [Role Customization Options](#role-customization-options)
6. [Step-by-Step Workflow](#step-by-step-workflow)
7. [Best Practices](#best-practices)
8. [Limitations and Restrictions](#limitations-and-restrictions)

---

## 🎯 Overview

The Mero Jugx platform uses a **package-based role system** where:

- **Packages determine** what role templates are available
- **Organizations create roles** from templates provided by their package
- **Organizations customize** permissions for each role they create
- **Roles are assigned** to users to control their access and capabilities

---

## 📦 Package-Based Role System

### Package Tiers and Role Limits

| Package | Role Limit | Available Templates | Customization |
|---------|-----------|-------------------|---------------|
| **Freemium** | 2 (default only) | None | No |
| **Basic** | 5 custom roles | Basic templates | Full |
| **Professional** | 10 custom roles | Professional templates | Full |
| **Enterprise** | Unlimited | All templates | Full |

### Default Roles (Available to All Packages)

1. **Organization Owner**
   - Fixed permissions (cannot be modified)
   - Full access to all features
   - Cannot be assigned to other users
   - Only one per organization

2. **Admin**
   - Fixed permissions (cannot be modified)
   - Most administrative capabilities
   - Can be assigned to multiple users

### Custom Roles (Package-Dependent)

- Only available for **paid packages** (Basic, Professional, Enterprise)
- Created from **role templates** provided by the package
- **Fully customizable** permissions
- Count against the organization's role limit

---

## 🛠️ How to Create Roles

### Step 1: Access Role Templates

1. Navigate to **Roles & Permissions** page
2. Click **"Create Role from Template"** button
3. View available templates for your package

### Step 2: Select a Template

Each template includes:
- **Predefined name and description**
- **Default permissions** (suggested permissions for that role type)
- **Template category** (e.g., Manager, Employee, Viewer)

**Example Templates:**
- **Manager Template**: Includes user management, role assignment permissions
- **Employee Template**: Includes basic access, document viewing permissions
- **Viewer Template**: Read-only access to most features

### Step 3: Create Role from Template

**Option A: Quick Create (Use Template As-Is)**
- Click **"Use Template"** on any template
- Role is created with template's default permissions
- You can edit permissions later

**Option B: Custom Create (Coming Soon)**
- Select template
- Customize permissions before creating
- Add or remove permissions from template defaults

### Step 4: Verify Role Creation

- Role appears in **"Custom Roles"** section
- Shows permission count
- Can be edited or deleted (if no users assigned)

---

## 🔐 How to Assign Permissions

### Method 1: Edit Existing Role

1. Go to **Roles & Permissions** page
2. Find the role you want to modify
3. Click **Edit** button (pencil icon)
4. In the **Edit Role** modal:
   - Modify role name, slug, description
   - **Select/Deselect permissions** using checkboxes
   - Permissions are organized by category:
     - **Users**: View, edit, invite, remove users
     - **Roles**: View, create, edit, delete roles
     - **Organizations**: View, edit organization settings
     - **Packages**: View, upgrade packages
     - **Invitations**: Create, view, cancel invitations
     - **Audit**: View audit logs
     - **MFA**: Manage multi-factor authentication
     - **Security**: Security alerts and notifications
5. Click **"Save Changes"**

### Method 2: Custom Permissions When Creating (Advanced)

When creating a role from template, you can:

1. **Use Template Permissions + Add More**
   - Start with template's default permissions
   - Add additional permissions as needed
   - Use `additional_permission_ids` parameter

2. **Fully Customize Permissions**
   - Ignore template permissions completely
   - Select only the permissions you want
   - Use `custom_permission_ids` parameter

**Note**: Currently, the frontend uses quick create. Full customization can be done via API or by editing the role after creation.

---

## 🎨 Role Customization Options

### What Can Be Customized

✅ **Role Name**: Change the display name
✅ **Role Slug**: Unique identifier (auto-generated from name)
✅ **Description**: Add description of role's purpose
✅ **Permissions**: Full control over which permissions are assigned
✅ **Active Status**: Enable/disable role

### What Cannot Be Customized

❌ **Default Roles**: Organization Owner and Admin cannot be modified
❌ **System Roles**: System-defined roles cannot be changed
❌ **Role Limit**: Determined by package (upgrade package to increase)

---

## 📝 Step-by-Step Workflow

### Complete Example: Creating a "Project Manager" Role

#### Scenario:
- Organization has **Basic Package** (5 custom roles limit)
- Needs a role for project managers with specific permissions

#### Steps:

1. **Navigate to Roles Page**
   ```
   Dashboard → Roles & Permissions
   ```

2. **Click "Create Role from Template"**
   - Modal opens showing available templates
   - Select "Manager Template" (has user management permissions)

3. **Create Role**
   - Click "Use Template"
   - Role "Manager" is created with default permissions

4. **Edit the Role**
   - Click Edit button on the newly created role
   - Change name to "Project Manager"
   - Update description: "Manages projects and team members"

5. **Customize Permissions**
   - **Keep**: Users (view, edit), Roles (view), Organizations (view)
   - **Add**: Packages (view), Invitations (create, view)
   - **Remove**: Users (remove), Roles (delete)
   - Click "Save Changes"

6. **Assign to Users**
   - Go to Users page
   - Select a user
   - Click "Change Role"
   - Select "Project Manager"
   - Confirm assignment

7. **Verify**
   - User now has Project Manager role
   - User can access features based on assigned permissions
   - Role appears in role usage counts

---

## 💡 Best Practices

### 1. Start with Templates
- Use templates as starting points
- They provide sensible default permissions
- Easier than creating from scratch

### 2. Follow Principle of Least Privilege
- Only assign permissions users actually need
- Start with minimal permissions, add as needed
- Review permissions regularly

### 3. Use Descriptive Names
- Name roles clearly (e.g., "Sales Manager" not "Role 1")
- Add descriptions explaining the role's purpose
- Makes management easier as organization grows

### 4. Document Custom Roles
- Keep track of which roles have which permissions
- Document why certain permissions were assigned
- Helps with audits and compliance

### 5. Regular Review
- Review roles and permissions quarterly
- Remove unused roles
- Update permissions based on actual usage

### 6. Plan for Growth
- Consider role limit when choosing package
- Basic (5 roles) may be enough for small teams
- Professional (10 roles) for medium organizations
- Enterprise (unlimited) for large organizations

---

## ⚠️ Limitations and Restrictions

### Package-Based Limitations

1. **Freemium Package**
   - ❌ Cannot create custom roles
   - ❌ Only default roles (Owner, Admin) available
   - ✅ Can assign default roles to users
   - 💡 **Solution**: Upgrade to Basic or higher package

2. **Role Limit Reached**
   - ❌ Cannot create more roles when limit is reached
   - ✅ Can delete unused roles to free up space
   - ✅ Can upgrade package to increase limit
   - 💡 **Tip**: Delete roles with 0 users assigned

### Permission Restrictions

1. **Default Roles**
   - Organization Owner and Admin have fixed permissions
   - Cannot be modified (security requirement)
   - Permissions are consistent across all organizations

2. **System Roles**
   - Some roles are system-defined
   - Cannot be edited or deleted
   - Required for platform functionality

### Assignment Restrictions

1. **Organization Owner**
   - Cannot be assigned to other users
   - Only one per organization
   - Cannot be changed or removed

2. **Role Deletion**
   - Cannot delete roles with assigned users
   - Must reassign users first
   - Then delete the role

---

## 🔄 Workflow Summary

```
┌─────────────────────────────────────────────────────────┐
│ 1. Purchase Package (Basic/Professional/Enterprise)    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Navigate to Roles & Permissions Page                │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Click "Create Role from Template"                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Select Template (Manager, Employee, etc.)            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 5. Create Role (Quick or Custom)                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 6. Edit Role (Optional)                                │
│    - Change name/description                           │
│    - Customize permissions                             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 7. Assign Role to Users                                │
│    - Go to Users page                                  │
│    - Select user                                       │
│    - Change role                                       │
└─────────────────────────────────────────────────────────┘
```

---

## 📚 Additional Resources

- [Organization User Guide](./ORGANIZATION-USER-GUIDE.md) - General user guide
- [Package Management](./PACKAGE-MANAGEMENT.md) - Understanding packages
- [Permission Reference](./PERMISSIONS-REFERENCE.md) - Complete permission list (if available)

---

## ❓ Frequently Asked Questions

### Q: Can I create roles without templates?
**A**: Currently, roles must be created from templates. This ensures consistency and provides sensible defaults. You can fully customize permissions after creation.

### Q: What happens if I upgrade my package?
**A**: 
- New role templates become available
- Role limit increases (if applicable)
- Existing roles remain unchanged
- You can create more roles up to the new limit

### Q: Can I copy a role?
**A**: Not directly, but you can:
1. Create a role from the same template
2. Edit it to match the original role's permissions
3. Or use the API with `custom_permission_ids` to replicate permissions

### Q: What if I need more roles than my package allows?
**A**: Upgrade to a higher package tier:
- Basic → Professional (5 to 10 roles)
- Professional → Enterprise (10 to unlimited)

### Q: Can I change permissions of default roles?
**A**: No. Organization Owner and Admin have fixed permissions for security and consistency. Create custom roles if you need different permission sets.

### Q: How do I know which permissions a role has?
**A**: 
- View role details on Roles page
- Click to expand and see all permissions
- Permissions are grouped by category for easy viewing

---

**Last Updated**: 2025-11-22

