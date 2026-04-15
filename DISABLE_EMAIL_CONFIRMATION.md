# Disable Email Confirmation - Step by Step

## Quick Steps:

1. **Go to your Supabase Dashboard:**
   https://supabase.com/dashboard/project/gqqbllsbukcipczrdjma

2. **Click "Authentication"** in the left sidebar

3. **Click "Providers"** (under Authentication)

4. **Click "Email"** provider

5. **Scroll down** to find the **"Confirm email"** section

6. **Uncheck** the checkbox that says **"Enable email confirmations"**

7. **Click "Save"** at the bottom

8. **Try logging in again** at http://localhost:3000

---

## Visual Guide:

```
Supabase Dashboard
  └─ Authentication (left sidebar)
      └─ Providers
          └─ Email
              └─ Scroll to "Confirm email" section
                  └─ Uncheck "Enable email confirmations"
                      └─ Click "Save"
```

---

**After disabling, you'll be able to log in immediately without confirming your email!**


