# 🔐 GitHub Secrets Configuration Guide

## Required Secrets for Build

Two secrets are required for the Next.js build to succeed:

### 1. NEXT_SERVER_ACTIONS_ENCRYPTION_KEY
- **Purpose:** Encrypts Server Actions in Next.js
- **How to generate:**
  ```bash
  openssl rand -base64 32
  ```
- **Example output:** `Base64String+WithPlus/SignCharacters==`

### 2. BETTER_AUTH_SECRET  
- **Purpose:** BetterAuth library secret key
- **How to generate:**
  ```bash
  openssl rand -hex 32
  ```
- **Example output:** `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

## Adding Secrets to GitHub

1. Go to: **GitHub Repository > Settings > Secrets and variables > Actions**
2. Click **New repository secret**
3. Add each secret:

   **Secret 1:**
   - Name: `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`
   - Value: (paste base64 value from openssl rand -base64 32)

   **Secret 2:**
   - Name: `BETTER_AUTH_SECRET`
   - Value: (paste hex value from openssl rand -hex 32)

4. Click **Add secret**
5. Verify both secrets appear in the list

## Testing

Run the workflow again after adding secrets:
```bash
git push origin main  # Triggers workflow
# Or go to Actions tab and click "Run workflow"
```

## Security Notes

- ✅ Secrets are encrypted at rest
- ✅ Only exposed to workflow runs
- ✅ Never logged or displayed
- ✅ Rotate periodically (recommended: every 90 days)
- ✅ Use strong random generation (openssl, 1password, bitwarden, etc)

## Troubleshooting

**If build still fails after adding secrets:**
1. Wait 30 seconds (GitHub syncs secrets)
2. Re-run the workflow
3. Check secrets are spelled EXACTLY (case-sensitive)
4. Verify secrets use correct format (base64 for encryption key, hex for auth secret)
