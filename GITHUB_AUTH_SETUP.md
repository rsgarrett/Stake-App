# GitHub Authentication Setup Guide

GitHub requires authentication to push code. You have two options:

## Option 1: Personal Access Token (Easiest - Recommended)

### Step 1: Create a Personal Access Token
1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Give it a name like "Stake App Push"
4. Select the **`repo`** scope (this gives full access to repositories)
5. Click **"Generate token"**
6. **IMPORTANT**: Copy the token immediately - you won't be able to see it again!

### Step 2: Use the Token
When you run the push command and it asks for:
- **Username**: Enter your dad's GitHub username
- **Password**: Paste the Personal Access Token (NOT the regular password)

## Option 2: SSH Keys (More Secure, but More Setup)

### Step 1: Generate SSH Key
Open PowerShell or Command Prompt and run:
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```
(Press Enter to accept default file location, and optionally set a passphrase)

### Step 2: Copy the Public Key
```bash
cat ~/.ssh/id_ed25519.pub
```
Copy the entire output.

### Step 3: Add to GitHub
1. Go to: https://github.com/settings/keys
2. Click **"New SSH key"**
3. Give it a title
4. Paste the public key
5. Click **"Add SSH key"**

### Step 4: Use SSH URL
When adding the remote, use the SSH URL instead:
```
git@github.com:USERNAME/REPO-NAME.git
```

## Quick Push After Authentication

Once you have authentication set up, you can push with:
```bash
git push -u origin main
```

Or run the `complete-github-setup.bat` script again.

