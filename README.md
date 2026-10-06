# 🏥 MedTrust Platform

**A Compliance-First, Event-Driven Healthcare SaaS Architecture**

MedTrust Platform is a production-grade healthcare microservices system built around **Domain-Driven Design (DDD)**, **HIPAA-aligned compliance**, and **event-driven reliability**. It is an architectural reference for enterprise healthcare systems — not a CRUD demo.

---

## 🎯 Vision

Healthcare systems must balance security, compliance, scalability, interoperability, and developer velocity. MedTrust models how to achieve that balance using:

- Microservices with strict bounded contexts
- Event-driven architecture via Apache Kafka
- Schema governance with Schema Registry
- Domain-driven data ownership

---

## 🧠 Core Architectural Principles

| Principle | Implementation |
|---|---|
| **Bounded Contexts (DDD)** | Each service owns its domain logic and data |
| **Single DB, schema-per-service** | One PostgreSQL 18 instance, isolated schemas |
| **Zero cross-schema joins** | Services communicate via Kafka events / REST |
| **PHI isolation** | Consent-gated access enforced per service |
| **Immutable audit logging** | Append-only Kafka pipeline, 7+ year retention |
| **Exactly-once processing** | Idempotent Kafka consumers in audit-service |
| **Backward-compatible events** | Avro schemas + Schema Registry governance |
| **Resilience** | Resilience4j circuit breakers, retries, bulkheads |

---

## 🏗 Service Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                       MedTrust Platform                      │
│                                                              │
│  auth-service      :8083    patient-service    :8081         │
│  clinical-service  :8080    appointment-service :8082        │
│  consent-service   :8084    audit-service       :8085        │
│  notification-service :8086  integration-service :8087       │
│                        (HL7 FHIR R4)                         │
│                                                              │
│  Frontend  (Next.js 16 + React 19)           :3000           │
└──────────────────────────────────────────────────────────────┘
             ↕ Kafka Events     ↕ REST (Resilience4j)
┌──────────────────────────────────────────────────────────────┐
│  PostgreSQL 18 — medtrust DB (schema-per-service)            │
│  auth / appointment / clinical / patient                     │
│  consent / audit / notification / integration                │
├────────────────────┬─────────────────────────────────────────┤
│  MongoDB           │  RabbitMQ (SMS / Email commands)        │
└────────────────────┴─────────────────────────────────────────┘
```

Each service:
- Owns its own PostgreSQL **schema** inside the shared `medtrust` database
- Publishes domain events to Kafka after aggregate changes
- Enforces authorization locally (RBAC + ABAC)
- Emits structured audit events to the audit pipeline

---

## 📦 Technology Stack

### Backend
| Layer | Technology |
|---|---|
| Language | Java 21 |
| Framework | Spring Boot 3.4 |
| Database | PostgreSQL 18 (single DB, schema-per-service) |
| Migrations | Flyway (per-schema isolation) |
| Unstructured data | MongoDB |
| ORM | JPA / Hibernate |

### Messaging
| Component | Technology |
|---|---|
| Event streaming | Apache Kafka (KRaft — no Zookeeper) |
| Schema governance | Confluent Schema Registry (Avro) |
| Command messaging | RabbitMQ |
| Reliability | Transactional Outbox pattern |

### Security
| Feature | Implementation |
|---|---|
| Authentication | OAuth2 / OIDC + JWT |
| MFA | TOTP / SMS |
| Authorization | RBAC + ABAC |
| PHI protection | Field-level encryption |
| Consent control | Consent-gated data access |

### Frontend
| Technology | Version |
|---|---|
| Next.js | 16.x |
| React | 19.x |

### Observability & Logging (ELK Stack)
| Component | Technology | Purpose |
|---|---|---|
| Log Ingestion & PHI Redaction | Logstash 8.x (Port 5000) | Ingests JSON logs, masks SSNs & credentials |
| Search & Storage | Elasticsearch 8.x (Port 9200) | Stores partitioned time-series logs |
| Visualization & Exploration | Kibana 8.x (Port 5601) | Real-time log discovery & operational dashboards |
| Distributed Tracing | MDC + `X-Trace-Id` Filter | Correlates requests end-to-end across services |

> 📖 **Full Testing & Reference Guide:** [infrastructure/ELK.md](infrastructure/ELK.md)

---

## 🗂 Database Architecture

All services share **one PostgreSQL 18 database** (`medtrust`) with isolated schemas:

```
medtrust (database)
├── auth          → users, roles, tokens, refresh_tokens
├── appointment   → appointments, schedules, slots
├── clinical      → encounters, notes, clinical_data
├── patient       → patients, demographics
├── consent       → consents, consent_history
├── audit         → audit_events (append-only)
├── notification  → notification_log, templates
└── integration   → fhir_mappings, external_connections
```

> Each service's Flyway migrations run only in its own schema.
> Services never read from each other's schema — cross-domain data flows via Kafka events.

---

## 🚀 Local Development Setup

### Prerequisites

- Java 21+
- Maven 3.9+
- PostgreSQL 18 (local install or Docker)
- Docker + Docker Compose
- Node.js 20+ (for frontend)

---

### Option A: Docker Compose (Recommended)

Starts PostgreSQL 18 + RabbitMQ and creates all schemas automatically:

```bash
cd infrastructure
docker-compose up -d
```

Then start any service:

```bash
cd services/auth-service
./mvnw spring-boot:run
```

---

### Option B: Bare-Metal PostgreSQL 18

**Step 1 — Create the database and user:**

```bash
sudo -u postgres psql -c "CREATE USER medtrust WITH PASSWORD 'changeme';"
sudo -u postgres psql -c "CREATE DATABASE medtrust OWNER medtrust;"
```

**Step 2 — Create all schemas:**

```bash
psql -U postgres -d medtrust -c "
CREATE SCHEMA IF NOT EXISTS auth         AUTHORIZATION medtrust;
CREATE SCHEMA IF NOT EXISTS appointment  AUTHORIZATION medtrust;
CREATE SCHEMA IF NOT EXISTS clinical     AUTHORIZATION medtrust;
CREATE SCHEMA IF NOT EXISTS patient      AUTHORIZATION medtrust;
CREATE SCHEMA IF NOT EXISTS consent      AUTHORIZATION medtrust;
CREATE SCHEMA IF NOT EXISTS audit        AUTHORIZATION medtrust;
CREATE SCHEMA IF NOT EXISTS notification AUTHORIZATION medtrust;
CREATE SCHEMA IF NOT EXISTS integration  AUTHORIZATION medtrust;
"
```

**Step 3 — Start a service (Flyway auto-creates tables on startup):**

```bash
cd services/auth-service
./mvnw spring-boot:run
```

**Default DB credentials (override via env vars):**

| Variable | Default |
|---|---|
| `DB_HOST` | `localhost` |
| `DB_PORT` | `5432` |
| `DB_DATABASE` | `medtrust` |
| `DB_USERNAME` | `medtrust` |
| `DB_PASSWORD` | `changeme` |

---

### Frontend

```bash
cd frontend
yarn install
yarn dev
# Runs on http://localhost:3000
```

---

## 🐳 Kubernetes (Kind) Deployment

```bash
# Create Kind cluster, build images, deploy all infra + services
./infrastructure/k8s/deploy.sh

