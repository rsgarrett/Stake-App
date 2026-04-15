# GitHub Authentication - Simple Guide

You have **3 options** to push code to GitHub. You only need **ONE** of these:

## Option 1: Personal Access Token (EASIEST - Recommended) ✅

**What you need:** Just a token from GitHub (no keys to generate)

**Steps:**
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Name it (e.g., "Stake App")
4. Check the **`repo`** box
5. Click "Generate token"
6. **Copy the token** (you won't see it again!)

**When pushing:**
- Username: Your dad's GitHub username
- Password: Paste the token (NOT the regular password)

**Pros:** Easy, no setup, works immediately
**Cons:** Token expires (but you can set expiration date)

---

## Option 2: SSH Keys

**What you need:** Generate an SSH key pair on your computer

**Steps:**
1. Generate key: `ssh-keygen -t ed25519 -C "your_email@example.com"`
2. Copy public key: `cat ~/.ssh/id_ed25519.pub` (or `type %USERPROFILE%\.ssh\id_ed25519.pub` on Windows)
3. Add to GitHub: https://github.com/settings/keys → "New SSH key"
4. Paste the public key
5. Change remote URL to SSH: `git remote set-url origin git@github.com:USERNAME/REPO.git`

**Pros:** More secure, no password prompts after setup
**Cons:** More setup steps

---

## Option 3: GPG Keys (NOT NEEDED FOR PUSHING)

**What it is:** For signing commits (optional feature)

**Do you need it?** NO - This is only if you want to sign your commits. It's NOT required for pushing code.

---

## Recommendation

**Just use Option 1 (Personal Access Token)** - it's the easiest and fastest way to get your code pushed to GitHub right now.

You can always set up SSH keys later if you want, but for now, a token will work perfectly!

