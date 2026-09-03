# Email Provider Architecture

## Architecture Overview

All outbound and inbound message operations route through a unified provider layer:

`Sales::Messaging::Providers::Base`
- `Sales::Messaging::Providers::Ses`
- `Sales::Messaging::Providers::Google`
- `Sales::Messaging::Providers::Microsoft`

### Provider Interface
- `send_message(message, options = {})`
- `create_draft(message)`
- `sync_folder(account, folder, cursor)`

### Real AWS SES Driver
Uses `Aws::SESV2::Client` / `Aws::SES::Client` with AWS IAM credentials or DigitalOcean Spaces credentials fallback.
Stores the returned real `provider_message_id` on successful dispatch.
