# Using GitHub Desktop to Push

## Steps in GitHub Desktop:

1. **Make sure your repository is open:**
   - In GitHub Desktop, click "File" → "Add Local Repository"
   - Browse to: `C:\Users\kinca\Ryan's Stake App`
   - Click "Add repository"

2. **Check the repository URL:**
   - Click "Repository" → "Repository settings"
   - Under "Remote", make sure it shows: `https://github.com/rsgarrett/Stake-App.git`
   - If not, click "Edit" and change it to: `https://rsgarrett@github.com/rsgarrett/Stake-App.git`

3. **Stage and commit all files:**
   - In the left panel, check all files you want to commit
   - At the bottom, type a commit message: "Initial commit - Stake President App"
   - Click "Commit to main"

4. **Push to GitHub:**
   - Click the "Push origin" button (usually at the top)
   - When prompted for credentials:
     - Username: `rsgarrett`
     - Password: Use the Personal Access Token (NOT the GitHub password)

5. **Done!** ✅

---

## If you get an error:

If it says "Permission denied" or similar:
- Make sure you're using the Personal Access Token as the password
- Make sure the remote URL has `rsgarrett` in it
- Try removing the remote and adding it again with the username in the URL

