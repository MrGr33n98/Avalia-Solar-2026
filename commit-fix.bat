@echo off
cd /d "%~dp0"

git add .github\workflows\deploy-v1.yml

git commit -m "fix: resolve NoEnvironmentInSchemaError on fresh database setup

- Added db:environment:set before db:schema:load for fresh databases
- Split schema:load and seed into separate commands
- Added fallback for seed failures (when no seed file exists)
- This fixes the Rails 7 environment metadata requirement

Fixes #177"

git push origin main

echo.
echo ✅ Changes committed and pushed!
pause
