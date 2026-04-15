# 🚀 Quick Start - Run These Commands:

## Option 1: Use the Batch File (Easiest)

**Double-click `install-and-start.bat`** - it will:
- Install all dependencies
- Start the development server
- Show you the URL

## Option 2: Manual Commands

Open PowerShell or Command Prompt **in this folder** and run:

```bash
npm install
```

Then:

```bash
npm run dev
```

## 🌐 Your App URL:

Once the server starts, your app will be available at:

### **http://localhost:3000**

## 📝 After the Server Starts:

1. Open http://localhost:3000 in your browser
2. Click "Register" to create your account
3. After registering, get your user ID from Supabase → Authentication → Users
4. Run this SQL to assign your role (replace YOUR-USER-ID):

```sql
INSERT INTO users (id, role, stake_id)
SELECT 
  'YOUR-USER-ID',
  'stake_president',
  id
FROM stakes 
WHERE name = 'Clearfield Utah North Stake'
LIMIT 1
ON CONFLICT (id) DO UPDATE
SET role = 'stake_president', stake_id = EXCLUDED.stake_id;
```

5. Log in at http://localhost:3000

---

**Ready?** Double-click `install-and-start.bat` or run the commands manually! 🎉


