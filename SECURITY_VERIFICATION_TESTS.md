# ⚡ QUICK SECURITY VULNERABILITY VERIFICATION TESTS
## Run these to confirm vulnerabilities exist BEFORE implementing fixes

---

## TEST 1: Verify IDOR Vulnerability Exists

### Setup
```bash
# Create test companies and users
rails c
user_a = User.create!(email: 'user_a@test.com', password: 'test123')
user_b = User.create!(email: 'user_b@test.com', password: 'test123')
company_a = Company.create!(name: 'Company A', segment: 'installer')
company_b = Company.create!(name: 'Company B', segment: 'installer')

# Add memberships (active)
user_a.company_members.create!(company: company_a, role: 'owner', status: 'active')
user_b.company_members.create!(company: company_b, role: 'owner', status: 'active')

# Generate tokens
token_a = user_a.jwt_token
token_b = user_b.jwt_token

puts "User A token: #{token_a}"
puts "User B token: #{token_b}"
puts "Company A ID: #{company_a.id}"
puts "Company B ID: #{company_b.id}"
```

### Exploit Test
```bash
# Test 1a: User A tries to access Company B data with company_id param
curl -s -X GET \
  -H "Authorization: Bearer $TOKEN_A" \
  "http://localhost:3000/api/v1/company_dashboard/stats?company_id=$COMPANY_B_ID" \
  | jq .

# EXPECTED BEFORE FIX: 
# 200 OK + { stats: { ... company_b data ... } }

# EXPECTED AFTER FIX:
# 403 Forbidden + { error: 'Unauthorized' }

echo "---"
echo "Test 1a: User A accessing Company B"
echo "If response is 200 OK with company_b data: VULNERABLE ❌"
echo "If response is 403 Forbidden: FIXED ✅"
```

---

## TEST 2: Verify Missing Analytics Authorization

### Setup
```bash
rails c
free_user = User.create!(email: 'free@test.com', password: 'test123')
free_company = Company.create!(name: 'Free Company', segment: 'installer')
free_plan = Plan.find_or_create_by!(name: 'free') { |p| p.price_cents = 0 }
free_company.update!(plan: free_plan)

free_user.company_members.create!(company: free_company, role: 'owner', status: 'active')
free_token = free_user.jwt_token

puts "Free user token: #{free_token}"
puts "Free company ID: #{free_company.id}"
```

### Exploit Test
```bash
# Test 2a: Free user trying to access premium timeseries
curl -s -X GET \
  -H "Authorization: Bearer $FREE_TOKEN" \
  "http://localhost:3000/api/v1/company_dashboard/analytics/timeseries?company_id=$FREE_COMPANY_ID" \
  | jq .

# EXPECTED BEFORE FIX:
# 200 OK + { data: [ ... 365 days of timeseries ... ] }

# EXPECTED AFTER FIX:
# 403 Forbidden + { error: 'Timeseries analytics not available in your plan' }

echo "---"
echo "Test 2a: Free user accessing timeseries"
echo "If response is 200 OK with full data: VULNERABLE ❌"
echo "If response is 403 Forbidden: FIXED ✅"

# Test 2b: Same for top_campaigns
curl -s -X GET \
  -H "Authorization: Bearer $FREE_TOKEN" \
  "http://localhost:3000/api/v1/company_dashboard/analytics/top_campaigns?company_id=$FREE_COMPANY_ID" \
  | jq .

echo "---"
echo "Test 2b: Free user accessing top_campaigns"
echo "If response is 200 OK with campaign data: VULNERABLE ❌"
echo "If response is 403 Forbidden: FIXED ✅"

# Test 2c: Same for intent_summary (most sensitive)
curl -s -X GET \
  -H "Authorization: Bearer $FREE_TOKEN" \
  "http://localhost:3000/api/v1/company_dashboard/intent_summary?company_id=$FREE_COMPANY_ID" \
  | jq .

echo "---"
echo "Test 2c: Free user accessing intent_summary (LEADS WITH EMAILS!)"
echo "If response is 200 OK with leads list: HIGHLY VULNERABLE ❌❌❌"
echo "If response is 403 Forbidden: FIXED ✅"
```

---

## TEST 3: Verify Frontend Feature Gate Bypass

### Setup
```bash
# Use existing free_user and free_company from Test 2
# Keep free_token handy
```

### Exploit Test (Browser DevTools)
```javascript
// 1. Fetch analytics data as free user
fetch('http://localhost:3000/api/v1/company_dashboard/analytics/overview', {
  headers: {
    'Authorization': `Bearer ${FREE_TOKEN}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(data => {
  console.log('Response:', data);
  console.log('Restricted metrics:', data.restricted_metrics);
})

// 2. Intercept and bypass restrictions
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const response = await originalFetch(...args);
  const data = await response.clone().json();
  
  // BYPASS: Remove all restrictions
  data.restricted_metrics = [];
  data.is_premium_analytics = true;
  
  return new Response(JSON.stringify(data), response);
};

// 3. Fetch again - now with "bypassed" restrictions
fetch('http://localhost:3000/api/v1/company_dashboard/analytics/overview', {
  headers: {
    'Authorization': `Bearer ${FREE_TOKEN}`
  }
})
.then(r => r.json())
.then(data => {
  console.log('Bypassed response:', data);
  // If you see premium data, it worked - VULNERABLE ❌
  // If backend still blocks, FIXED ✅
})
```

**Result:**
- ✅ Before fix: Frontend successfully removes restriction, all metrics now visible
- ✅ After fix: Frontend can remove UI restriction, but backend returns 403 Forbidden anyway

---

## TEST 4: Verify N+1 Queries

### Setup
```bash
rails c

