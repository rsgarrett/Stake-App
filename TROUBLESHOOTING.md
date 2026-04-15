# 🆘 Troubleshooting & Startup Guide

## Connection Refused / ERR_CONNECTION_REFUSED

If you see "Connection Failed", "Browser Connection was refused", or `ERR_CONNECTION_REFUSED`, **the dev server is not running**.

**Fix:** Start the server first, then open your browser.

- **Mac/Linux:** Run `./start.sh` or `npm run dev` in Terminal
- **Windows:** Double-click `start-app.bat`
- **In Cursor:** Cmd+Shift+P → "Tasks: Run Task" → "Start Dev Server"

**Important:** Keep the terminal window open while using the app. Closing it stops the server.

---

## How to Start the App

**Mac/Linux:** Run `./start.sh` or `npm run dev`

**Windows:** Double-click `start-app.bat`

The launcher will:
1. Check for your credentials
2. Install dependencies if missing
3. Start the server at http://localhost:3000

## How to Fix "Access Denied" or Installation Errors

**Double-click `repair-app.bat`**
Run this if you see errors like `EPERM`, `Access is denied`, or weird crashes. It performs a full cleanup and reinstall.

## ⚠️ "Terminal Error" in Cursor/VS Code?
If you see errors about "PowerShell" or "syntax" when asking the AI to run commands, it means the AI's connection to your terminal is glitchy.

**Solution:** Don't rely on the AI to run the command. Just double-click the `.bat` files in your folder yourself.

## Checklist for Success
- [ ] `.env.local` file exists with your keys
- [ ] Dependencies installed (run `start-app.bat`)
- [ ] Stake created in Supabase (run SQL)
- [ ] Server running on localhost:3000


