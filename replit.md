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

### Data Models
Key entities managed by the system:
- **School Settings**: Basic school configuration (name, email)
- **Students**: Student records with tuition fee tracking (full name, mobile, fees, payments)
- **Income**: Revenue sources with categorization
- **Expenses**: Expenditure tracking
- **Payments**: Student payment records linked to students
- **Staff**: Teacher and employee records with salary information

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