# Create test intent scores
company = Company.first
100.times do |i|
  IntentScore.create!(
    company_id: company.id,
    lead_id: Lead.order('RANDOM()').first.id,
    total_score: rand(1..100),
    intent_level: ['cold', 'warm', 'hot', 'boiling'].sample,
    total_signals_count: rand(1..50),
    confidence_score: rand(10..100).to_f / 10
  )
end
```

### Query Count Test
```bash
# In Rails console, enable query logging
rails c

ActiveRecord::Base.logger = Logger.new(STDOUT)

company = Company.first
user = company.members.first

# Simulate GET /api/v1/company_dashboard/intent_summary
# and count queries

# BEFORE FIX: expect 14+ queries
# 1x IntentScore.where
# 10x Lead.find (for each intent score in the loop)
# Multiple N+1s for attributes

# AFTER FIX: expect 2-3 queries
# 1x IntentScore.where with select
# 1x Lead.where with batch fetch
```

---

## TEST 5: Verify Race Condition in Pending Changes

### Setup
```bash
rails c
test_company = Company.first
test_user = test_company.members.first
test_token = test_user.jwt_token
```

### Race Condition Test
```bash
#!/bin/bash

# Rapid fire double-click simulation
COMPANY_ID=1
TOKEN=$TEST_TOKEN

echo "Sending 2 identical requests simultaneously..."

# Request 1 & 2 in parallel
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company": { "name": "Test Update" }
  }' \
  "http://localhost:3000/api/v1/company_dashboard/update_info?company_id=$COMPANY_ID" &

sleep 0.05  # 50ms delay

curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company": { "name": "Test Update" }
  }' \
  "http://localhost:3000/api/v1/company_dashboard/update_info?company_id=$COMPANY_ID" &

wait

# Check database
echo "---"
echo "Checking created pending_changes..."
rails c << 'RAILS'
count = PendingChange.where(change_type: 'company_info').count
puts "Total pending_changes created: #{count}"

if count > 1
  puts "❌ VULNERABLE - Multiple pending_changes created!"
else
  puts "✅ FIXED - Only 1 pending_change created"
end
RAILS
```

---

## TEST 6: Verify JWT in LocalStorage

### Setup (Browser Console)
```javascript
// Check if JWT is stored in localStorage
const authToken = localStorage.getItem('auth');
const userInfo = localStorage.getItem('user');

if (authToken) {
  console.log('❌ VULNERABLE - JWT stored in localStorage!');
  console.log('Token:', authToken.substring(0, 50) + '...');
  console.log('Anyone with XSS access can steal this');
} else {
  console.log('✅ Good - No JWT in localStorage');
  console.log('Checking cookies...');
  console.log('HttpOnly cookies should be used instead');
}

// Try to access cookie (should fail if HttpOnly is set)
console.log('Trying to access jwt_token cookie:');
try {
  console.log(document.cookie);
  if (document.cookie.includes('jwt_token')) {
    console.log('⚠️ JWT token visible in cookies - check if HttpOnly flag is set');
  }
} catch (e) {
  console.log('✅ Good - Cannot access jwt_token (likely HttpOnly)');
}
```

---

## AUTOMATED TEST SUITE

```bash
#!/bin/bash
# Run all tests together

set -e

echo "🔐 Security Vulnerability Verification Tests"
echo "=============================================="
echo ""

# Test 1: IDOR
echo "TEST 1: IDOR Vulnerability"
echo "--------------------------"
ruby test_idor.rb

# Test 2: Missing Authorization
echo ""
echo "TEST 2: Missing Analytics Authorization"
echo "--------------------------------------"
ruby test_missing_auth.rb

# Test 3: N+1 Queries
echo ""
echo "TEST 3: N+1 Queries"
echo "-----------------"
ruby test_n1_queries.rb

# Test 4: Race Condition
echo ""
echo "TEST 4: Race Condition"
echo "--------------------"
ruby test_race_condition.rb

echo ""
echo "✅ All tests completed"
echo "See output above for VULNERABLE vs FIXED indicators"
```

---

## MONITORING QUERIES DURING TESTS

```bash
# Terminal 1: Start Rails with query logging
rails server --log-level=debug

# Terminal 2: Run tests and monitor output
# Look for database query counts

# Expected patterns:
# ❌ VULNERABLE: Multiple similar queries (N+1)
#    SELECT * FROM leads WHERE id = 1
#    SELECT * FROM leads WHERE id = 2
#    SELECT * FROM leads WHERE id = 3
#    ...

# ✅ FIXED: Single batch query
#    SELECT * FROM leads WHERE id IN (1, 2, 3, ..., 10)
```

---

## NEXT STEPS

1. ✅ Run tests above to confirm vulnerabilities
2. 📋 Document findings in ticket
3. 🔧 Implement fixes from `IMPLEMENTATION_GUIDE.md`
4. 🧪 Re-run tests to verify fixes work
5. 🚀 Deploy to production

---

**Note:** These tests should FAIL (show vulnerabilities) before fixes  
and PASS (show fixed state) after fixes are implemented.
