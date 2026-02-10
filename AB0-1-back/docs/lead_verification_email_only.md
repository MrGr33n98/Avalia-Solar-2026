# Lead Verification: Email-Only

## Scope

As of this update, lead verification in the wizard flow is performed **only by email**.
SMS verification was fully removed from the runtime flow.

## API behavior

- `POST /api/v1/leads/wizard_create`
  - Creates lead and sends verification code by email.
  - Returns:
    - `lead_id`
    - `otp_sent_at`
    - `verification_channel: "email"`
    - `email_hint`

- `POST /api/v1/leads/:id/send_otp`
  - Sends a new verification code by email, respecting cooldown.

- `POST /api/v1/leads/:id/resend_otp`
  - Alias endpoint that triggers `send_otp` behavior (email send).

- `POST /api/v1/leads/:id/verify_otp`
  - Verifies the 6-digit code and continues lead distribution.

## Frontend behavior

- Quick lead modal and full wizard modal now:
  - Display email verification text in UI.
  - Use `sendEmailCode`, `resendEmailCode`, `verifyEmailCode`.
  - Validate email format before submitting.
  - Never reference SMS as verification channel.

## Non-functional constraints

- Tracking and rendering must remain resilient:
  - Verification failures do not break page rendering.
  - Invalid verification payloads are blocked before request dispatch.

