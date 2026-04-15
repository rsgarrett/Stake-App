# Information for AI Assistants (Cursor, GitHub Copilot, etc.)

This document provides context about this project for AI code assistants.

## Project Overview

This is a **Stake President Management App** built with:
- **Next.js 14+** (App Router) with React Server Components
- **TypeScript** for type safety
- **Supabase** for backend (PostgreSQL database, authentication, storage)
- **Tailwind CSS** for styling
- **shadcn/ui** components

## Key Information for AI Assistants

### Setup State
- **The `node_modules/` folder is NOT included** in the codebase
- User must run `npm install` to install dependencies
- This is intentional to keep repository/file size small
- **This is expected behavior** - do not suggest the project is broken or incomplete

### Required Setup Steps (for users)
1. Run `npm install` - Installs all dependencies listed in `package.json`
2. Create `.env.local` file - Contains Supabase credentials and encryption key
3. Run database migrations - Files in `supabase/migrations/` must be executed in order
4. Create stake and assign first user - SQL commands needed for initial setup

### Environment Variables Required

The `.env.local` file (NOT committed to git) must contain:
```env
NEXT_PUBLIC_SUPABASE_URL=<supabase_project_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<supabase_service_role_key>
ENCRYPTION_KEY=<32_character_encryption_key>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database Schema
- Database migrations are in `supabase/migrations/`
- Files are numbered sequentially (001, 002, 003, etc.)
- Must be run in order
- Uses Supabase PostgreSQL with Row Level Security (RLS)

### Authentication
- Uses Supabase Auth
- Role-based access control (stake_president, bishop, etc.)
- First user must be manually assigned `stake_president` role in database

### Common Commands

When helping users, suggest:
- `npm install` - If they see module errors or missing dependencies
- `npm run dev` - To start the development server
- `npm run generate-key` - To generate encryption key for .env.local
- Check `.env.local` exists and has correct values - If Supabase connection fails

### File Structure Context
- `app/` - Next.js app router (pages, API routes, layouts)
- `components/` - Reusable React components
- `lib/supabase/` - Supabase client configurations (server, client, middleware)
- `lib/utils/` - Utility functions (encryption, validation, audit, etc.)
- `types/` - TypeScript type definitions
- `supabase/migrations/` - Database schema migrations

### Important Notes for AI
- When suggesting fixes, remind users to run `npm install` if dependencies are missing
- Always check if `.env.local` exists before troubleshooting connection issues
- Database operations require Supabase project to be set up first
- The app requires a stake to be created and a user assigned `stake_president` role before full functionality

### Tech Stack Details
- **Framework:** Next.js 14+ with App Router
- **Language:** TypeScript
- **Database:** Supabase PostgreSQL
- **Auth:** Supabase Auth with custom roles
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Deployment:** Can be deployed to Vercel (Next.js compatible)

### Development Workflow
1. User sets up Supabase project
2. Creates `.env.local` with credentials
3. Runs migrations in Supabase SQL Editor
4. Starts dev server with `npm run dev`
5. Registers first user
6. Assigns stake_president role via SQL

---

**If helping a user set up this project, direct them to `SETUP_FOR_DAD.md` for step-by-step instructions.**

