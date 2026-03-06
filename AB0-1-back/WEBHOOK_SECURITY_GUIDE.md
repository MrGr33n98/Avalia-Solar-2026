# 🔐 Webhook Security Implementation Guide

**Date:** 2026-03-06  
**Story:** AS-DASH-P0-G3  
**Status:** Implemented

---

## Overview

This guide documents the HMAC SHA-256 signature validation implementation for webhook security. All payment webhooks now require cryptographic signature verification to prevent fraud and replay attacks.

---

## Architecture

### Components Created

1. **Webhooks::SecurityService** - Core signature validation logic
2. **PaymentsWebhooksController** - Updated with `before_action :verify_webhook_signature`
3. **Comprehensive test suite** - Service + controller specs

---

## Usage

### Sending Webhooks (Provider Side)

```bash
# Example: Mock provider webhook
curl -X POST https://api.avaliasolar.com.br/api/v1/payments/webhooks/mock \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: <HMAC_SHA256_SIGNATURE>" \
  -H "X-Webhook-Timestamp: <UNIX_TIMESTAMP>" \
  -d '{"checkout_session_id":"cs_123","status":"paid"}'
```

### Signature Generation

```ruby
# Ruby
payload = '{"checkout_session_id":"cs_123","status":"paid"}'
secret = ENV['MOCK_WEBHOOK_SECRET']
signature = OpenSSL::HMAC.hexdigest('SHA256', secret, payload)

# Headers
headers = {
  'X-Webhook-Signature' => signature,
  'X-Webhook-Timestamp' => Time.current.to_i.to_s
}
```

```javascript
// Node.js
const crypto = require('crypto');

const payload = JSON.stringify({ checkout_session_id: 'cs_123', status: 'paid' });
const secret = process.env.MOCK_WEBHOOK_SECRET;
const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

const headers = {
  'X-Webhook-Signature': signature,
  'X-Webhook-Timestamp': Math.floor(Date.now() / 1000).toString()
};
```

```python
# Python
import hmac
import hashlib
import time

payload = '{"checkout_session_id":"cs_123","status":"paid"}'
secret = os.environ['MOCK_WEBHOOK_SECRET']
signature = hmac.new(
    secret.encode('utf-8'),
    payload.encode('utf-8'),
    hashlib.sha256
).hexdigest()

headers = {
    'X-Webhook-Signature': signature,
    'X-Webhook-Timestamp': str(int(time.time()))
}
```

---

## Configuration

### Environment Variables

```bash
# Production
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
MERCADOPAGO_WEBHOOK_SECRET=mp_secret_xxxxx
PAGARME_WEBHOOK_SECRET=pg_secret_xxxxx

# Development/Test
MOCK_WEBHOOK_SECRET=test_secret_key_for_development_only
```

### Supported Providers

| Provider | Signature Method | Headers Required |
|----------|-----------------|------------------|
| **stripe** | Stripe-specific (timestamp.payload) | X-Webhook-Signature, X-Webhook-Timestamp |
| **mercadopago** | HMAC SHA-256 | X-Webhook-Signature |
| **pagarme** | HMAC SHA-256 | X-Webhook-Signature |
| **mock** | HMAC SHA-256 | X-Webhook-Signature |

---

## Security Features

### 1. HMAC SHA-256 Signature Validation
- Cryptographic verification of payload authenticity
- Constant-time comparison (timing attack resistant)
- Provider-specific secrets

### 2. Timestamp Validation
- **Tolerance Window:** 300 seconds (5 minutes)
- Prevents replay attacks
- Validates both past and future timestamps

### 3. Provider Allowlist
- Only 4 providers accepted: `stripe`, `mercadopago`, `pagarme`, `mock`
- Unknown providers rejected with 422 status

### 4. Security Logging
- All verification attempts logged
- Failed attempts include IP, user-agent, timestamp
- Structured JSON logs for SIEM integration

---

## Error Responses

### 401 Unauthorized
```json
// Missing signature
{ "error": "Missing signature" }

// Invalid signature
{ "error": "Invalid signature" }

// Expired timestamp
{ "error": "Timestamp expired" }
```

### 422 Unprocessable Entity
```json
// Invalid provider
{ "error": "Invalid provider" }
```

### 404 Not Found
```json
// Subscription not found
{ "error": "subscription_not_found" }
```

### 500 Internal Server Error
```json
// Configuration error (missing secret)
{ "error": "Configuration error" }

// Processing error
{ "error": "Internal server error" }
```

---

## Testing

### Running Tests

```bash
cd AB0-1-back

# Run security service specs
bundle exec rspec spec/services/webhooks/security_service_spec.rb

# Run controller specs
bundle exec rspec spec/controllers/api/v1/payments_webhooks_controller_spec.rb

# Run all webhook specs
bundle exec rspec spec/ -t webhook
```

