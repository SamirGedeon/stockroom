# Research — 16 November 2026

Stockroom adds a different invariant to the portfolio: inventory cannot go negative, even with concurrent requests or transport retries. A catalog alone would not demonstrate that behavior; its transactional service and tests are the core.

## Job evidence

[Shopra's primary junior full-stack page](https://jobs.polymer.co/shopra/38374) was accessible with an application link. It lists Rails API, React/TypeScript, PostgreSQL, RSpec and Docker, with Canada preferred and 1–3 years requested. Those requirements support a project with real API/data/testing work; they do not guarantee eligibility or hiring.

The previously used [Sylision Rails Júnior URL](https://www.sylision.com/vagas/desenvolvedor-rails-junior-401) returned HTTP 410 on this research attempt, so it is not presented as a current vacancy. Aggregator search results were discovery context rather than independently verified openings. No application was submitted.

## Product and community checks

[InvenTree's official documentation](https://docs.inventree.org/en/latest/) describes stock, supplier management and tracking. It provides product context for inventory workflows; Stockroom does not claim its manufacturing, barcode or purchasing scope. ERPNext provides a contrasting full-ERP scope.

| Platform/source | URL checked | Observation |
| --- | --- | --- |
| inventree | [inventree](https://github.com/inventree/InvenTree) | 7,868 stars, 1,621 forks |
| erpnext | [erpnext](https://github.com/frappe/erpnext) | 41,350 stars, 13,531 forks |
| gitlab | [gitlab](https://gitlab.com/api/v4/projects?search=inventory&simple=true&per_page=2) | accessible |
| hn | [hn](https://hn.algolia.com/api/v1/search?query=inventory%20management&tags=story&hitsPerPage=2) | accessible |
| devto | [devto](https://dev.to/api/articles?tag=rails&per_page=2) | accessible |
| stackoverflow | [stackoverflow](https://api.stackexchange.com/2.3/tags?order=desc&sort=popular&inname=ruby-on-rails&site=stackoverflow) | accessible |
| producthunt | [producthunt](https://www.producthunt.com/products/inventree) | accessible |
| reddit | [reddit](https://www.reddit.com/r/selfhosted/search.json?q=inventory&restrict_sr=on&limit=2) | HTTP Error 403: Forbidden |

GitHub counts are snapshots of attention, not code quality or hiring value. Product Hunt was inspected for positioning, without unverified vote/rank claims. GitLab examples and community feeds were reference discovery; no code quality audit is implied. Hacker News relevance searches can return old stories. Stack Overflow tag volume is historical, not hiring demand. Reddit's direct endpoint was unavailable (403), so no conclusions were inferred from it.

## Scope comparison

| Candidate | Demonstrable value | Relative complexity | Decision |
| --- | --- | --- | --- |
| Inventory workspace | Locks, idempotency, stock ledger, roles and reports | Medium/high | Choose |
| Full ERP | Purchasing/accounting/integration breadth | Very high | Defer |
| Barcode/lot warehouse | Devices, expiry, location/lot modeling | High | Defer |

This is a small qualitative sample, not a statistical market study. The design is a separate implementation with a bounded domain, not a copy of InvenTree or ERPNext. Synchronous operations do not need unused job/Redis dependencies.
