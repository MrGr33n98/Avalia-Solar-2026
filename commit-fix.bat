@echo off
cd /d "%~dp0"

git add AB0-1-back\db\migrate\202512280001_add_effect_to_companies.rb
git add .github\workflows\deploy-v1.yml

git commit -m "fix: handle fresh database setup and fix migration error

- Added table_exists? check to AddEffectToCompanies migration
- Updated deployment workflow to detect fresh vs existing database
- Fresh databases now use schema:load instead of migrate
- Prevents PG::UndefinedTable error when tables don't exist yet

Fixes #176"

git push origin main

echo.
echo ✅ Changes committed and pushed!
pause
