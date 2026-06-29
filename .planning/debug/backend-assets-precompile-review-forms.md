# Debug: Backend assets precompile failure after review forms MVP

status: fixing
trigger: GitHub Actions run 28342589959, build-and-push backend
expected: assets:precompile boots with dummy SECRET_KEY_BASE and dummy DATABASE_URL without a real database
actual: Rails environment task exits 1 during Docker builder step 8/8
errors: ActiveRecord::SecureToken::MinimumLengthError at app/models/review_form.rb:18
reproduction: SECRET_KEY_BASE=dummy_value_for_assets_precompile_only DATABASE_URL=postgresql://localhost/dummy bundle exec rake assets:precompile --trace
timeline: started with commit 2e99e2f2 / PR #1333

## Root cause
- ActiveAdmin loads `app/admin/review_forms.rb`, which loads `ReviewForm` while Rails
  boots for `assets:precompile`.
- `has_secure_token :token, length: 10` violates Rails 7.0.8.4's minimum secure-token
  length of 24 characters.
- The exception happens before assets compilation and does not involve a database
  connection.

## Evidence
- Previous deploy before PR #1333 passed.
- Ruby syntax checks passed locally, but full Rails boot was previously blocked locally by an existing ActiveAdmin/Arbre gem mismatch.
- GitHub run 28342589959 shows `ActiveRecord::SecureToken::MinimumLengthError`, then
  `app/models/review_form.rb:18` and `app/admin/review_forms.rb:1` in the stack.

## Fix
- Set the review form secure token length to 24.
- Do not validate token presence before `has_secure_token`'s `before_create` callback;
  the database `NOT NULL` constraint and unique index remain in force.
- Add a model-test assertion for the token length.

## Next action
Run syntax, boot, Zeitwerk, routes, assets and focused tests.
