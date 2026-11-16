# Verification record — 16 November 2026

| Check | Actual result |
| --- | --- |
| PostgreSQL migration, seed and schema dump | Successful |
| RSpec request/concurrency suite | **12 examples, 0 failures** |
| Rails eager loading | Passed |
| Frontend formatting and TypeScript/Vite build | Passed |
| Playwright Chromium integration suite | **3 tests passed** |
| Desktop/mobile screenshots | Captured from the real application |
| 390px horizontal overflow | None observed |
| Browser capture page errors | None observed |
| Compose configuration parsing | Passed |

Request tests cover authentication/logout/expiry, server-owned balance/SKU normalization, inbound/outbound operations, negative stock rejection, replayed/conflicting keys, invalid quantities/references, workspace isolation, role restrictions, exact valuation, reorder thresholds, pagination/search and safe CSV export.

The concurrency test uses separate database connections and two threads withdrawing four units each from a five-unit balance. It verifies exactly one success, one rejection, four withdrawn units and a final balance of one. This group runs without transactional fixtures and explicitly cleans its own persisted records.

Browser tests exercise supplier/product creation, inbound stock, rejected excessive withdrawal, successful withdrawal, updated low-stock status, detailed history and CSV download. Operator/viewer restrictions, mobile width and logout are also checked.

The full Dockerfile/Compose build, public application deployment, penetration tests, physical-device checks and sustained load testing were not performed. The executed runtime used Rails/PostgreSQL containers plus host Vite. GitHub-hosted CI is only passing after its remote run actually completes. Ruby 3.3 emitted a notice about csv becoming an explicit dependency in Ruby 3.4; Ruby 3.3 is the declared runtime.
