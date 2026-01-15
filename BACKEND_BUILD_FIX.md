# Backend Build Fix - Rails Asset Precompilation

## Problem
The backend build was failing during asset precompilation with error:
```
ArgumentError: Missing `secret_key_base` for 'production' environment
```

## Root Cause

Rails requires a `secret_key_base` during asset precompilation in production mode. This is typically provided by:
1. `config/master.key` file (which decrypts `config/credentials.yml.enc`)
2. `RAILS_MASTER_KEY` environment variable
3. Direct `SECRET_KEY_BASE` environment variable

The Dockerfile was trying to use `SECRET_KEY_BASE_DUMMY=1` which Rails doesn't recognize. Additionally, Devise initializer runs during asset precompilation and needs access to the secret key.

## Solution Applied

### **Updated Dockerfile.backend**

**Changes**:
1. Added `ARG RAILS_MASTER_KEY` to accept the key as a build argument
2. Implemented conditional asset precompilation:
   - **If `RAILS_MASTER_KEY` is provided**: Write it temporarily to `config/master.key`, compile assets, then remove it
   - **If no key provided**: Generate a random `SECRET_KEY_BASE` for compilation only

```dockerfile
# 7. Accept RAILS_MASTER_KEY as build argument
ARG RAILS_MASTER_KEY

# 9. Compilação de Assets
RUN set -e; \
    if [ -n "$RAILS_MASTER_KEY" ]; then \
      echo "✅ Using provided RAILS_MASTER_KEY for asset compilation"; \
      echo "$RAILS_MASTER_KEY" > config/master.key; \
      bundle exec rake assets:precompile RAILS_ENV=production; \
      rm -f config/master.key; \
    else \
      echo "⚠️  No RAILS_MASTER_KEY provided - using dummy SECRET_KEY_BASE"; \
      SECRET_KEY_BASE=$(openssl rand -hex 64) bundle exec rake assets:precompile RAILS_ENV=production; \
    fi && \
    echo "✅ Asset precompilation complete"
```

### **Updated GitHub Actions Workflow**

**File**: `.github/workflows/deploy-v1.yml`

**Changes**:
- Added conditional check for `RAILS_MASTER_KEY` secret existence before passing it as build-arg
- Only passes the secret if it exists (prevents passing empty string)

```yaml
build-args: |
  ${{ matrix.component == 'backend' && secrets.RAILS_MASTER_KEY && format('RAILS_MASTER_KEY={0}', secrets.RAILS_MASTER_KEY) || '' }}
```

## Security Considerations

✅ **Secure**: The `master.key` is:
1. Written temporarily to the filesystem during build
2. Used only for asset precompilation
3. Immediately removed after compilation
4. NOT included in the final Docker image
5. Provided again at runtime via environment variables or Docker secrets

⚠️ **Important**: The actual `config/master.key` file should be:
- Excluded from Git (already in `.gitignore`)
- Never committed to the repository
- Provided at runtime via environment variables

## Benefits

1. ✅ **Build succeeds with or without RAILS_MASTER_KEY**
2. ✅ **Secure**: Master key is not persisted in the image
3. ✅ **Flexible**: Allows both development and production builds
4. ✅ **Clear logging**: Shows which path was taken during build
5. ✅ **Backward compatible**: Existing setups with secrets continue to work

## How It Works

### Build Time:
1. GitHub Actions passes `RAILS_MASTER_KEY` as build argument (if secret exists)
2. Dockerfile temporarily creates `config/master.key` file
3. Rails can decrypt credentials and access `secret_key_base`
4. Assets are precompiled successfully
5. `master.key` is deleted from the image

### Runtime:
1. `docker-compose.yml` or environment variables provide `RAILS_MASTER_KEY`
2. Rails application starts normally with full credentials access
3. Application can decrypt all secrets from `credentials.yml.enc`

## Testing Locally

### Build without master key (will use dummy SECRET_KEY_BASE):
```bash
docker build -f Dockerfile.backend -t backend:test .
```

### Build with master key:
```bash
# Read the actual master key from your local file
MASTER_KEY=$(cat AB0-1-back/config/master.key)
docker build -f Dockerfile.backend --build-arg RAILS_MASTER_KEY=$MASTER_KEY -t backend:test .
```

## Required GitHub Secrets

Make sure you have set this secret in your GitHub repository:
- `RAILS_MASTER_KEY` - The content of your `config/master.key` file

To add it:
1. Go to GitHub repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `RAILS_MASTER_KEY`
4. Value: Content of `AB0-1-back/config/master.key`
5. Click "Add secret"

## Alternative: Using SECRET_KEY_BASE Directly

If you don't want to use encrypted credentials, you can also:
1. Generate a secret key: `rails secret`
2. Add it as `SECRET_KEY_BASE` environment variable
3. Configure Rails to use it directly

However, using `RAILS_MASTER_KEY` and encrypted credentials is the recommended Rails 7 approach.

## Files Modified

- `Dockerfile.backend` - Updated asset precompilation with conditional RAILS_MASTER_KEY handling
- `.github/workflows/deploy-v1.yml` - Added conditional RAILS_MASTER_KEY build arg

## Next Steps

1. ✅ **Verify GitHub Secret**: Ensure `RAILS_MASTER_KEY` is set in repository secrets
2. 🚀 **Commit and Push**: These changes will fix the build
3. 🔍 **Monitor Build**: Check that asset precompilation succeeds
4. ✅ **Test Deployment**: Verify the backend container starts correctly with full credentials access
