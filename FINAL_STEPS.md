# 🎉 Almost There! Final Steps:

## ✅ What You've Done:
- ✅ Database setup complete
- ✅ .env.local file configured
- ✅ All credentials in place

## 🚀 Next Steps:

### Step 1: Install Dependencies (if not done)

Open terminal in this folder and run:
```bash
npm install
```

### Step 2: Create Your Stake

Go to Supabase SQL Editor and run:
```sql
INSERT INTO stakes (name) VALUES ('Your Stake Name') RETURNING id;
```
(Replace 'Your Stake Name' with your actual stake name)

**Save the returned ID** - you might need it later!

### Step 3: Start the App

```bash
npm run dev
```

The app will start at http://localhost:3000

### Step 4: Register Your Account

1. Go to http://localhost:3000/register
2. Create your account with email and password
3. **Important:** After registering, get your user ID:
   - Go to Supabase Dashboard → Authentication → Users
   - Find your email
   - Copy the UUID (user ID)

### Step 5: Assign Your Role

Go back to Supabase SQL Editor and run:
```sql
-- Replace 'YOUR-USER-ID' with the UUID from Authentication → Users
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

### Step 6: Log In!

1. Go to http://localhost:3000
2. Log in with your credentials
3. You should see the dashboard! 🎉

## 🎯 Quick Checklist:

- [ ] Run `npm install`
- [ ] Create stake in database
- [ ] Run `npm run dev`
- [ ] Register account
- [ ] Get user ID from Supabase
- [ ] Assign stake_president role
- [ ] Log in and explore!

## 💡 Tips:

- If you see any errors, check the browser console
- Make sure your Supabase project is active
- The app will automatically redirect you to login if not authenticated

---

**You're almost done!** Follow these steps and you'll be managing your stake in no time! 🚀


