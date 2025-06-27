# Mongolian Threads Chat App

A modern threaded chat application inspired by Instagram Threads, built with React, Node.js, Express, and MongoDB. Features a black and white minimalist design with full Mongolian language support.

## Features

- 🎨 **Modern UI**: Black & white minimalist design
- 🇲🇳 **Mongolian Support**: Full UTF-8 support with Mongolian fonts and date formatting
- 💬 **Real-time Chat**: Socket.IO powered real-time messaging
- 🧵 **Threaded Messages**: Support for message replies and threading
- 👥 **Group Chats**: Both one-on-one and group conversations
- 📱 **Responsive**: Works on both desktop and mobile
- 🌙 **Dark/Light Mode**: Theme toggle functionality
- 🔐 **Authentication**: JWT-based user authentication
- 📊 **MongoDB**: Scalable database with Mongoose ODM
- ⚡ **Real-time Features**: Typing indicators, online status, read receipts

## Tech Stack

### Frontend
- React 18
- Tailwind CSS
- Socket.IO Client
- Lucide React Icons
- Date-fns (with timezone support)

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- Socket.IO
- JWT Authentication
- bcryptjs for password hashing

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd messenger
```

### 2. Install Frontend Dependencies
```bash
npm install
```

### 3. Install Backend Dependencies
```bash
cd server
npm install
```

### 4. Set up MongoDB
Make sure MongoDB is running on your system. The app will connect to `mongodb://localhost:27017/mongolian_chat` by default.

### 5. Configure Environment Variables

Create a `.env` file in the server directory:
```bash
cd server
cp config.env .env
```

Edit the `.env` file with your configuration:
```env
MONGODB_URI=mongodb://localhost:27017/mongolian_chat
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=5000
NODE_ENV=development
```

### 6. Start the Backend Server
```bash
cd server
npm run dev
```

The backend will start on `http://localhost:5000`

### 7. Start the Frontend Development Server
```bash
# In a new terminal, from the root directory
npm start
```

The frontend will start on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/logout` - Logout user

### Chats
- `GET /api/chats` - Get all chats for current user
- `POST /api/chats` - Create a new chat
- `GET /api/chats/:id` - Get chat by ID
- `GET /api/chats/:id/messages` - Get messages for a chat
- `POST /api/chats/:id/messages` - Send a message
- `PUT /api/chats/:id/messages/:messageId` - Edit a message
- `DELETE /api/chats/:id/messages/:messageId` - Delete a message

## Socket.IO Events

### Client to Server
- `authenticate` - Authenticate user with JWT token
- `join_chat` - Join a chat room
- `leave_chat` - Leave a chat room
- `send_message` - Send a message
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator

### Server to Client
- `new_message` - New message received
- `user_typing` - User typing indicator
- `user_status_change` - User online/offline status change

## Database Schema

### User Model
- `name` - User's display name
- `username` - Unique username
- `email` - Unique email address
- `password` - Hashed password
- `avatar` - Profile picture URL
- `status` - Online/offline/away status
- `lastSeen` - Last seen timestamp
- `friends` - Array of friend user IDs
- `blockedUsers` - Array of blocked user IDs

### Chat Model
- `type` - 'direct' or 'group'
- `name` - Group name (for group chats)
- `participants` - Array of participant user IDs
- `admins` - Array of admin user IDs (for groups)
- `lastMessage` - Last message details
- `unreadCounts` - Unread message counts per user
- `isActive` - Chat active status

### Message Model
- `chat` - Chat ID reference
- `sender` - User ID reference
- `type` - Message type (text, image, voice, file)
- `content` - Message content object
- `replyTo` - Reply to message ID
- `replies` - Array of reply message IDs
- `readBy` - Array of users who read the message
- `reactions` - Array of message reactions
- `isEdited` - Message edited flag
- `isDeleted` - Soft delete flag

## Development

### Running in Development Mode
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
npm start
```

### Building for Production
```bash
# Build frontend
npm run build

# Start backend in production
cd server
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository. 