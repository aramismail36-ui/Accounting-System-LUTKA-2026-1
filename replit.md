# Lutka School Management System

## Overview

This is a school management and accounting system designed for private Kurdish schools. The application provides comprehensive financial tracking including student tuition management, income/expense recording, staff salary management, and monthly financial reporting. The interface is built with RTL (Right-to-Left) support for Kurdish language users.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom Kurdish-friendly font stack (Vazirmatn, Nrt)
- **Charts**: Recharts for financial data visualization
- **Forms**: React Hook Form with Zod validation

The frontend follows a feature-based page structure with shared components. All pages are protected by authentication and wrapped in a common layout shell with RTL navigation.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: REST endpoints defined in `shared/routes.ts` with Zod schemas for type-safe request/response validation
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Session Management**: express-session with PostgreSQL store (connect-pg-simple)

The server uses a storage pattern (`server/storage.ts`) that abstracts all database operations, making it easy to swap implementations if needed.

### Authentication
- **Method**: Replit Auth (OpenID Connect)
- **Session Storage**: PostgreSQL-backed sessions
- **User Management**: Users table with profile information synced from Replit

The auth system includes mandatory tables for sessions and users that should not be modified or dropped.

### Role-Based Access Control
- **Roles**: Two roles exist: `admin` (default) and `shareholder`
- **Admin Role**: Full access to all pages and CRUD operations
- **Shareholder Role**: Read-only access to financial summaries and profit/loss distribution
  - Shareholders are automatically redirected to a dedicated dashboard page
  - Can view and print financial data but cannot add, edit, or delete anything
- **Server-Side Enforcement**: All mutating API endpoints are protected by `requireAdmin` middleware
- **User Management**: Admins can change user roles from the Users management page (`/users`)

### Data Models
Key entities managed by the system:
- **School Settings**: Basic school configuration (name, email, logo)
- **Students**: Student records with tuition fee tracking (full name, mobile, grade, fees, payments)
- **Income**: Revenue sources with categorization
- **Expenses**: Expenditure tracking
- **Payments**: Student payment records linked to students
- **Staff**: Teacher and employee records with salary information
- **Salary Payments**: Staff salary disbursements with automatic expense creation
- **Shareholders**: School owners/investors with share percentages for profit/loss distribution

### Grade Promotion System
- **Bulk Grade Promotion**: At the end of the school year, admins can promote all students to the next grade level with one click
- **Supported Formats**: Handles multiple grade formats:
  - ASCII numerals (1, 2, 3...)
  - Arabic-Indic numerals (١, ٢, ٣...)
  - Kurdish ordinal words (یەکەم, دووەم, سێیەم...)
- **Access Control**: Grade promotion is admin-only (requireAdmin middleware)
- **API Endpoint**: POST `/api/students/promote-grades` returns count of promoted students

### Expense Analysis
- **Category Breakdown**: View expenses grouped by category with totals sorted by highest spending
- **Date Range Filtering**: Filter expenses by custom date range (start and end date)
- **Category Details**: Click on a category to see detailed expense list for that category
- **Print Support**: Print analysis results with school logo, filtered by current selection
- **Constants**: EXPENSE_CATEGORIES defined in `client/src/pages/expenses.tsx` for consistent categorization

### Salary Analysis
- **Staff Breakdown**: View salary payments grouped by staff member with totals sorted by highest amount
- **Date Range Filtering**: Filter salary payments by custom date range (start and end date)
- **Staff Details**: Click on a staff member to see detailed payment list for that person
- **Print Support**: Print analysis results with school logo, filtered by current selection
- **Location**: Available on the salary payments page (`/salary-payments`)

### Currency and Receipts
- **Currency**: All monetary amounts displayed in Iraqi Dinar (د.ع)
- **Receipts**: A5 printable receipts with amounts shown in both numbers and Kurdish words
- **Number to Words**: Kurdish number-to-words conversion utility in `client/src/lib/number-to-kurdish.ts`
- **School Logo**: Logo appears on all printed reports and receipts when uploaded

### Logo and Print System
- **Logo Upload**: School logo can be uploaded via School Settings page (PNG, JPG, GIF, WebP, max 5MB)
- **File Storage**: Uploaded logos stored in `./uploads` folder, served via `/uploads` route
- **Print Utilities**: Centralized print HTML generation in `client/src/lib/print-utils.ts`
- **Logo Integration**: All printed lists and receipts display the school logo and name from settings

### Fiscal Year Management
- **Year Format**: Fiscal years are stored as "YYYY-YYYY" format (e.g., "2024-2025")
- **Date Range**: Each fiscal year has start and end dates (typically Sept 1 to Aug 31)
- **Current Year**: One fiscal year is marked as current at any time - new data is linked to the current year
- **Close Year Feature**: When closing a fiscal year:
  - All financial records (income, expenses, payments, salaries, food payments) are tagged with the closing year
  - All students are promoted to the next grade level
  - Outstanding payment amounts are transferred to "previous year debt"
  - The year is marked as closed and cannot be modified
  - A new fiscal year is automatically created and set as current
- **Data Model**: Uses a "living record" model where:
  - Students are ongoing entities that progress through grades each year
  - Financial records (income, expenses, payments) are tagged with fiscalYear for historical access
  - The fiscalYear field allows filtering data by year in reports
- **Access Control**: Fiscal year management is admin-only (requireAdmin middleware)
- **Location**: Available at `/fiscal-years` page
- **API Endpoints**:
  - GET `/api/fiscal-years` - List all fiscal years
  - GET `/api/fiscal-years/current` - Get current fiscal year
  - POST `/api/fiscal-years` - Create new fiscal year
  - PUT `/api/fiscal-years/:id/set-current` - Set year as current
  - POST `/api/fiscal-years/:id/close` - Close fiscal year and create next year
  - DELETE `/api/fiscal-years/:id` - Delete fiscal year (cannot delete closed years)

### Build System
- **Development**: Vite dev server with HMR
- **Production Build**: esbuild for server bundling, Vite for client
- **Database Migrations**: Drizzle Kit with `db:push` command

## External Dependencies

### Database
- **PostgreSQL**: Primary database accessed via `DATABASE_URL` environment variable
- **Drizzle ORM**: Schema defined in `shared/schema.ts`, migrations stored in `/migrations`

### Authentication Services
- **Replit Auth**: OpenID Connect provider at `https://replit.com/oidc`
- **Required Environment Variables**: `REPL_ID`, `SESSION_SECRET`, `ISSUER_URL`

### Third-Party UI Libraries
- **Radix UI**: Full suite of accessible primitives (dialog, dropdown, tabs, etc.)
- **Recharts**: Financial chart visualization
- **date-fns**: Date formatting and manipulation
- **Lucide React**: Icon library

### Development Tools
- **Replit Plugins**: vite-plugin-runtime-error-modal, vite-plugin-cartographer, vite-plugin-dev-banner (development only)