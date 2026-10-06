# 📊 MedTrust — ELK Stack Reference & Testing Guide

This document contains everything needed to run, test, and query the **ELK Stack (Elasticsearch 8, Logstash 8, Kibana 8)** integrated into the MedTrust platform.

---

## 📌 1. Service Endpoints & Ports

| Component | Port | URL / Host | Description |
|---|---|---|---|
| **Kibana Web UI** | `5601` | [http://localhost:5601](http://localhost:5601) | Interactive dashboard & log explorer |
| **Elasticsearch API** | `9200` | [http://localhost:9200](http://localhost:9200) | Search & indexing REST engine |
| **Logstash Ingestion** | `5000` | `localhost:5000` (TCP/UDP) | Asynchronous JSON log pipeline |

---

## 🚀 2. Starting & Stopping ELK

Run from the `infrastructure/` directory:

```bash
# Start ELK in the background:
cd infrastructure
docker-compose up -d elasticsearch logstash kibana

# View container status:
docker ps --filter "name=medtrust"

# View Logstash logs:
docker logs -f medtrust-logstash

# Stop ELK containers:
docker-compose stop elasticsearch logstash kibana
```

---

## ⚡ 3. Automated Test Suite (One Command)

We have created an automated test script that pings each microservice with a unique `X-Trace-Id` and verifies that Elasticsearch immediately indexed the logs:

```bash
# Run from repository root:
./infrastructure/test-elk-services.sh
```

**Expected output:**
```text
Testing clinical-service (Port 8080)...
  ↳ Service Status: ONLINE (HTTP 200) with Trace ID: trace-clinical-service-xxxxx
  ↳ ELK Pipeline:   SUCCESS (Found log documents in Elasticsearch!)

Testing patient-service (Port 8081)...
  ↳ Service Status: ONLINE (HTTP 200) with Trace ID: trace-patient-service-xxxxx
  ↳ ELK Pipeline:   SUCCESS (Found log documents in Elasticsearch!)
...
```

---

## 🧪 4. Manual Testing per Microservice

Each service has a `TraceIdFilter` that intercepts the `X-Trace-Id` HTTP header, injects it into SLF4J `MDC`, and logs it over TCP to Logstash.

### 4.1 Test Commands by Service

| Service | Port | Test Command | Kibana Query |
|---|---|---|---|
| **clinical-service** | `8080` | `curl -i -H "X-Trace-Id: test-clinical-001" http://localhost:8080/actuator/health` | `traceId : "test-clinical-001"` |
| **patient-service** | `8081` | `curl -i -H "X-Trace-Id: test-patient-001" http://localhost:8081/api/patients` | `traceId : "test-patient-001"` |
| **appointment-service** | `8082` | `curl -i -H "X-Trace-Id: test-appointment-001" http://localhost:8082/actuator/health` | `traceId : "test-appointment-001"` |
| **auth-service** | `8083` | `curl -i -H "X-Trace-Id: test-auth-001" http://localhost:8083/actuator/health` | `traceId : "test-auth-001"` |
| **consent-service** | `8084` | `curl -i -H "X-Trace-Id: test-consent-001" http://localhost:8084/actuator/health` | `traceId : "test-consent-001"` |
| **audit-service** | `8085` | `curl -i -H "X-Trace-Id: test-audit-001" http://localhost:8085/actuator/health` | `traceId : "test-audit-001"` |
| **notification-service** | `8086` | `curl -i -H "X-Trace-Id: test-notify-001" http://localhost:8086/actuator/health` | `traceId : "test-notify-001"` |
| **integration-service** | `8087` | `curl -i -H "X-Trace-Id: test-integration-001" http://localhost:8087/actuator/health` | `traceId : "test-integration-001"` |

---

## 🔒 5. Testing HIPAA PHI Redaction

Logstash includes an automatic filter ([`infrastructure/logstash/logstash.conf`](file:///home/shrikar/2026-Dev/medtrust-application/infrastructure/logstash/logstash.conf)) to mask SSNs, passwords, and tokens before indexing into Elasticsearch.

### Send Test Payload with Sensitive Data:
```bash
echo '{"service":"security-test","level":"INFO","traceId":"trace-hipaa-test","message":"Patient SSN 123-45-6789 verified with token=secretToken123"}' | nc -w 3 localhost 5000
```

### Verify Redaction in Elasticsearch:
```bash
curl -s "http://localhost:9200/medtrust-logs-*/_search?q=traceId:trace-hipaa-test&pretty"
```

**Result:**
```json
{
  "service": "security-test",
  "traceId": "trace-hipaa-test",
  "message": "Patient SSN XXX-XX-XXXX verified with token=***REDACTED***"
}
```

---

## 🔍 6. How to Query Logs in Kibana

1. Open **[http://localhost:5601](http://localhost:5601)** in your browser.
2. Go to **Analytics > Discover**.
3. Select Data View: **`medtrust-logs-*`** (*MedTrust Microservices Logs*).

### Useful KQL (Kibana Query Language) Searches:

- **Filter by a specific service:**
  ```kuery
  service : "patient-service"
  ```
- **Filter by log level:**
  ```kuery
  level : "ERROR"
  ```
- **Search across specific services with debug level:**
  ```kuery
  (service : "auth-service" or service : "clinical-service") and level : "DEBUG"
  ```
- **Track a single distributed transaction by Trace ID:**
  ```kuery
  traceId : "your-trace-id-uuid"
  ```
- **View SQL database queries:**
  ```kuery
  logger_name : "org.hibernate.SQL"
  ```

---

## 💻 7. Useful Direct Elasticsearch API Commands

```bash
# 1. Cluster Health (status should be yellow or green)
curl -s http://localhost:9200/_cluster/health | jq .

# 2. View all indices and document counts
curl -s "http://localhost:9200/_cat/indices?v"

# 3. Aggregate log counts by microservice
curl -s "http://localhost:9200/medtrust-logs-*/_search?size=0" -H 'Content-Type: application/json' -d '{
  "aggs": {
    "by_service": {
      "terms": { "field": "service.keyword" }
    }
  }
}' | jq .aggregations.by_service.buckets

# 4. View latest 5 logs
curl -s "http://localhost:9200/medtrust-logs-*/_search?pretty&size=5&sort=@timestamp:desc"
```

---

## 🛠 8. How the Architecture Works

1. **Spring Boot App**: Uses `logstash-logback-encoder` to format logs into structured JSON.
2. **`TraceIdFilter`**: Extracts or generates `X-Trace-Id` on incoming requests and stores it in SLF4J `MDC`.
3. **`AsyncAppender`**: Ships logs over a non-blocking TCP socket to `localhost:5000` with zero delay to application business logic.
4. **Logstash**: Listens on port `5000`, applies regex masking to sensitive PHI, and bulk-indexes into Elasticsearch.
5. **Elasticsearch**: Partitions indices daily under `medtrust-logs-YYYY.MM.dd`.
6. **Kibana**: Reads indices from Elasticsearch and provides visualization, dashboards, and live log discovery.
