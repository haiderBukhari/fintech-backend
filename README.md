# Fintech Backend API

A Node.js Express backend with Supabase integration for user authentication.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 3. Supabase Database Setup
Create the following table in your Supabase database:

```sql
CREATE TABLE users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name text NOT NULL,
    email_address text UNIQUE NOT NULL,
    password text NOT NULL,
    company_name text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
```

### 4. Run the Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication

#### POST /api/auth/signup
Create a new user account.

**Request Body:**
```json
{
  "full_name": "John Doe",
  "email_address": "john@example.com",
  "password": "securepassword123",
  "company_name": "Acme Corp" // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "uuid",
    "full_name": "John Doe",
    "email_address": "john@example.com",
    "company_name": "Acme Corp",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### POST /api/auth/login
Authenticate user and login.

**Request Body:**
```json
{
  "email_address": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "id": "uuid",
    "full_name": "John Doe",
    "email_address": "john@example.com",
    "company_name": "Acme Corp",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### GET /api/auth/profile/:userId
Get user profile information.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "full_name": "John Doe",
    "email_address": "john@example.com",
    "company_name": "Acme Corp",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### Health Check

#### GET /health
Check if the server is running.

**Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Features

- ✅ User registration with password hashing
- ✅ User login with password verification
- ✅ Email uniqueness validation
- ✅ User profile retrieval
- ✅ Automatic timestamp management
- ✅ Error handling and validation
- ✅ CORS enabled
- ✅ Environment variable configuration

## Security Features

- Passwords are hashed using bcrypt with salt rounds of 10
- Email addresses are validated for uniqueness
- Input validation for required fields
- Error messages don't expose sensitive information
- CORS enabled for cross-origin requests

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (only in development)"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid credentials)
- `404` - Not Found
- `409` - Conflict (user already exists)
- `500` - Internal Server Error 