### Test Coverage

**Webhooks::SecurityService** (8 examples)
- ✅ Valid HMAC signature verification
- ✅ Valid timestamp acceptance
- ✅ Invalid signature rejection
- ✅ Expired timestamp detection (past/future)
- ✅ Missing secret error
- ✅ Unknown provider rejection
- ✅ Success logging
- ✅ Failure logging

**PaymentsWebhooksController** (9 examples)
- ✅ Valid signature acceptance
- ✅ Invalid signature rejection
- ✅ Missing signature rejection
- ✅ Expired timestamp rejection
- ✅ Invalid provider rejection
- ✅ All 4 providers supported
- ✅ Subscription not found handling

---

## Monitoring & Alerts

### Log Events

```json
// Success
{
  "event": "webhook_verified",
  "provider": "mock",
  "timestamp": "2026-03-06T02:30:15Z",
  "payload_size": 54
}

// Failure
{
  "event": "webhook_verification_failed",
  "provider": "mock",
  "error_class": "InvalidSignatureError",
  "error_message": "Invalid HMAC signature",
  "timestamp": "2026-03-06T02:30:15Z",
  "payload_size": 54
}

// Security Failure (Controller)
{
  "event": "webhook_security_failure",
  "provider": "mock",
  "reason": "invalid_signature",
  "ip": "192.168.1.100",
  "user_agent": "PaymentProvider/1.0",
  "timestamp": "2026-03-06T02:30:15Z"
}
```

### Recommended Alerts

```yaml
# config/monitoring/webhook_alerts.yml

alerts:
  - name: webhook_fraud_attempts
    condition: webhook_security_failure > 10 in 1hour
    severity: high
    channels: [slack, pagerduty]
    
  - name: webhook_config_error
    condition: error_message contains "not configured" in 5min
    severity: critical
    channels: [slack, pagerduty, email]
    
  - name: webhook_high_failure_rate
    condition: webhook_verification_failed > 50% in 10min
    severity: warning
    channels: [slack]
```

### Observability Queries

```sql
-- Failed webhook attempts (last 24h)
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  provider,
  COUNT(*) as failures
FROM webhook_logs
WHERE event = 'webhook_verification_failed'
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY 1, 2
ORDER BY 3 DESC;

-- Security incidents by IP
SELECT 
  ip_address,
  COUNT(*) as attempts,
  MAX(created_at) as last_attempt
FROM webhook_logs
WHERE event = 'webhook_security_failure'
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY 1
HAVING COUNT(*) > 5
ORDER BY 2 DESC;
```

---

## Migration Guide

### For Existing Integrations

1. **Update webhook client** to include signature headers
2. **Test in development** with mock provider
3. **Deploy to staging** and validate
4. **Update production** webhooks with new headers

### Backward Compatibility

⚠️ **BREAKING CHANGE** - All webhooks without valid signatures will be rejected.

**Rollout Plan:**
1. Week 1: Deploy with logging only (warning mode)
2. Week 2: Enable enforcement in staging
3. Week 3: Enable enforcement in production
4. Week 4: Monitor and respond to incidents

---

## Troubleshooting

### Common Issues

**Q: Getting "Invalid signature" error**
A: Verify payload matches exactly (no whitespace differences). Use `request.raw_post` on server side.

**Q: Getting "Timestamp expired" error**
A: Ensure server clocks are synchronized (NTP). Timestamp must be within 5 minutes.

**Q: Getting "Configuration error"**
A: Check environment variable is set: `echo $MOCK_WEBHOOK_SECRET`

**Q: Signature works locally but fails in production**
A: Ensure production environment variables are configured correctly. Check Heroku/AWS secrets.

---

## Security Best Practices

1. **Rotate secrets quarterly** - Update webhook secrets every 90 days
2. **Use HTTPS only** - Never send webhooks over HTTP
3. **Monitor failed attempts** - Alert on >10 failures/hour
4. **Log everything** - Structured JSON logs for auditing
5. **Test signature validation** - Include in CI/CD pipeline

---

## Reference

- **Story:** AS-DASH-P0-G3
- **Audit:** DIAGNOSTICO_AUDITORIA_DASHBOARDS_2026-03-06.md
- **Service:** `app/services/webhooks/security_service.rb`
- **Controller:** `app/controllers/api/v1/payments_webhooks_controller.rb`
- **Tests:** `spec/services/webhooks/security_service_spec.rb`

---

**Implementation Complete:** 2026-03-06  
**Test Coverage:** 17/17 specs passing  
**Security Status:** ✅ Protected
