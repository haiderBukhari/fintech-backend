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

# Email Configuration (Gmail)
GMAIL_USER=your_gmail@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password

# AI Configuration (Google GenAI)
GOOGLE_GENAI_API_KEY=your_google_genai_api_key
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
- `POST /api/bookings/:id/send-email` - Send email with PDF (legacy)
- `POST /api/bookings/:id/send-booking-email` - Send booking email with PDF attachment

### Sales Rep Inbox
- `GET /api/sales-rep-inbox` - Get all inbox items
- `PUT /api/sales-rep-inbox/:id` - Update rep status

### Reports
- `GET /api/reports` - Get overall metrics

### Settings
- `GET /api/settings?user_id=uuid` - Get user settings
- `PUT /api/settings?user_id=uuid` - Update user settings

### AI PDF Extraction
- `POST /api/ai/extract-booking-data` - Extract booking data from PDF using Gemini AI

### Health Check
- `GET /health` - Server status

## API Documentation

### Send Booking Email
**Endpoint:** `POST /api/bookings/:id/send-booking-email`

**Description:** Send a detailed email with booking information and PDF attachment to recipients. If email_recipients are not provided, it will automatically fetch them from user settings.

**Option 1: Provide email recipients directly**
**Request Body:**
```json
{
  "email_recipients": ["sales@company.com", "manager@company.com"]
}
```

**Option 2: Use email recipients from settings**
**Request Body:**
```json
{
  "user_id": "user-uuid"
}
```
**OR**
**Query Parameter:** `?user_id=user-uuid`

**Response:**
```json
{
  "success": true,
  "message": "Email sent successfully",
  "data": {
    "booking_id": "uuid",
    "recipients": ["sales@company.com", "manager@company.com"],
    "message_id": "email_message_id"
  }
}
```

**Error Responses:**
- `400` - Invalid email format or missing recipients
- `400` - user_id required when email_recipients not provided
- `400` - No email recipients found in settings for this user
- `404` - Booking not found
- `400` - PDF URL not found (generate PDF first)
- `500` - Email sending failed

## AI PDF Extraction API Documentation

### Extract Booking Data from PDF
**Endpoint:** `POST /api/ai/extract-booking-data`

**Description:** Use Google's Gemini AI to extract structured booking data from PDF documents.

**Request Body:**
```json
{
  "pdfUrl": "https://example.com/booking-document.pdf"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking data extracted successfully",
  "data": {
    "clientName": "Example Corp",
    "contactName": "Jane Doe",
    "contactEmail": "jane@example.com",
    "contactPhone": "+65 1234 5678",
    "address": "123 Orchard Road, Singapore",
    "industrySegment": "Retail",
    "taxRegistrationNo": "12345678X",
    "campaignName": "Christmas Promo 2025",
    "campaignRef": "CP-2025-001",
    "startDate": "2025-12-01",
    "endDate": "2025-12-31",
    "creativeDeliveryDate": "2025-11-15",
    "mediaType": "Newspaper Ad",
    "placementPreferences": "Front page",
    "grossAmount": 50000,
    "partnerDiscount": 10,
    "additionalCharges": 2000,
    "netAmount": 47000,
    "creativeFileLink": "https://example.com/ad.pdf",
    "creativeSpecs": "Full-page colour, 300 DPI",
    "specialInstructions": "Run on weekends only",
    "signatoryName": "John Smith",
    "signatoryTitle": "Marketing Director",
    "signatureDate": "2025-10-01"
  },
  "pdfUrl": "https://example.com/booking-document.pdf"
}
```

**Error Responses:**
- `400` - PDF URL is required
- `400` - Invalid PDF URL format
- `400` - Failed to fetch PDF from URL
- `400` - Incomplete data extracted (missing fields)
- `400` - Invalid date formats detected
- `400` - Invalid numeric values detected
- `500` - PDF processing failed
- `500` - Failed to parse AI response
- `500` - Failed to extract booking data

## Features

- ✅ Complete booking management system
- ✅ Sales rep inbox workflow
- ✅ Booking status tracking
- ✅ PDF generation and email sending
- ✅ Email notifications with PDF attachments
- ✅ Comprehensive reporting
- ✅ User settings management
- ✅ Secure authentication
- ✅ Database relationships
- ✅ Error handling and validation
- ✅ Role-based access control

## Email Configuration

### Gmail Setup
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Use the generated password as `GMAIL_APP_PASSWORD` in your `.env` file

### Email Features
- **Booking Creation**: Sends detailed email with PDF attachment when booking is created
- **Status Updates**: Sends notification emails when booking status changes
- **HTML Templates**: Professional email templates with booking details
- **PDF Attachments**: Automatically attaches PDF files to emails
- **Multiple Recipients**: Support for multiple email recipients 