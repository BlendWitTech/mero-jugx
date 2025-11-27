# Chat System Implementation Guide

## ✅ Completed Backend Components

### Database Entities
- ✅ `Chat` - Main chat entity (direct and group chats)
- ✅ `ChatMember` - Chat membership with roles (owner, admin, member)
- ✅ `Message` - Messages with support for text, images, files, audio, video
- ✅ `MessageAttachment` - File attachments for messages
- ✅ `MessageReaction` - Emoji reactions to messages
- ✅ `CallSession` - Audio/video call sessions
- ✅ `CallParticipant` - Call participants with media settings

### Backend Services & Controllers
- ✅ `ChatService` - Complete chat management (create, update, delete, messages)
- ✅ `ChatController` - REST API endpoints for chat operations
- ✅ `CallService` - Audio/video call management
- ✅ `CallController` - REST API endpoints for call operations
- ✅ `ChatModule` - Module configuration with all dependencies

### Features Implemented
- ✅ Package-based access control (Platinum/Diamond packages or purchased feature)
- ✅ Permission system for chat management
- ✅ Direct messaging between organization members
- ✅ Group chat creation (with permission check)
- ✅ Message sending with attachments
- ✅ Chat member management (add/remove members)
- ✅ Call initiation and management
- ✅ Audit logging for all chat/call actions

### Package Feature
- ✅ Added "Chat System" feature to package features seed
- ✅ Access check: Platinum/Diamond packages include chat, Basic can purchase separately

### Permissions Added
- ✅ `chat.view` - View and access chats
- ✅ `chat.create_group` - Create new group chats
- ✅ `chat.manage_group` - Manage group chat settings, add/remove members
- ✅ `chat.delete` - Delete chats and messages
- ✅ `chat.initiate_call` - Start audio and video calls

## 🔄 Remaining Tasks

### 1. Database Migration
**Status:** ⚠️ Needs to be created

Run the following command to generate migration:
```bash
npm run migration:generate -- src/database/migrations/CreateChatSystem
```

Then run the migration:
```bash
npm run migration:run
```

### 2. WebSocket Gateway (Real-time Messaging)
**Status:** ⚠️ Needs to be implemented

**Required packages:**
```bash
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
npm install --save-dev @types/socket.io
```

**Create:** `src/chat/chat.gateway.ts`
- Real-time message delivery
- Typing indicators
- Online/offline status
- Call signaling via WebSocket
- Message read receipts

### 3. Frontend Components
**Status:** ⚠️ Needs to be created

#### Required Components:
1. **Chat List Component** (`frontend/src/components/chat/ChatList.tsx`)
   - List of all chats (direct + groups)
   - Unread message indicators
   - Last message preview
   - Online status indicators

2. **Chat Window Component** (`frontend/src/components/chat/ChatWindow.tsx`)
   - Message display area
   - Message input with file upload
   - Message reactions
   - Reply to messages
   - Typing indicators

3. **Group Chat Management** (`frontend/src/components/chat/GroupChatSettings.tsx`)
   - Create group chat
   - Add/remove members
   - Update group name/description
   - Member roles management

4. **Call Interface** (`frontend/src/components/chat/CallInterface.tsx`)
   - Audio/video call UI
   - WebRTC integration
   - Mute/unmute controls
   - Video on/off controls
   - Screen sharing (optional)

5. **Chat Page** (`frontend/src/pages/chat/ChatPage.tsx`)
   - Main chat interface
   - Integrates all chat components
   - WebSocket connection management

#### Required Services:
- `frontend/src/services/chatService.ts` - API calls for chat operations
- `frontend/src/services/websocketService.ts` - WebSocket connection management
- `frontend/src/services/webrtcService.ts` - WebRTC call handling

### 4. WebRTC Implementation
**Status:** ⚠️ Needs frontend implementation

**Required:**
- STUN/TURN server configuration (for NAT traversal)
- WebRTC peer connection setup
- Media stream handling (audio/video)
- Signaling via WebSocket

**Recommended STUN servers:**
- Google STUN: `stun:stun.l.google.com:19302`
- Twilio STUN (if using Twilio)

### 5. File Upload Integration
**Status:** ⚠️ Needs implementation

**Required:**
- File upload service for message attachments
- Image preview/thumbnail generation
- File type validation
- Size limits

### 6. Package Feature Purchase Flow
**Status:** ⚠️ Needs frontend integration

**Required:**
- Check if organization has chat access
- Display upgrade/purchase option if not available
- Integration with existing payment system

## 📋 Next Steps

1. **Generate and run database migration**
   ```bash
   npm run migration:generate -- src/database/migrations/CreateChatSystem
   npm run migration:run
   ```

2. **Install WebSocket dependencies**
   ```bash
   npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
   npm install --save-dev @types/socket.io
   ```

3. **Create WebSocket Gateway**
   - Implement real-time message broadcasting
   - Handle typing indicators
   - Manage online/offline status
   - WebRTC signaling

4. **Create Frontend Components**
   - Start with ChatList and ChatWindow
   - Add WebSocket client connection
   - Implement message sending/receiving
   - Add call interface

5. **Test the System**
   - Test direct messaging
   - Test group chat creation
   - Test permissions
   - Test package feature access
   - Test audio/video calls

## 🔐 Security Considerations

- ✅ All endpoints require authentication
- ✅ Organization membership verification
- ✅ Permission checks for group management
- ✅ Package feature access validation
- ⚠️ WebSocket authentication (needs JWT validation)
- ⚠️ File upload validation and virus scanning
- ⚠️ Rate limiting for messages

## 📝 API Endpoints

### Chat Endpoints
- `POST /chats` - Create chat
- `GET /chats` - List all chats
- `GET /chats/:id` - Get chat details
- `PUT /chats/:id` - Update chat
- `DELETE /chats/:id` - Delete chat
- `POST /chats/:id/members` - Add members
- `DELETE /chats/:id/members/:memberId` - Remove member
- `POST /chats/:id/leave` - Leave chat
- `POST /chats/:id/messages` - Send message
- `GET /chats/:id/messages` - Get messages
- `DELETE /chats/:id/messages/:messageId` - Delete message

### Call Endpoints
- `POST /calls/chats/:chatId` - Initiate call
- `GET /calls/chats/:chatId/active` - Get active call
- `POST /calls/:id/join` - Join call
- `POST /calls/:id/leave` - Leave call
- `POST /calls/:id/end` - End call
- `PUT /calls/:id/media` - Update media settings
- `POST /calls/:id/signal` - WebRTC signaling

## 🎨 UI/UX Recommendations

1. **Chat List Sidebar**
   - Discord-like design (matches current theme)
   - Unread badges
   - Online status indicators
   - Search functionality

2. **Chat Window**
   - Message bubbles with user avatars
   - Timestamp grouping
   - File previews
   - Emoji reactions
   - Reply threading

3. **Call Interface**
   - Floating call window
   - Participant grid for group calls
   - Controls at bottom
   - Screen sharing option

## 📦 Package Requirements

The chat system is available for:
- ✅ **Platinum Package** - Included
- ✅ **Diamond Package** - Included
- ✅ **Basic Package** - Can purchase "Chat System" feature separately ($49.99/month)
- ❌ **Freemium Package** - Not available

