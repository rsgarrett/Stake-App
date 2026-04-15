# 🚀 Start Here - You're Almost Done!

## ✅ Completed:
- ✅ Database setup (SQL run successfully)
- ✅ .env.local configured with all credentials

## 📋 Next Steps (In Order):

### 1. Install Dependencies (if not done)

Check if `node_modules` folder exists. If not, run:
```bash
npm install
```

### 2. Create Your Stake

In Supabase SQL Editor, run:
```sql
INSERT INTO stakes (name) VALUES ('Your Stake Name') RETURNING id;
```
(Replace 'Your Stake Name' with your actual stake name)

### 3. Start the Development Server

```bash
npm run dev
```

You should see: "Ready - started server on 0.0.0.0:3000"

### 4. Register Your Account

1. Open browser: http://localhost:3000
2. Click "Register" or go to http://localhost:3000/register
3. Create your account
4. **After registering**, go to Supabase Dashboard → Authentication → Users
5. Find your email and **copy the UUID** (this is your user ID)

### 5. Assign Your Role

In Supabase SQL Editor, run (replace YOUR-USER-ID with the UUID you copied):
```sql
INSERT INTO users (id, role, stake_id)
SELECT 
  'YOUR-USER-ID',
  'stake_president',
  id
FROM stakes 
LIMIT 1
ON CONFLICT (id) DO UPDATE
SET role = 'stake_president', stake_id = EXCLUDED.stake_id;
```

### 6. Log In!

1. Go to http://localhost:3000
2. Log in with your credentials
3. You should see the dashboard! 🎉

## 🎯 Quick Command Reference:

```bash
# Install dependencies
npm install

# Start the app
npm run dev

# Build for production (later)
npm run build
```

## 🆘 Troubleshooting:

**If you see "Module not found" errors:**
- Run `npm install` again

**If you can't log in:**
- Make sure you assigned your role in step 5
- Check that your user exists in the `users` table

**If the app won't start:**
- Check that `.env.local` has all values filled in
- Make sure Supabase project is active

---

**Ready?** Start with step 1 and work through them in order! 🚀


