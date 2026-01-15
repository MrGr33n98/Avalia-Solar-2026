# Docker Image Name Mismatch Fix

## Issues Found and Fixed

### 1. Backend Image Name Typo

**docker-compose.yml (line 40):**
```yaml
image: ghcr.io/mrg3n3r98/avalia-solar-2026-backend:latest
```
Note the typo: `mrg3n3r98` (with extra "3" and "r")

**GitHub Actions workflow pushes to:**
```yaml
ghcr.io/mrgr33n98/avalia-solar-2026-backend:latest
```
Correct spelling: `mrgr33n98`

**Result:**
- Backend image was successfully built and pushed to `ghcr.io/mrgr33n98/avalia-solar-2026-backend:latest`
- Deployment tried to pull `ghcr.io/mrg3n3r98/avalia-solar-2026-backend:latest` (wrong name)
- Got "manifest unknown" error because that image doesn't exist
- Frontend worked because the name was correct

### 2. Incorrect Entrypoint Path

**Dockerfile.backend:**
```dockerfile
ENTRYPOINT ["/usr/bin/entrypoint.sh"]
CMD ["bundle", "exec", "rails", "server", "-b", "0.0.0.0", "-p", "3001"]
```

**docker-compose.yml was overriding with wrong path:**
```yaml
entrypoint: ["/app/entrypoint.sh"]  # Wrong! File is at /usr/bin/entrypoint.sh
command: ["bundle", "exec", "rails", "server", "-b", "0.0.0.0", "-p", "3001"]
```

**Fix:** Removed the entrypoint and command overrides from docker-compose.yml since they're already correctly defined in the Dockerfile.

### 3. Incorrect Storage Volume Mount Path

**Dockerfile copies to:**
```dockerfile
WORKDIR /app
COPY AB0-1-back/ ./
```
This puts storage at `/app/storage`

**docker-compose.yml was mounting to:**
```yaml
volumes:
  - ./AB0-1-back/storage:/app/AB0-1-back/storage  # Wrong!
```

**Fix:** Changed to correct path:
```yaml
volumes:
  - ./AB0-1-back/storage:/app/storage
```

## Files Modified

1. `docker-compose.yml` - Fixed:
   - Backend image name typo
   - Removed incorrect entrypoint/command overrides
   - Fixed storage volume mount path

## Next Steps

1. Commit and push these fixes
2. The deployment should now succeed because:
   - Image name matches between push and pull
   - Entrypoint path is correct
   - Storage volume path is correct

## Summary

Three issues were fixed in docker-compose.yml:
1. **Image name typo** - caused "manifest unknown" error
2. **Wrong entrypoint path** - would have caused container startup failure
3. **Wrong volume mount path** - would have caused storage issues
