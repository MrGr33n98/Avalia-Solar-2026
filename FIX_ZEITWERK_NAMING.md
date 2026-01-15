# Zeitwerk Naming Convention Fix

## Issue

The Rails application was failing to start in production with a Zeitwerk autoloading error:

```
expected file /app/app/services/videos/youtube_extractor.rb to define constant Videos::YoutubeExtractor, but didn't
```

## Root Cause

**Zeitwerk Naming Convention Mismatch:**

In Rails with Zeitwerk (the default autoloader since Rails 6), there's a strict naming convention between file paths and class/module names:

- **File path:** `app/services/videos/youtube_extractor.rb`
- **Expected class name:** `Videos::YoutubeExtractor` (matching snake_case → CamelCase conversion)
- **Actual class name:** `Videos::YouTubeExtractor` (with capital T and E)

The problem: `YouTubeExtractor` with capital T and E doesn't follow Zeitwerk's inflection rules. The file name `youtube_extractor.rb` should map to `YoutubeExtractor` (only first letter capitalized).

## Fix Applied

Changed the class name in `app/services/videos/youtube_extractor.rb`:

```diff
module Videos
-  class YouTubeExtractor
+  class YoutubeExtractor
```

## Why This Matters

- **Development:** Works fine because Rails eager loading is disabled by default
- **Production:** Fails because `config.eager_load = true` loads all classes at boot
- **Zeitwerk:** Enforces strict naming conventions for predictable autoloading

## Files Modified

1. `AB0-1-back/app/services/videos/youtube_extractor.rb` - Fixed class name

## Next Steps

1. Commit this fix
2. Push to trigger redeployment
3. Backend should now start successfully in production

## Learn More

Zeitwerk naming conventions:
- `some_service.rb` → `SomeService`
- `some_api_client.rb` → `SomeApiClient` (not `SomeAPIClient`)
- `youtube_extractor.rb` → `YoutubeExtractor` (not `YouTubeExtractor`)
