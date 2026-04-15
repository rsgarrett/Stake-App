# Stake President Management App

A comprehensive stake management application built with Next.js, Supabase, and TypeScript.

## Features

- **Leadership Management**: Track callings, leadership positions, and training records
- **Meetings & Conferences**: Schedule meetings, manage agendas, and plan stake conferences
- **Welfare & Self-Reliance**: Track welfare cases and self-reliance programs
- **Missionary Work**: Manage missionary applications and track missionary efforts
- **Temple & Family History**: Track temple attendance and family history activities
- **Youth Programs**: Oversee youth programs and track priesthood advancements
- **Communication**: Send announcements and secure messaging
- **Training & Resources**: Access training materials and handbook sections
- **Calendar & Scheduling**: Unified calendar with conflict detection
- **Interviews**: Schedule and manage interviews
- **Conferences & Special Events**: Plan and coordinate special events

## Tech Stack

- **Frontend**: Next.js 14+ (App Router) with React Server Components
- **Backend**: Next.js API Routes + Supabase
- **Database**: Supabase PostgreSQL with Row Level Security
- **Auth**: Supabase Auth with role-based access
- **Storage**: Supabase Storage for documents
- **UI**: Tailwind CSS with shadcn/ui components

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account and project

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   ```
   Then fill in your Supabase credentials:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
   - `ENCRYPTION_KEY`: A 32-character encryption key for sensitive data

4. Set up the database:
   ```bash
   # Run migrations (after setting up Supabase CLI)
   supabase db push
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
stake-app/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Dashboard and modules
│   └── api/               # API routes
├── lib/                    # Utility libraries
│   ├── supabase/          # Supabase clients
│   ├── modules/           # Module business logic
│   └── utils/             # Utility functions
├── components/            # React components
│   ├── modules/           # Module-specific components
│   └── ui/                # Reusable UI components
├── supabase/              # Supabase configuration
│   └── migrations/        # Database migrations
└── types/                 # TypeScript type definitions
```

## Security

- Row Level Security (RLS) policies protect all data
- Sensitive data is encrypted at rest
- Role-based access control
- Audit logging for all data modifications

## License

Private - For internal use only


