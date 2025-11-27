# Chat Permissions and Package Setup

## ✅ Completed Updates

### 1. Chat Feature Available for Purchase
- ✅ Chat System feature is available in package features seed
- ✅ Price: $49.99/month
- ✅ Available for **all packages** including Basic and Freemium
- ✅ Can be purchased separately by Basic and Freemium package holders

### 2. Automatic Permission Assignment
When chat becomes available to an organization (either by purchase or package upgrade), the system automatically assigns **all chat permissions** to:
- ✅ **Organization Owner** role
- ✅ **Admin** role

**Chat Permissions Automatically Assigned:**
- `chat.view` - View and access chats
- `chat.create_group` - Create new group chats
- `chat.manage_group` - Manage group chat settings, add/remove members
- `chat.delete` - Delete chats and messages
- `chat.initiate_call` - Start audio and video calls

### 3. Manual Permission Management
- ✅ Admin and Organization Owner can manually assign chat permissions to other roles
- ✅ Done through the existing Roles & Permissions management interface
- ✅ Full control over which roles have which chat permissions

### 4. Package Upgrade Handling
- ✅ When upgrading to **Platinum** or **Diamond** package, chat permissions are automatically assigned
- ✅ When **purchasing** chat feature separately, chat permissions are automatically assigned
- ✅ Works for both new purchases and existing organizations

## 🔄 How It Works

### Purchase Flow
1. **Basic/Freemium Package Holder** purchases "Chat System" feature
2. System automatically assigns all chat permissions to Admin and Owner roles
3. Organization can now use chat features
4. Admin/Owner can manually assign permissions to other roles as needed

### Package Upgrade Flow
1. **Basic/Freemium Package Holder** upgrades to **Platinum** or **Diamond**
2. System automatically assigns all chat permissions to Admin and Owner roles
3. Chat is included in the package, no separate purchase needed

### Permission Management
- **Automatic**: Admin and Owner get all chat permissions when chat becomes available
- **Manual**: Admin and Owner can assign specific chat permissions to custom roles
- **Flexible**: Each role can have different chat permission combinations

## 📋 Implementation Details

### Files Updated

1. **`src/database/seeds/003-roles.seed.ts`**
   - Added all chat permissions to Admin role seed
   - Organization Owner already gets all permissions automatically

2. **`src/packages/packages.service.ts`**
   - Added `assignChatPermissionsToAdminAndOwner()` method
   - Automatically called when chat feature is purchased
   - Automatically called when upgrading to Platinum/Diamond
   - Imports `Permission` and `RolePermission` entities

3. **`src/database/seeds/004-package-features.seed.ts`**
   - Chat System feature already available for purchase
   - Available to all packages (Basic, Freemium, Platinum, Diamond)

4. **`src/chat/chat.service.ts`**
   - `hasChatAccess()` method checks:
     - Platinum/Diamond packages (included)
     - Purchased chat feature (for Basic/Freemium)

## 🎯 Access Control Summary

### Who Can Use Chat?

| Package | Chat Access | How to Get |
|---------|-------------|------------|
| **Freemium** | ✅ Yes | Purchase "Chat System" feature ($49.99/mo) |
| **Basic** | ✅ Yes | Purchase "Chat System" feature ($49.99/mo) |
| **Platinum** | ✅ Yes | Included in package |
| **Diamond** | ✅ Yes | Included in package |

### Who Gets Permissions Automatically?

| Role | Auto Permissions | Can Assign to Others? |
|------|------------------|------------------------|
| **Organization Owner** | ✅ All chat permissions | ✅ Yes |
| **Admin** | ✅ All chat permissions | ✅ Yes |
| **Custom Roles** | ❌ No (manual assignment) | ❌ No (only Admin/Owner can assign) |

## 🔐 Permission Details

### Chat Permissions Available

1. **`chat.view`** - View and access chats
   - Required for: Viewing chat list, opening chats, reading messages

2. **`chat.create_group`** - Create new group chats
   - Required for: Creating group chats (not needed for direct messages)

3. **`chat.manage_group`** - Manage group chat settings
   - Required for: Adding/removing members, updating group settings

4. **`chat.delete`** - Delete chats and messages
   - Required for: Deleting chats, deleting messages

5. **`chat.initiate_call`** - Start audio and video calls
   - Required for: Initiating calls (all members can join if invited)

## 🚀 Usage Examples

### Example 1: Basic Package Purchases Chat
1. Organization on Basic package
2. Owner purchases "Chat System" feature
3. ✅ Admin and Owner automatically get all chat permissions
4. ✅ Organization can now use chat
5. Owner assigns `chat.view` and `chat.initiate_call` to "Employee" role
6. Employees can view chats and join calls, but can't create groups

### Example 2: Freemium Upgrades to Platinum
1. Organization on Freemium package
2. Owner upgrades to Platinum package
3. ✅ Chat is included in Platinum
4. ✅ Admin and Owner automatically get all chat permissions
5. ✅ Organization can now use chat

### Example 3: Custom Role Setup
1. Organization has chat available
2. Owner creates "Team Lead" custom role
3. Owner assigns `chat.view`, `chat.create_group`, `chat.manage_group` to Team Lead
4. Team Leads can create and manage group chats
5. Team Leads cannot delete chats or initiate calls (not assigned)

## 📝 Notes

1. **System Roles**: Admin and Owner are system roles that get permissions automatically
2. **Custom Roles**: Must be manually assigned permissions by Admin or Owner
3. **Permission Inheritance**: No inheritance - each role must be explicitly assigned permissions
4. **Feature Purchase**: Available through Packages page → Purchase Features
5. **Permission Management**: Available through Roles & Permissions page

## ✅ Verification

After resetting the database, verify:
1. Chat System feature exists in `package_features` table
2. Chat permissions exist in `permissions` table (5 permissions)
3. Admin role has all chat permissions in `role_permissions` table
4. Organization Owner role has all chat permissions (via "all permissions" logic)

