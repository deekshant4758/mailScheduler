# 📧 ReachInbox Email Scheduler

A production-grade email scheduling system built with Next.js, Express, BullMQ, and Redis. Schedule emails to be sent at specific times with rate limiting, concurrency control, and persistence across server restarts.

![ReachInbox Dashboard](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![Express](https://img.shields.io/badge/Express-4.18-green?style=flat-square&logo=express)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Redis](https://img.shields.io/badge/Redis-7.0-red?style=flat-square&logo=redis)

## ⚠️ Render Free Tier – Outbound Network Limitation

> **Important Notice:**  
> When deployed on **Render’s free tier**, outbound network access is disabled.  
> As a result, SMTP connections to external email providers (such as Gmail or Ethereal) are blocked.

### Impact
- ❌ Emails **will not be sent**
- ⚠️ Email delivery attempts will result in **connection timeout** errors
- ✅ Email scheduling, queuing, rate limiting, retries, and persistence **continue to work correctly**

### Recommendation
To observe the **expected email-sending behavior**:
- ✅ Run the backend **locally (localhost)** where outbound SMTP connections are allowed
- 🔁 Or deploy on a platform / paid tier that permits **outbound network access**

This limitation is specific to the **Render free tier** and not an issue with the application implementation.


## 🎯 Features

### Backend
- ✅ **Email Scheduling** - Schedule emails to be sent at specific times
- ✅ **Bulk Email Support** - Send to multiple recipients with CSV upload
- ✅ **Rate Limiting** - Global and per-sender hourly limits
- ✅ **Concurrency Control** - Configurable worker concurrency
- ✅ **Persistence** - Survives server restarts without losing jobs
- ✅ **Queue Management** - BullMQ with Redis for reliable job processing
- ✅ **Retry Logic** - Automatic retries with exponential backoff
- ✅ **SMTP Support** - Works with Gmail, Ethereal, SendGrid, etc.
- ✅ **RESTful API** - Clean API endpoints for all operations

### Frontend
- ✅ **Google OAuth Login** - Secure authentication with NextAuth
- ✅ **Email Composition** - Rich email composer with HTML support
- ✅ **CSV Upload** - Bulk upload recipients from CSV files
- ✅ **Dashboard** - Real-time email tracking and statistics
- ✅ **Scheduled Emails View** - See all upcoming scheduled emails
- ✅ **Sent Emails View** - Track sent and failed emails
- ✅ **Filtering & Search** - Filter by status, search emails
- ✅ **Responsive Design** - Works on desktop and mobile
- ✅ **Real-time Updates** - Auto-refresh every 30 seconds

---

## 🏗 Architecture Overview

### System Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Next.js   │ ────→   │   Express    │ ────→   │    MySQL    │
│  Frontend   │   API   │   Backend    │  Store  │  Database   │
└─────────────┘         └──────────────┘         └─────────────┘
                               │
                               ↓
                        ┌──────────────┐
                        │    Redis     │
                        │   + BullMQ   │
                        └──────────────┘
                               │
                               ↓
                        ┌──────────────┐
                        │ Email Worker │ ────→ SMTP Server
                        │  (BullMQ)    │       (Gmail/Ethereal)
                        └──────────────┘
```

### How Scheduling Works

1. **User schedules email** → Frontend sends request to backend
2. **Backend validates** → Checks data and stores in MySQL
3. **Create BullMQ job** → Job added to Redis queue with delay
4. **BullMQ waits** → Job stays in delayed state until scheduled time
5. **Worker processes** → At scheduled time, worker picks up job
6. **Rate limit check** → Verifies hourly limits aren't exceeded
7. **Send email** → Uses nodemailer to send via SMTP
8. **Update database** → Marks email as sent/failed

### Persistence on Restart

**Problem:** If server restarts, scheduled emails should still send.

**Solution:**
1. All scheduled emails stored in MySQL database
2. Email status tracked: `scheduled`, `queued`, `sent`, `failed`
3. BullMQ job ID stored with each email record
4. On server startup:
   - Load all emails with status `scheduled` or `queued`
   - Where `scheduled_at > now()`
   - Re-create BullMQ jobs with correct delays
   - Jobs continue from where they left off

**Code:** `src/services/email.service.ts` → `restoreScheduledEmails()`

### Rate Limiting & Concurrency

#### Rate Limiting (Hourly)

**Implementation:**
- Uses Redis for atomic counters
- Uses MySQL for persistence
- Tracks per hour window (e.g., 2:00 PM - 3:00 PM)
- Three levels:
  1. **Global:** All emails across system
  2. **Per-sender:** Emails from one sender
  3. **Per-tenant:** Emails from one organization

**Process:**
1. Before sending, increment counter in Redis
2. Check if count exceeds limit
3. If yes, reschedule job to next hour window
4. If no, send email and update DB counter

**Code:** `src/services/ratelimiter.service.ts`

#### Concurrency Control

**Worker Concurrency:**
```typescript
concurrency: 5  // Process 5 jobs simultaneously
```

**Delay Between Emails:**
```typescript
limiter: {
  max: 1,           // 1 email per duration
  duration: 2000    // 2 seconds
}
```

This ensures:
- Maximum 5 emails processing at once
- Minimum 2 seconds between each email
- Prevents overwhelming SMTP servers

**Code:** `src/workers/email.worker.ts`

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker & Docker Compose (for MySQL & Redis)
- Gmail account (for SMTP) OR Ethereal account
- Google Cloud Console project (for OAuth)

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/reachinbox-scheduler.git
cd reachinbox-scheduler
```

---

## 🔧 Backend Setup

### Step 1: Start Database & Redis

```bash
# Start MySQL and Redis using Docker
docker-compose up -d

# Verify services are running
docker-compose ps

# Expected output:
# reachinbox_mysql    Up      3306->3306
# reachinbox_redis    Up      6379->6379
```

### Step 2: Install Dependencies

```bash
cd backend
npm install
```

### Step 3: Configure Environment Variables

Create `backend/.env`:

```env
# Server
NODE_ENV=development
PORT=5000
API_PREFIX=/api/v1

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=reachinbox_user
DB_PASSWORD=reachinbox_pass
DB_NAME=reachinbox_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Email (Choose one: Ethereal OR Gmail)

# Option 1: Ethereal Email (Testing)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your-ethereal-email@ethereal.email
SMTP_PASS=your-ethereal-password

# Option 2: Gmail (Production)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-gmail@gmail.com
# SMTP_PASS=your-16-char-app-password

# Queue Configuration
QUEUE_CONCURRENCY=5
EMAIL_DELAY_MS=2000
MAX_EMAILS_PER_HOUR=200
MAX_EMAILS_PER_HOUR_PER_SENDER=50

# Retry Configuration
MAX_RETRY_ATTEMPTS=3
RETRY_BACKOFF_MS=60000
```

### Step 4: Setup Ethereal Email (Testing)

1. Go to https://ethereal.email/create
2. Click "Create Ethereal Account"
3. Copy the credentials:
   ```
   User: random.user@ethereal.email
   Pass: randompassword123
   ```
4. Add to `.env` file

**Note:** Ethereal is fake SMTP - emails won't actually send. View them at https://ethereal.email/messages

### Step 5: Setup Gmail (Production - Optional)

1. **Enable 2-Step Verification:**
   - Go to https://myaccount.google.com/security
   - Enable "2-Step Verification"

2. **Generate App Password:**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Click "Generate"
   - Copy 16-character password (e.g., `abcd efgh ijkl mnop`)

3. **Update .env:**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-gmail@gmail.com
   SMTP_PASS=abcdefghijklmnop  # No spaces
   ```

### Step 6: Run Database Migration

```bash
# Connect to MySQL
docker exec -i reachinbox_mysql mysql -u reachinbox_user -preachinbox_pass reachinbox_db < migrations/001_initial_schema.sql

# Verify tables created
docker exec -it reachinbox_mysql mysql -u reachinbox_user -preachinbox_pass reachinbox_db -e "SHOW TABLES;"
```

### Step 7: Start Backend Server

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

**Expected output:**
```
🚀 Starting ReachInbox Email Scheduler...
✅ Database connected successfully
✅ Redis connected successfully
✅ Email service connected successfully
✅ Queue service initialized
✅ Email worker started with concurrency: 5
✅ Server running on 0.0.0.0:5000
```

### Step 8: Test Backend

```bash
# Health check
curl http://localhost:5000/health

# Schedule a test email
curl -X POST http://localhost:5000/api/v1/emails/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "senderEmail": "sender@example.com",
    "recipientEmail": "recipient@example.com",
    "subject": "Test Email",
    "body": "<h1>Hello World</h1>",
    "scheduledAt": "2026-01-20T10:00:00Z"
  }'

# Get scheduled emails
curl http://localhost:5000/api/v1/emails/scheduled

# Get stats
curl http://localhost:5000/api/v1/emails/stats
```

---

## 🎨 Frontend Setup

### Step 1: Install Dependencies

```bash
cd frontend
npm install
```

### Step 2: Setup Google OAuth

1. **Create Google Cloud Project:**
   - Go to https://console.cloud.google.com/
   - Create new project or select existing
   - Enable "Google+ API"

2. **Create OAuth Credentials:**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth Client ID"
   - Application type: "Web application"
   - Authorized redirect URIs:
     ```
     http://localhost:3000/api/auth/callback/google
     ```
   - Click "Create"
   - Copy Client ID and Client Secret

### Step 3: Configure Environment Variables

Create `frontend/.env.local`:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-random-secret-here

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1

# Email (must match backend SMTP_USER)
NEXT_PUBLIC_SENDER_EMAIL=your-ethereal-email@ethereal.email
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### Step 4: Start Frontend

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

**Expected output:**
```
✓ Ready in 2.5s
○ Local:        http://localhost:3000
```

### Step 5: Access Application

1. Open browser: http://localhost:3000
2. Click "Login with Google"
3. Authorize the application
4. You'll be redirected to the dashboard

---

## 📊 API Documentation

### Base URL
```
http://localhost:5000/api/v1
```

### Endpoints

#### 1. Schedule Single Email
```http
POST /emails/schedule
Content-Type: application/json

{
  "senderEmail": "sender@example.com",
  "recipientEmail": "recipient@example.com",
  "subject": "Test Email",
  "body": "<p>Email content</p>",
  "scheduledAt": "2026-01-20T10:00:00Z"
}
```

#### 2. Schedule Bulk Emails
```http
POST /emails/schedule-bulk
Content-Type: application/json

{
  "senderEmail": "sender@example.com",
  "recipients": ["user1@example.com", "user2@example.com"],
  "subject": "Bulk Email",
  "body": "<p>Email content</p>",
  "scheduledAt": "2026-01-20T10:00:00Z",
  "delayBetweenEmails": 2000,
  "hourlyLimit": 50
}
```

#### 3. Get Scheduled Emails
```http
GET /emails/scheduled?limit=100&offset=0
```

#### 4. Get Sent Emails
```http
GET /emails/sent?limit=100&offset=0
```

#### 5. Get Email Statistics
```http
GET /emails/stats
```

#### 6. Cancel Scheduled Email
```http
DELETE /emails/:id
```

---

## 🗂 Project Structure

### Backend
```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts        # MySQL connection
│   │   ├── redis.ts           # Redis connection
│   │   └── email.ts           # SMTP configuration
│   ├── models/
│   │   └── email.model.ts     # Email data model
│   ├── services/
│   │   ├── email.service.ts   # Email business logic
│   │   ├── queue.service.ts   # BullMQ queue management
│   │   └── ratelimiter.service.ts  # Rate limiting logic
│   ├── workers/
│   │   └── email.worker.ts    # BullMQ worker (processes jobs)
│   ├── controllers/
│   │   └── email.controller.ts # API request handlers
│   ├── routes/
│   │   └── email.routes.ts    # API route definitions
│   ├── middlewares/
│   │   └── error.middleware.ts # Error handling
│   ├── types/
│   │   └── index.ts           # TypeScript types
│   ├── app.ts                 # Express app setup
│   └── server.ts              # Server entry point
├── migrations/
│   └── 001_initial_schema.sql # Database schema
├── .env
├── package.json
└── tsconfig.json
```

### Frontend
```
frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/         # Login page
│   │   ├── (dashboard)/
│   │   │   ├── scheduled/     # Scheduled emails page
│   │   │   └── sent/          # Sent emails page
│   │   ├── api/
│   │   │   └── auth/          # NextAuth API routes
│   │   └── layout.tsx         # Root layout
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   ├── layout/            # Header, Sidebar
│   │   └── email/             # Email-specific components
│   ├── contexts/
│   │   └── EmailStatsContext.tsx  # Global state management
│   ├── lib/
│   │   ├── api.ts             # API client
│   │   ├── auth.ts            # NextAuth config
│   │   └── utils.ts           # Utility functions
│   └── types/
│       └── index.ts           # TypeScript types
├── .env.local
├── package.json
└── next.config.js
```

---

## 🔍 Testing

### Backend Tests

```bash
cd backend

# Test database connection
npm run test:db

# Test Redis connection
npm run test:redis

# Test email service
npm run test:email

# Schedule test email
curl -X POST http://localhost:5000/api/v1/emails/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "senderEmail": "test@example.com",
    "recipientEmail": "recipient@example.com",
    "subject": "Test",
    "body": "Hello",
    "scheduledAt": "2026-01-20T10:00:00Z"
  }'
