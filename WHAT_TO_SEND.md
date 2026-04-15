# 📦 What to Send Your Dad

## ✅ **Include These:**
- All your code files (`app/`, `components/`, `lib/`, `types/`, etc.)
- Configuration files (`package.json`, `next.config.js`, `tsconfig.json`, `tailwind.config.ts`)
- Documentation files (`.md` files)
- Migration files (`supabase/migrations/`)
- `.gitignore` file

## ❌ **DON'T Include These:**
- `node_modules/` folder (too large - he'll run `npm install`)
- `.env.local` file (contains secrets - he needs to create his own)
- `.next/` folder (build files - will be regenerated)
- `.git/` folder (not needed if just sending files)

## 📝 **Quick Steps:**

### 1. Create Zip File:
- Right-click your `Ryan's Stake App` folder
- Select "Send to" → "Compressed (zipped) folder"

### 2. Before Sending - Optional Cleanup:
If the zip is too large, you can temporarily move these folders out:
- `node_modules/` (he'll install it anyway)
- `.next/` (build files)
- `.git/` (git history - optional)

### 3. Send the Zip:
- Email it
- Upload to OneDrive/Google Drive/Dropbox and share the link
- USB drive

## 🚀 **What Your Dad Needs to Do:**

1. Extract the zip file
2. Open the folder in a terminal
3. Run: `npm install` (installs all dependencies)
4. Create `.env.local` file (you'll need to share the content - but NOT the actual secrets from your file!)
5. Run: `npm run dev` (starts the app)

---

**Note:** Make sure to tell your dad NOT to use your `.env.local` file if it's in there - he needs to create his own with his own Supabase credentials!

