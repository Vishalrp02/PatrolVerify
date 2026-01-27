# PatrolVerify - Security Patrol Management System

A comprehensive security patrol management system with QR code scanning, real-time location tracking, and AI-powered incident reporting.

## 🛠️ Tech Stack

### Frontend
- **Next.js 16.1.4** - React framework with App Router
- **React 19.2.3** - UI library with Server Components
- **TailwindCSS 4.1.18** - Utility-first CSS framework
- **Lucide React** - Icon library
- **Sonner** - Toast notifications

### Backend
- **Node.js** - JavaScript runtime
- **Prisma 5.10.0** - ORM for database management
- **PostgreSQL** - Primary database
- **bcrypt** - Password hashing

### Maps & Location
- **Leaflet 1.9.4** - Interactive maps
- **React-Leaflet 5.0.0** - React integration for Leaflet
- **Browser Geolocation API** - GPS tracking

### QR Code & Scanning
- **@yudiel/react-qr-scanner 2.5.1** - QR code scanning
- **qrcode 1.5.4** - QR code generation

### AI & Analytics
- **Google Gemini AI** - Incident analysis and summarization
- **Haversine Formula** - GPS distance calculations

### Authentication & Security
- **Cookie-based sessions** - User authentication
- **Role-based access control** - Guard/Admin permissions
- **Environment variables** - Secure configuration

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database running
- Google Gemini API key

### 1. Clone and Install Dependencies
```bash
git clone <your-repo-url>
cd PatrolVerify
npm install
```

### 2. Environment Setup
Create a `.env.local` file with:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/patrolverify"
GEMINI_API_KEY="your_google_gemini_api_key"
NEXT_PUBLIC_ADMIN_ACCESS_KEY="your_secure_admin_key_here"
```

### 3. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Seed database with default users
npm run seed
```

## 🗄️ Prisma ORM Commands

### Database Management
```bash
# Generate Prisma client after schema changes
npx prisma generate

# Create and apply new migration
npx prisma migrate dev --name <migration-name>

# Apply migrations in production
npx prisma migrate deploy

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# View migration status
npx prisma migrate status
```

### Database Seeding
```bash
# Seed database with initial data
npm run seed

# Or run directly with Prisma
npx prisma db seed
```

### Database Studio (GUI)
```bash
# Open Prisma Studio for database management
npx prisma studio
```
Opens at [http://localhost:5555](http://localhost:5555)

### Schema & Client Management
```bash
# Push schema changes to database (development only)
npx prisma db push

# Validate Prisma schema
npx prisma validate

# Format Prisma schema file
npx prisma format

# View database schema as ERD
npx prisma db pull
```

### Troubleshooting
```bash
# Clear Prisma cache and regenerate
rm -rf node_modules/.prisma
npx prisma generate

# Reset entire database (use with caution)
npx prisma migrate reset --force
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Production Build
```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📋 Available Scripts

### Application Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run seed` - Seed database with initial data

### Prisma Scripts (run with npx)
- `npx prisma generate` - Generate Prisma client
- `npx prisma migrate dev --name <name>` - Create migration
- `npx prisma migrate deploy` - Deploy migrations (prod)
- `npx prisma studio` - Open database GUI
- `npx prisma db push` - Push schema changes (dev)
- `npx prisma migrate reset` - Reset database
- `npx prisma validate` - Validate schema

## 🔐 Security Features

- **Role-based Access Control**: Guards and Admins have separate access levels
- **Secure Registration**: Public signup only allows guard accounts
- **Admin Access Control**: Admin registration requires secure access key
- **GPS Verification**: Checkpoint scanning verified with location validation
- **Encrypted Passwords**: All passwords hashed with bcrypt

## 👥 Default Accounts

After running `npm run seed`, you'll have:

**Admin Account:**
- Username: `admin`
- Password: `admin123`
- Access: Full admin dashboard

**Guard Account:**
- Username: `guard1`  
- Password: `guard123`
- Access: Guard mobile interface

## 🌐 Application Routes

### Public Routes
- `/` - Guard login/dashboard
- `/login` - User login
- `/signup` - Guard registration (public)
- `/admin-register` - Admin registration (requires access key)

### Admin Routes
- `/admin/dashboard` - Main admin command center
- `/admin/checkpoints` - Checkpoint management & QR generation
- `/admin/guard-routes` - Guard route assignments

### API Routes
- `/api/checkpoints` - Checkpoint CRUD operations
- `/api/sites` - Site management
- `/api/guard-routes/assign` - Guard route assignments

## 🏗️ Project Structure

```
PatrolVerify/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin interfaces
│   ├── api/               # API endpoints
│   ├── actions/           # Server actions
│   └── (auth)/            # Authentication pages
├── components/            # React components
├── lib/                   # Utility functions
├── prisma/               # Database schema & migrations
│   ├── schema.prisma     # Database model definitions
│   ├── migrations/        # Database migrations
│   └── seed.js           # Database seeding script
├── public/               # Static assets
└── README.md            # This file
```

## 📱 Features

### For Guards
- **QR Code Scanning**: Button-controlled camera for checkpoint scanning
- **GPS Tracking**: Real-time location verification
- **Route Navigation**: Personalized patrol routes with next checkpoint guidance
- **Incident Reporting**: Voice-to-text incident logging with AI analysis
- **Progress Tracking**: Daily patrol completion monitoring

### For Admins
- **Live Dashboard**: Real-time guard location tracking
- **Active Guard Filtering**: Show only guards active in last 5 minutes
- **Checkpoint Management**: Create checkpoints and generate QR codes
- **Route Assignment**: Assign specific patrol routes to guards
- **Scan Monitoring**: View all checkpoint scans with GPS verification
- **Incident Management**: Monitor and analyze security incidents

## 🔧 Development Notes

- Uses Next.js 16 with React 19 and Server Components
- Database operations handled by Prisma ORM
- Real-time updates via server actions and revalidation
- Responsive design optimized for mobile guard interface
- Production-ready with proper error handling and validation
