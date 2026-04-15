# ✅ Almost Done! Final Steps:

## ✅ Completed:
- ✅ Database setup (all tables created)
- ✅ .env.local file created with your credentials
- ✅ Encryption key generated and added

## 🔧 What You Need to Do:

### 1. Add Your Service Role Key

1. Go to: https://supabase.com/dashboard/project/gqqbllsbukcipczrdjma
2. Click **Settings** (gear icon) → **API**
3. Copy the **service_role** key (the long one, keep it secret!)
4. Open `.env.local` file
5. Replace `your_service_role_key_here` with your actual service role key

### 2. Install Dependencies

Open a terminal/command prompt in this folder and run:
```bash
npm install
```

### 3. Create Your Stake

Go to Supabase SQL Editor and run:
```sql
INSERT INTO stakes (name) VALUES ('Your Stake Name') RETURNING id;
```
(Replace 'Your Stake Name' with your actual stake name)

Or use the `CREATE_STAKE.sql` file I created.

### 4. Start the App

```bash
npm run dev
```

### 5. Register Your Account

1. Go to http://localhost:3000/register
2. Create your account
3. **Get your user ID** from Supabase Dashboard → Authentication → Users

### 6. Assign Your Role

In Supabase SQL Editor, run (replace `YOUR-USER-ID`):
```sql
INSERT INTO users (id, role, stake_id)
SELECT 'YOUR-USER-ID', 'stake_president', id FROM stakes LIMIT 1
ON CONFLICT (id) DO UPDATE
SET role = 'stake_president', stake_id = EXCLUDED.stake_id;
```

### 7. Log In!

Go to http://localhost:3000 and log in!

---

## 📝 Quick Checklist:

- [ ] Added Service Role Key to `.env.local`
- [ ] Ran `npm install`
- [ ] Created stake in database
- [ ] Started app with `npm run dev`
- [ ] Registered account
- [ ] Assigned stake_president role
- [ ] Logged in successfully

---

**Your .env.local file is ready!** Just add your Service Role Key and you're good to go! 🚀