# Deploy a single service via Helm
helm upgrade --install auth-service services/auth-service/helm \
  --namespace medtrust \
  -f services/auth-service/helm/values-dev.yaml

# View service logs
kubectl logs -l app=auth-service -n medtrust

# Port-forward a service locally
kubectl port-forward svc/auth-service 8083:8083 -n medtrust

# Restart a deployment after image update
kubectl rollout restart deployment/auth-service -n medtrust
```

---

## 📁 Project Structure

```
medtrust-application/
├── frontend/                         # Next.js 16 + React 19 frontend
├── services/
│   ├── auth-service/           :8083
│   ├── patient-service/        :8081
│   ├── clinical-service/       :8080
│   ├── appointment-service/    :8082
│   ├── consent-service/        :8084
│   ├── audit-service/          :8085
│   ├── notification-service/   :8086
│   └── integration-service/    :8087  (HL7 FHIR R4)
│
│   Each service (hexagonal architecture):
│   └── src/main/java/com/medtrust/{service}/
│       ├── domain/             # Aggregates, events, repository interfaces
│       ├── application/        # Services, use cases, DTOs
│       ├── infrastructure/     # JPA adapters, Kafka, RabbitMQ, configs
│       └── interfaces/         # REST controllers, exception handlers
│
├── infrastructure/
│   ├── docker-compose.yml      # Local: PostgreSQL 18 + RabbitMQ
│   ├── postgres/init.sql       # Schema bootstrap (runs on first start)
│   └── k8s/
│       ├── postgres.yaml
│       ├── kafka.yaml
│       ├── rabbitmq.yaml
│       ├── deploy.sh
│       └── environments/
│           ├── dev/
│           └── qa/
└── docs/
```

---

## 📡 Key Kafka Topics

| Topic | Producer | Consumers |
|---|---|---|
| `appointment-events` | appointment-service | audit-service, notification-service |
| `patient-events` | patient-service | audit-service, clinical-service |
| `auth-events` | auth-service | audit-service |
| `consent-events` | consent-service | audit-service, clinical-service |
| `clinical-events` | clinical-service | audit-service, notification-service |

---

## 🏥 Actuator Health Endpoints

```bash
curl http://localhost:8080/actuator/health  # clinical-service
curl http://localhost:8081/actuator/health  # patient-service
curl http://localhost:8082/actuator/health  # appointment-service
curl http://localhost:8083/actuator/health  # auth-service
curl http://localhost:8084/actuator/health  # consent-service
curl http://localhost:8085/actuator/health  # audit-service
curl http://localhost:8086/actuator/health  # notification-service
curl http://localhost:8087/actuator/health  # integration-service
```

---

## ⚠ Disclaimer

This project is an architectural reference implementation and does not claim official HIPAA certification. It demonstrates design patterns aligned with regulated healthcare environments.

---

## 📚 Reference Architecture

Architecture diagram: [MedTrust on Eraser.io](https://app.eraser.io/workspace/VTZheV8xM7qjRelo6Z3p?origin=share&diagram=EhrjSvwdNRWqhqXTW7nf-)
