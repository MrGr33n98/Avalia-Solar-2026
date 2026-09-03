# Email Domain Model Specification

## Core Domain Entities (Tenant Scoped)

1. **`Sales::EmailAccount`** (`sales_email_accounts`):
   - Scope: `user_id`, `tenant_id`
   - Attributes: `email`, `provider` (`ses`, `google`, `microsoft`), `access_token_encrypted`, `refresh_token_encrypted`, `sync_status`, `last_synced_at`.

2. **`Sales::EmailThread`** (`sales_email_threads`):
   - Scope: `sales_account_id` / `tenant_id`
   - Attributes: `provider_thread_id`, `subject_normalized`, `first_message_at`, `last_message_at`, `message_count`.

3. **`Sales::EmailMessage`** (`sales_email_messages`):
   - Attributes: `sales_email_account_id`, `sales_email_thread_id`, `body_json` (TipTap), `body_html`, `body_text`, `provider_message_id`, `in_reply_to`, `references_header`, `tracking_token`, `status`.

4. **`Sales::EmailParticipant`** (`sales_email_participants`):
   - Attributes: `sales_email_message_id`, `sales_contact_id`, `participant_type` (`from`, `to`, `cc`, `bcc`), `name`, `email`.

5. **`Sales::EmailAttachment`** (`sales_email_attachments`):
   - Attributes: `sales_email_message_id`, `file_name`, `content_type`, `file_size`, `inline`, `content_id`.

6. **`Sales::EmailTemplate`** (`sales_email_templates`):
   - Attributes: `name`, `subject_template`, `body_json`, `category`, `tenant_id`.

7. **`Sales::EmailSignature`** (`sales_email_signatures`):
   - Attributes: `user_id`, `sales_email_account_id`, `body_html`, `is_default`.