```

### Frontend Tests

```bash
cd frontend

# Build test
npm run build

# Start production server
npm start
```

### Test Restart Persistence

1. Schedule emails for 5 minutes in future
2. Stop backend server (Ctrl+C)
3. Wait 1 minute
4. Start backend server again
5. Emails should still send at scheduled time ✅

---

## 🚀 Deployment

### Backend Deployment (Render/Railway)

1. **Push to GitHub**
2. **Connect to Render/Railway**
3. **Set Environment Variables**
4. **Deploy**

See `DEPLOYMENT.md` for detailed instructions.

### Frontend Deployment (Vercel)

1. **Push to GitHub**
2. **Import to Vercel**
3. **Set Environment Variables**
4. **Update Google OAuth redirect URIs**
5. **Deploy**

---

## 🐛 Troubleshooting

### Backend won't start

**Check:**
- Docker containers running: `docker-compose ps`
- Database connection: `docker exec -it reachinbox_mysql mysql -u root -p`
- Redis connection: `docker exec -it reachinbox_redis redis-cli ping`

### Emails not sending

**Check:**
- SMTP credentials correct
- For Gmail: App password generated, 2FA enabled
- Backend logs for errors
- Email status in database: `SELECT * FROM emails;`

### Frontend can't connect to backend

**Check:**
- Backend is running on port 5000
- `NEXT_PUBLIC_API_URL` is correct in `.env.local`
- CORS is enabled in backend
- Check browser console for errors

### OAuth not working

**Check:**
- Google OAuth redirect URI matches exactly
- `NEXTAUTH_URL` is correct
- `NEXTAUTH_SECRET` is set
- Google Cloud Console credentials are correct

---

## 📝 Features Checklist

### Backend ✅
- [x] Email scheduling with BullMQ
- [x] Bulk email support
- [x] MySQL persistence
- [x] Redis job queue
- [x] Rate limiting (global + per-sender)
- [x] Configurable concurrency
- [x] Delay between emails
- [x] Automatic retries
- [x] Server restart persistence
- [x] RESTful API
- [x] Error handling
- [x] Health check endpoint

### Frontend ✅
- [x] Google OAuth login
- [x] Protected routes
- [x] Email composition
- [x] CSV upload
- [x] Manual recipient entry
- [x] Scheduled emails view
- [x] Sent emails view
- [x] Email detail modal
- [x] Real-time statistics
- [x] Auto-refresh
- [x] Filter by status
- [x] Search functionality (UI ready)
- [x] Responsive design
- [x] Loading states
- [x] Empty states
- [x] Error handling

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit pull request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Your Name**
- GitHub: [@deekshant4758/](https://github.com/deekshant4758/)
- Email: deekshant2003@gmail.com

---

## 🙏 Acknowledgments

- [BullMQ](https://docs.bullmq.io/) - Reliable queue system
- [Next.js](https://nextjs.org/) - React framework
- [Express](https://expressjs.com/) - Web framework
- [Ethereal Email](https://ethereal.email/) - SMTP testing
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework

---

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Email: deekshant2003@gmail.com
<!-- - Documentation: [Wiki](https://github.com/yourusername/reachinbox-scheduler/wiki) -->

---

**Built with ❤️ by Deekshant Gupta**