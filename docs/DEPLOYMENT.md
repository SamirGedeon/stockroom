# Deployment preparation

Public source repository: https://github.com/SamirGedeon/stockroom

Compose is for local development. Public hosting needs a Rails-capable host, PostgreSQL and an HTTPS reverse proxy. Build React with `npm ci && npm run build`, serve frontend/dist with SPA fallback for /inventory/*, /activity and /suppliers, and route /api/* to Rails. Do not expose Vite as production hosting.

Set RAILS_ENV=production, DATABASE_URL, SECRET_KEY_BASE, APP_HOST and FRONTEND_ORIGIN using protected runtime settings. Generate a secret using `bundle exec rails secret`. Keep FORCE_SSL=true behind correctly configured TLS termination. Run `bundle exec rails db:migrate` as a release step.

Bootstrap an owner with protected WORKSPACE_NAME, OWNER_NAME, OWNER_EMAIL and OWNER_PASSWORD, then run `bundle exec rails workspace:bootstrap`. Demo seeds refuse production execution. Operator/viewer provisioning currently requires a trusted administrator; no invitation UI is claimed.

Before real use configure backups/restore verification, monitoring, retention and shared login throttling if running multiple API instances. Apply a restrictive frontend CSP and protect bearer tokens against XSS. No security audit, operational SLA or production load claim is made.

Dockerfiles accept an optional BuildKit proxy_ca secret for enterprise/cloud CA bundles. Certificate verification stays enabled. Standard local builds do not need this option. The managed executor ran Rails/PostgreSQL containers and host Vite separately; delivered full Dockerfile/Compose builds were not exercised end-to-end because disk is constrained. Compose syntax was validated.

No paid resources or hosted application deployment were created.
