#!/bin/bash
# Health Check Examples
# Demonstra diferentes formas de usar os endpoints de health check

set -e

BASE_URL="${BASE_URL:-http://localhost:3000}"

echo "========================================="
echo "Health Check Examples"
echo "========================================="
echo "Base URL: $BASE_URL"
echo ""

# 1. Basic Health Check
echo "1. Basic Health Check"
echo "   curl $BASE_URL/health"
echo ""
curl -s "$BASE_URL/health" | jq '.'
echo ""
echo ""

# 2. Liveness Check
echo "2. Liveness Probe (Kubernetes)"
echo "   curl $BASE_URL/health/liveness"
echo ""
curl -s "$BASE_URL/health/liveness" | jq '.'
echo ""
echo ""

# 3. Readiness Check
echo "3. Readiness Probe (Kubernetes)"
echo "   curl $BASE_URL/health/readiness"
echo ""
curl -s "$BASE_URL/health/readiness" | jq '.'
echo ""
echo ""

# 4. Detailed Health
echo "4. Detailed Health Information"
echo "   curl $BASE_URL/health/details"
echo ""
curl -s "$BASE_URL/health/details" | jq '.'
echo ""
echo ""

# 5. Check only Database status
echo "5. Extract Database Status"
echo "   curl $BASE_URL/health/readiness | jq '.checks.database'"
echo ""
curl -s "$BASE_URL/health/readiness" | jq '.checks.database'
echo ""
echo ""

# 6. Check if all services are healthy
echo "6. Check if all services are ready"
echo "   curl $BASE_URL/health/readiness | jq '.status'"
echo ""
STATUS=$(curl -s "$BASE_URL/health/readiness" | jq -r '.status')
if [ "$STATUS" = "ready" ]; then
    echo "   ✅ All services are ready!"
else
    echo "   ❌ Some services are not ready"
fi
echo ""
echo ""

# 7. Monitor response time
echo "7. Monitor Response Time"
echo "   time curl $BASE_URL/health"
echo ""
time curl -s "$BASE_URL/health" > /dev/null
echo ""
echo ""

# 8. Loop monitoring (simulate monitoring tool)
echo "8. Continuous Monitoring (5 checks)"
echo "   Watch /health endpoint every 2 seconds"
echo ""
for i in {1..5}; do
    TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
    STATUS=$(curl -s "$BASE_URL/health" | jq -r '.status')
    echo "   [$TIMESTAMP] Health: $STATUS"
    sleep 2
done
echo ""
echo ""

# 9. Check with timeout
echo "9. Health Check with Timeout"
echo "   curl --max-time 5 $BASE_URL/health"
echo ""
curl -s --max-time 5 "$BASE_URL/health" | jq '.'
echo ""
echo ""

# 10. Full system diagnostics
echo "10. Full System Diagnostics"
echo "    Extract key metrics from /health/details"
echo ""
curl -s "$BASE_URL/health/details" | jq '{
  status: .status,
  environment: .environment,
  ruby_version: .ruby_version,
  rails_version: .rails_version,
  uptime: .system.uptime.human,
  memory: .system.memory.human,
  services: {
    database: .checks.database.status,
    redis: .checks.redis.status,
    sidekiq: .checks.sidekiq.status
  }
}'
echo ""
echo ""

# 11. Alert on failure (example)
echo "11. Alert Simulation (check for failures)"
echo ""
READINESS=$(curl -s -w "%{http_code}" "$BASE_URL/health/readiness" -o /tmp/health.json)
if [ "$READINESS" != "200" ]; then
    echo "   🚨 ALERT: Service is not ready! (HTTP $READINESS)"
    cat /tmp/health.json | jq '.checks'
else
    echo "   ✅ Service is healthy"
fi
rm -f /tmp/health.json
echo ""
echo ""

# 12. Prometheus style metrics
echo "12. Extract metrics for Prometheus"
echo ""
curl -s "$BASE_URL/health/details" | jq -r '
  "# Health Metrics",
  "health_status{environment=\"" + .environment + "\"} 1",
  "uptime_seconds " + (.system.uptime.seconds | tostring),
  "memory_rss_mb " + (.system.memory.rss_mb | tostring),
  "database_response_time_ms " + (.checks.database.response_time_ms | tostring),
  "database_active_connections " + (.checks.database.active_connections | tostring),
  "sidekiq_enqueued " + (.checks.sidekiq.enqueued | tostring),
  "sidekiq_failed " + (.checks.sidekiq.failed | tostring)
'
echo ""
echo ""

echo "========================================="
echo "Examples completed!"
echo "========================================="
echo ""
echo "Integration Examples:"
echo ""
echo "# Kubernetes Liveness Probe"
echo "livenessProbe:"
echo "  httpGet:"
echo "    path: /health/liveness"
echo "    port: 3000"
echo "  initialDelaySeconds: 30"
echo "  periodSeconds: 10"
echo ""
echo "# Kubernetes Readiness Probe"
echo "readinessProbe:"
echo "  httpGet:"
echo "    path: /health/readiness"
echo "    port: 3000"
echo "  initialDelaySeconds: 10"
echo "  periodSeconds: 5"
echo ""
echo "# Docker Healthcheck"
echo "healthcheck:"
echo "  test: [\"CMD\", \"curl\", \"-f\", \"http://localhost:3000/health\"]"
echo "  interval: 30s"
echo "  timeout: 10s"
echo "  retries: 3"
echo ""
echo "# Monitoring with watch"
echo "watch -n 5 'curl -s http://localhost:3000/health/readiness | jq .'"
echo ""
echo "# Alerting with cron"
echo "*/5 * * * * curl -sf http://localhost:3000/health || echo 'Service down!' | mail -s 'Alert' admin@example.com"
echo ""
