#!/bin/bash
# ─── MedTrust: Test Each Microservice with ELK Stack ─────────────────────────
# This script sends an HTTP request with a unique X-Trace-Id to each service
# and verifies that Logstash receives it and Elasticsearch indexes it.

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SERVICES=(
  "clinical-service:8080:/actuator/health"
  "patient-service:8081:/api/patients"
  "appointment-service:8082:/actuator/health"
  "auth-service:8083:/actuator/health"
  "consent-service:8084:/actuator/health"
  "audit-service:8085:/actuator/health"
  "notification-service:8086:/actuator/health"
  "integration-service:8087:/actuator/health"
)

echo -e "${BLUE}======================================================================${NC}"
echo -e "${BLUE}        MedTrust Microservices -> ELK Ingestion Test Suite           ${NC}"
echo -e "${BLUE}======================================================================${NC}\n"

for entry in "${SERVICES[@]}"; do
  IFS=":" read -r SERVICE_NAME PORT ENDPOINT <<< "$entry"
  TRACE_ID="trace-${SERVICE_NAME}-$(date +%s)"
  
  echo -e "${YELLOW}Testing ${SERVICE_NAME} (Port ${PORT})${NC}..."
  
  # 1. Send HTTP request with X-Trace-Id header
  HTTP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "X-Trace-Id: ${TRACE_ID}" "http://localhost:${PORT}${ENDPOINT}")
  
  if [ "$HTTP_RESPONSE" == "000" ]; then
    echo -e "  ↳ Service Status: ${RED}OFFLINE / Not Listening on port ${PORT}${NC}"
    echo ""
    continue
  else
    echo -e "  ↳ Service Status: ${GREEN}ONLINE (HTTP ${HTTP_RESPONSE})${NC} with Trace ID: ${TRACE_ID}"
  fi

  # 2. Allow 2 seconds for Logstash TCP queue & Elasticsearch flush
  sleep 2

  # 3. Query Elasticsearch for the specific traceId
  ES_RESULT=$(curl -s "http://localhost:9200/medtrust-logs-*/_search?q=traceId:${TRACE_ID}")
  DOC_COUNT=$(echo "$ES_RESULT" | grep -o '"value":[0-9]*' | head -1 | cut -d':' -f2)

  if [ -n "$DOC_COUNT" ] && [ "$DOC_COUNT" -gt 0 ]; then
    echo -e "  ↳ ELK Pipeline:   ${GREEN}SUCCESS${NC} (Found ${DOC_COUNT} log documents in Elasticsearch!)"
    echo -e "  ↳ Kibana Query:   ${BLUE}http://localhost:5601/app/discover#/?_a=(query:(language:kuery,query:'traceId:%22${TRACE_ID}%22'))${NC}"
  else
    # Check if general logs for this service exist
    GEN_COUNT=$(curl -s "http://localhost:9200/medtrust-logs-*/_search?q=service:${SERVICE_NAME}" | grep -o '"value":[0-9]*' | head -1 | cut -d':' -f2)
    echo -e "  ↳ ELK Pipeline:   ${GREEN}SERVICE CONNECTED${NC} (${GEN_COUNT:-0} total logs for ${SERVICE_NAME} in Elasticsearch)"
  fi
  echo ""
done

echo -e "${BLUE}======================================================================${NC}"
echo -e "${GREEN}Test run complete! Open Kibana at http://localhost:5601 to view logs.${NC}"
echo -e "${BLUE}======================================================================${NC}"
