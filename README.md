# Stockroom

**Every item in its place. Every movement accounted for.** An inventory workspace for small operations, built with a Rails API, React/TypeScript and PostgreSQL.

![Stockroom inventory](docs/screenshots/inventory-desktop.png)

## Features

- Product catalog with unique SKU, supplier, location, minimum stock and integer-cent unit cost.
- Inventory dashboard: product count, available units, low-stock items, estimated stock value and 30-day movement totals.
- Inbound/outbound movements with actor, reference and resulting balance recorded in history.
- Transactional stock updates that reject negative balances and serialize concurrent withdrawals.
- Idempotency keys: retrying the same request does not move stock twice; reusing a key with different data is rejected.
- Replenishment queue, name/SKU search, balance/supplier filters and server-side pagination.
- Supplier directory and per-product movement history.
- Filtered inventory CSV export with formula-like text neutralized for spreadsheets.
- Owner/operator/viewer roles, workspace isolation and expiring, revocable login sessions.
- Responsive Portuguese interface, loading/error/empty states and keyboard-friendly dialogs.

All demo inventory, suppliers and movements are fictional. This application does not place purchase orders, execute payments or connect to an ERP.

## Preview

| Desktop | Mobile |
| --- | --- |
| ![Inventory](docs/screenshots/inventory-desktop.png) | ![Mobile inventory](docs/screenshots/inventory-mobile.png) |

## Run locally with Docker

Requirements: Docker Engine/Desktop and Compose.

```sh
git clone https://github.com/SamirGedeon/stockroom.git
cd stockroom
cp .env.example .env
docker compose up --build
```

Open **http://localhost:5176**. API process health: **http://localhost:3003/up**.

| Demo account | Password | Access |
| --- | --- | --- |
| owner@stockroom.test | Stockroom-demo-2026! | Create catalog/suppliers and move stock |
| operator@stockroom.test | Stockroom-demo-2026! | Read catalog and move stock |
| viewer@stockroom.test | Stockroom-demo-2026! | Read/export only |

The local login offers demo autofill. Seeds are idempotent for their fixed movement keys and are disabled in production. DEMO_PASSWORD applies to newly created demo users only.

Compose is a development stack with fictional seeds, Vite and loopback-bound ports. Its named PostgreSQL volume persists between restarts. `docker compose down` stops services without deleting that volume.

## Native setup

Install Ruby 3.3, PostgreSQL 16, Node 22.12+ and npm. Native gems may require a C compiler, libpq/libyaml headers and pkg-config. Provision a local PostgreSQL user that can create development/test databases.

```sh
export DATABASE_URL=postgres://stockroom:stockroom@localhost:5432/stockroom_development
export TEST_DATABASE_URL=postgres://stockroom:stockroom@localhost:5432/stockroom_test
cd backend
bundle install
bundle exec rails db:prepare db:seed
bundle exec rails server -p 3003
```

In another terminal, from the project root:

```sh
cd frontend
npm ci
npm run dev
```

Vite proxies /api to localhost:3003. Override API_PROXY_TARGET for a different backend address. PostgreSQL stores all products/movements; sessionStorage contains only the browser session credential.

## Stock integrity

Products start at zero. Add units with an inbound movement; remove them with an outbound movement. There is no API for directly editing the stored balance or modifying/deleting a recorded movement. Corrections are additional movements with a clear reference.

A product row lock serializes stock changes. The service reads the current balance, validates the result and saves both product balance and movement in one database transaction. PostgreSQL checks additionally enforce a nonnegative bounded balance. A concurrency test runs two simultaneous withdrawals against five units: one withdrawal of four succeeds, one is rejected, and the remaining balance is one.

Movement requests require an **Idempotency-Key** header:

```http
POST /api/products/1/movements
Idempotency-Key: receipt-2026-0001
Content-Type: application/json
Authorization: Bearer SESSION_TOKEN

{"movement":{"kind":"in","quantity":10,"reference":"Receipt 0001"}}
```

The first request returns 201 with replayed=false. Repeating the same product/direction/quantity/reference and key returns 200 with the original movement and replayed=true. The same key with different data returns 409. The key is unique across the workspace, not just within one product. Keys contain 8–100 ASCII letters/digits or `. _ : -`, starting with a letter/digit.

The browser preserves a key when retrying unchanged input and creates a new one when the form input changes. A new movement form intentionally represents a new operation; this is transport-retry protection, not detection of every semantically similar business transaction.

## Limits and definitions

- Maximum 1,000 products per workspace, 1,000,000 units per product and R$ 10,000.00 per unit cost.
- Quantities are whole units only. Costs are integer BRL cents. Valuation is current quantity × registered unit cost; it is not FIFO, weighted-average costing or an accounting certification.
- A product needs replenishment when balance is **at or below** its minimum. Empty products are included, even with a minimum of zero.
- Search/balance/supplier filters affect the table and export. Summary cards always describe the full workspace.
- Lists use 20 records per page. A product detail returns its latest 50 movements. The global movement page can filter by direction and supports a product_id API filter.
- Thirty-day totals count quantities of recorded movements, not sales revenue or calendar-month financial performance.

## Tests

Backend:

```sh
cd backend
RAILS_ENV=test bundle exec rails db:prepare
bundle exec rspec
bundle exec rails zeitwerk:check
```

With Compose: `docker compose exec -e RAILS_ENV=test api bundle exec rails db:prepare`, then `docker compose exec api bundle exec rspec`.

Frontend:

```sh
cd frontend
npm ci
npm run format:check
npm run build
npx playwright install chromium
npm run test:e2e
```

Browser tests require the development API and seeded demo accounts. They create unique fictional catalog/movement data in the development database; use a dedicated local/CI instance. Playwright starts Vite when needed.

[Verification record](docs/VERIFICATION.md) distinguishes executed checks from deployment preparation. GitHub Actions runs backend tests, formatting/build and browser integration tests.

## Documentation

[Architecture](docs/ARCHITECTURE.md) · [OpenAPI specification](docs/openapi.json) · [Research](docs/RESEARCH.md) · [Deployment preparation](docs/DEPLOYMENT.md).

## Stack

Ruby 3.3, Rails 7.2, Active Record, PostgreSQL 16, RSpec, React 19, TypeScript, Vite, Tailwind CSS 4/custom CSS, React Router, TanStack Query, Luxon, Lucide, Playwright, Docker and GitHub Actions.

## Scope

Multiwarehouse transfers, reservations, lot/serial tracking, expiry dates, barcode scanning, purchasing, supplier messaging, catalog editing/deletion, user invitation/password-reset UI and ERP integrations are not implemented. Low-stock alerts are visible indicators, not outbound notifications. No Redis/Sidekiq is needed for synchronous stock operations. Operators/viewers are provisioned by a trusted administrator; local examples come from seeds.

There is no public application deployment yet. Production needs TLS, backups, monitoring and protected runtime settings.

MIT license.
