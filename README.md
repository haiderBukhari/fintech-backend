# Fintech Backend API

A Node.js Express backend with Supabase integration for a comprehensive booking management system.

## Database Schema

### Tables to create in Supabase:

```sql
-- Users table (already created)
CREATE TABLE users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name text NOT NULL,
    email_address text UNIQUE NOT NULL,
    password text NOT NULL,
    company_name text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Bookings table
CREATE TABLE bookings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    campaign_name text NOT NULL,
    campaign_description text,
    campaign_ref text UNIQUE NOT NULL,
    client_name text NOT NULL,
    contact_name text NOT NULL,
    contact_email text NOT NULL,
    contact_phone text,
    address text,
    industry_segment text,
    tax_registration_no text,
    start_date date NOT NULL,
    end_date date NOT NULL,
    creative_delivery_date date,
    media_type text,
    placement_preferences text,
    gross_amount decimal(15,2) NOT NULL,
    partner_discount decimal(10,2) DEFAULT 0,
    additional_charges decimal(15,2) DEFAULT 0,
    net_amount decimal(15,2) NOT NULL,
    creative_file_link text,
    creative_specs text,
    special_instructions text,
    signatory_name text,
    signatory_title text,
    signature_date date,
    status text DEFAULT 'submitted',
    progress integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Sales Rep Inbox table
CREATE TABLE sales_rep_inbox (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
    priority text DEFAULT 'Medium',
    rep_status text DEFAULT 'pending',
    assigned_to uuid REFERENCES users(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Booking Status History table
CREATE TABLE booking_status_history (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
    status text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);

-- Settings table
CREATE TABLE settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    email_recipients text[] DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
```

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 3. Run the Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - User authentication
- `GET /api/auth/profile/:userId` - Get user profile

### Bookings
- `POST /api/bookings?user_id=uuid` - Create new booking
- `GET /api/bookings?user_id=uuid` - Get all bookings for user
- `GET /api/bookings/:id` - Get single booking details
- `PUT /api/bookings/:id/status` - Update booking status
- `POST /api/bookings/:id/generate-pdf` - Generate PDF
- `POST /api/bookings/:id/send-email` - Send email with PDF

### Sales Rep Inbox
- `GET /api/sales-rep-inbox` - Get all inbox items
- `PUT /api/sales-rep-inbox/:id` - Update rep status

### Reports
- `GET /api/reports` - Get overall metrics

### Settings
- `GET /api/settings?user_id=uuid` - Get user settings
- `PUT /api/settings?user_id=uuid` - Update user settings

### Health Check
- `GET /health` - Server status

## Features

- ✅ Complete booking management system
- ✅ Sales rep inbox workflow
- ✅ Booking status tracking
- ✅ PDF generation and email sending
- ✅ Comprehensive reporting
- ✅ User settings management
- ✅ Secure authentication
- ✅ Database relationships
- ✅ Error handling and validation 