# Setup Instructions

## Step 1: Install Dependencies

Run the following command in your terminal:

```bash
npm install
```

## Step 2: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project (or use an existing one)
2. Once your project is created, go to Settings > API
3. Copy the following values:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

4. Open `.env.local` and replace the placeholder values with your actual Supabase credentials

## Step 3: Generate Encryption Key

Generate a secure 32-character encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

Copy the output and replace `ENCRYPTION_KEY` in `.env.local`

## Step 4: Set Up Database

### Option A: Using Supabase CLI (Recommended)

1. Install Supabase CLI: `npm install -g supabase`
2. Login: `supabase login`
3. Link your project: `supabase link --project-ref your-project-ref`
4. Push migrations: `supabase db push`

### Option B: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run each migration file in order (001 through 013) from the `supabase/migrations/` folder
4. Make sure to run them in numerical order

## Step 5: Create Initial Stake and User

After setting up the database, you'll need to:

1. Create a stake record in the `stakes` table
2. Create a user record in the `users` table linked to your auth user
3. Set the user's role to `stake_president` (or appropriate role)

You can do this via SQL:

```sql
-- Create a stake
INSERT INTO stakes (name) VALUES ('Your Stake Name') RETURNING id;

-- Create a user profile (replace 'your-auth-user-id' with your actual auth user ID)
INSERT INTO users (id, role, stake_id)
VALUES (
  'your-auth-user-id',
  'stake_president',
  (SELECT id FROM stakes LIMIT 1)
);
```

## Step 6: Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 7: Register Your First User

1. Navigate to `/register`
2. Create your account
3. After registration, update your user record in the database to set your role and stake_id (see Step 5)

## Troubleshooting

### Database Connection Issues
- Verify your Supabase credentials in `.env.local`
- Check that your Supabase project is active
- Ensure RLS policies are enabled (they should be from the migrations)

### Authentication Issues
- Make sure you've created a user record in the `users` table
- Verify the user's `stake_id` is set correctly
- Check that the user's role is one of the allowed roles

### Import/Export Issues
- Ensure you have the correct role (stake_president, counselor, or clerk) for import functionality
- Check that CSV files match the expected table structure

## Next Steps

Once everything is set up:
1. Explore the dashboard and all modules
2. Import your existing Google Sheets data via the Settings page
3. Customize the app to fit your specific needs
4. Add more users and assign appropriate roles


