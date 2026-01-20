@echo off
echo Committing backend entrypoint fix...

git add AB0-1-back\entrypoint.sh
git commit -m "fix: update entrypoint.sh to run migrations before server start

- Add database setup and migrations to entrypoint.sh
- This ensures database is ready before healthcheck runs
- Prevents backend container from being unhealthy on deploy
- Fixes issue where backend container restarts continuously"

echo.
echo Pushing to GitHub...
git push origin main

echo.
echo Done! GitHub Actions will now deploy with the fixed backend.
pause
