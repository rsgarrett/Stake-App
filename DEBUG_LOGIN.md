# Debug Login Issues

## If "Sign in" button does nothing:

### Step 1: Check Browser Console
1. Press **F12** (or right-click → Inspect)
2. Click the **Console** tab
3. Try logging in again
4. Look for any **red error messages**
5. Copy any errors you see

### Step 2: Check Network Tab
1. In the browser DevTools, click **Network** tab
2. Try logging in again
3. Look for requests to Supabase
4. Check if any requests are failing (red)

### Step 3: Verify Environment Variables
Make sure your `.env.local` file has:
- `NEXT_PUBLIC_SUPABASE_URL` (should start with https://)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (should be a long JWT token)

### Step 4: Check if Button is Disabled
The button should show "Signing in..." when clicked. If it doesn't change, the form might not be submitting.

### Step 5: Try Manual Login Test
Open browser console and run:
```javascript
// Check if Supabase is configured
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
```

## Common Issues:

1. **Button doesn't respond**: JavaScript error - check console
2. **"Invalid credentials"**: Wrong password or email
3. **"Email not confirmed"**: Run the SQL to confirm email
4. **Redirects back to login**: Session not being saved - check cookies

## Quick Fixes:

1. **Hard refresh**: Press Ctrl+Shift+R (or Cmd+Shift+R on Mac)
2. **Clear browser cache**: Settings → Clear browsing data
3. **Try incognito mode**: See if extensions are interfering
4. **Check .env.local**: Make sure it's in the project root

---

**Tell me what errors you see in the console and I can help fix them!**


