# Guardian Extension Backend

A robust backend service for the Guardian browser extension, which prevents unauthorized extensions from being installed and manages browser storage clearing.

## Features

- 🔒 **User Authentication & Management**: Secure JWT-based authentication system
- 📋 **Extension Whitelist Management**: Add, update, and remove allowed extensions
- 📊 **Activity Logging**: Track important events like extension installations and security violations
- ⚙️ **Configuration Management**: Centralize and control extension behavior settings
- 🔍 **API Protection**: Secure endpoints with role-based access control

## Getting Started

### Prerequisites

- Node.js (>= 18.0.0)
- MongoDB (local or Atlas)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/guardian-backend.git
cd guardian-backend
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file based on the provided `.env.example`
```bash
cp .env.example .env
# Edit the .env file with your settings
```

4. Start the server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user details
- `PUT /api/auth/update-details` - Update user details
- `PUT /api/auth/update-password` - Update user password
- `POST /api/auth/logout` - Logout user

### Whitelist Management
- `GET /api/whitelist` - Get all whitelisted extensions
- `POST /api/whitelist` - Add extension to whitelist (admin only)
- `PUT /api/whitelist/:id` - Update whitelisted extension (admin only)
- `DELETE /api/whitelist/:id` - Remove extension from whitelist (admin only)
- `GET /api/whitelist/check/:id` - Check if extension is whitelisted

### Activity Logging
- `POST /api/activity` - Log activity (extension use)
- `GET /api/activity` - Get all activity logs (admin only)
- `GET /api/activity/user/:userId` - Get activities by user
- `GET /api/activity/stats` - Get activity statistics (admin only)

### Configuration
- `GET /api/config` - Get extension configuration
- `PUT /api/config` - Update configuration (admin only)
- `POST /api/config/reset` - Reset configuration to defaults (admin only)

## Project Structure

```
guardian-backend/
├── config/             # Configuration files
├── controllers/        # Route controllers
├── middleware/         # Express middleware
├── models/             # Mongoose models
├── routes/             # API routes
├── utils/              # Utility functions
├── .env                # Environment variables
├── package.json        # Package info & dependencies
└── server.js           # Entry point
```

## Security Features

- JWT authentication with role-based access control
- Password hashing with bcrypt
- API key verification for extension communication
- Request validation with express-validator
- Error handling and logging
- CORS configuration for extension security

## Extension Integration

The backend is designed to work with the Guardian browser extension, providing:

1. Whitelist validation to control which extensions can be installed
2. Centralized configuration for cookie/storage clearing behavior
3. Activity logging for security auditing
4. Secure communication channel between extension and backend

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Express.js - Web framework
- Mongoose - MongoDB object modeling
- JWT - Authentication mechanism
- Winston - Logging library