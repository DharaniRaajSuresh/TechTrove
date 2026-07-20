# TechTrove Rental Tracker

A full-stack rental management system built with **Spring Boot 3.4**, **Java 24**, and **React** (vanilla JS frontend). Track customers, items, rentals, and payments with automated overdue detection and payment reminders.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Spring Boot 3.4, Spring Data JPA, Spring Security |
| Auth | JWT (JSON Web Tokens) with BCrypt password hashing |
| Database | PostgreSQL (prod) / H2 (dev) with Flyway migrations |
| API | RESTful CRUD, Swagger/OpenAPI 3.1 |
| Frontend | Vanilla JavaScript, PWA with Service Worker |
| DevOps | Docker, Docker Compose, GitHub Actions CI/CD |
| Build | Maven, MapStruct, Lombok |

## Features

- **Customer Management** — CRUD operations with duplicate detection
- **Item Inventory** — Track laptops, tablets, and other rental items by serial number
- **Rental Lifecycle** — Start, end, and extend rentals with multiple billing cycles (weekly, monthly, custom)
- **Payment Tracking** — Record partial/full payments with multiple methods (GPay, Cash, UPI, Card)
- **Automated Status** — Server-computed overdue detection, due-soon alerts, and outstanding balance
- **Dashboard** — Real-time metrics: active rentals, monthly collected, outstanding total, overdue list
- **Bulk Import** — CSV and Excel import with smart column mapping
- **Offline Support** — Service worker caches static assets for offline use
- **Notifications** — Browser push notifications for payment reminders
- **Audit Logging** — Full audit trail of all CRUD operations
- **API Documentation** — Interactive Swagger UI at `/swagger-ui/index.html`

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌────────────┐
│  Frontend   │────▶│  Controller  │────▶│  Service   │
│ (static/)   │     │  (REST API)  │     │ (Business) │
└─────────────┘     └──────────────┘     └─────┬──────┘
                                               │
                                        ┌──────▼──────┐
                                        │  Repository │
                                        │  (JPA/Data) │
                                        └──────┬──────┘
                                               │
                                        ┌──────▼──────┐
                                        │  PostgreSQL  │
                                        │   (or H2)   │
                                        └─────────────┘
```

### Key Design Decisions

- **MapStruct** for DTO mapping — eliminates boilerplate `toDto()`/`toEntity()` methods
- **Flyway** for database migrations — version-controlled schema changes
- **JWT** stateless auth — no session storage, suitable for horizontal scaling
- **BigDecimal** for all monetary values — no floating-point rounding errors
- **Batch query optimization** — N+1 query problem eliminated via `findByRentalIdIn`
- **Audit logging** — all create/update/delete operations recorded with timestamps

## Quick Start

### Prerequisites

- Java 24+
- Maven 3.9+
- Docker (optional, for PostgreSQL)

### Run with H2 (Development)

```bash
mvn spring-boot:run
```

App starts at `http://localhost:8080`. Login password: `rent123`

### Run with PostgreSQL (Production)

```bash
docker compose up
```

App starts at `http://localhost:8080`. Override password via `APP_PASSWORD` env variable.

### API Documentation

Once running, visit:
- Swagger UI: [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)
- API Docs: [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)

## API Overview

### Authentication

```bash
# Login — get JWT token
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"rent123"}'

# Use token for subsequent requests
curl http://localhost:8080/api/customers \
  -H "Authorization: Bearer <token>"
```

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customers` | List customers |
| POST | `/api/customers` | Create customer |
| GET | `/api/items` | List items |
| POST | `/api/items` | Create item |
| GET | `/api/rentals` | List rentals |
| POST | `/api/rentals` | Create rental |
| GET | `/api/rentals/{id}/status` | Compute rental status |
| GET | `/api/payments?rentalId=` | List payments (filter by rental) |
| POST | `/api/payments` | Record payment |
| GET | `/api/dashboard` | Aggregated metrics |
| GET | `/api/data` | Export all data (monolithic backup) |

## Testing

```bash
mvn test
```

Tests cover:
- **RentalService** — cycle day calculation, overdue detection, due-soon detection, edge cases (zero rent, boundary dates, overpayment)
- **AuthService** — password validation
- **DataService** — save/load round-trip, overwrite semantics

## Project Structure

```
src/main/java/com/techtrove/rental/
├── config/          # Security, JWT, CORS, error handling
├── controller/      # REST controllers
├── dto/             # Data Transfer Objects
├── mapper/          # MapStruct mappers
├── model/           # JPA entities
│   └── enums/       # BillingCycle, ItemStatus, RentalStatus
├── repository/      # JPA repositories
└── service/         # Business logic

src/main/resources/
├── db/migration/    # Flyway migrations
├── static/          # Frontend (SPA)
└── application.yml  # Configuration

src/test/java/       # JUnit 5 tests
```

## CI/CD

This project uses GitHub Actions for continuous integration. Every push triggers:
- `mvn verify` — compile, test, and package
- Dependency vulnerability check

## Roadmap

- [ ] OAuth2 social login
- [ ] Email notifications for due reminders
- [ ] Role-based access control (admin, staff, viewer)
- [ ] Reporting module (PDF export, monthly summaries)
- [ ] Mobile app (React Native or Flutter)

## License

MIT
