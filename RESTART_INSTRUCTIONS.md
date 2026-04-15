# How to Restart the Dev Server

## Quick Method:

1. **Find the terminal window** where `npm run dev` is running
2. **Press Ctrl+C** to stop it
3. **Run this command:**
   ```bash
   npm run dev
   ```
   Or double-click `start-app.bat`

## Alternative Method:

If you can't find the terminal:
1. **Press Ctrl+Shift+Esc** to open Task Manager
2. Look for **"node"** processes
3. End any that are using port 3000
4. Then run `npm run dev` again

## After Restarting:

1. Wait for it to say **"Ready"**
2. Go to http://localhost:3000
3. Try logging in again

---

**The server needs to restart to load your .env.local file!**


