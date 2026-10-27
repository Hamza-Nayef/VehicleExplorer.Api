# Decisions

## Key design decisions

**1. A backend that proxies NHTSA, instead of the browser calling it directly.**
The UI talks to our own small API, which calls vPIC. That gives us a stable contract (`{ id, name }` instead of `Make_ID`/`Model_Name`), a place to cache and validate, one place to handle upstream failures, and the freedom to swap the data source without touching the UI.

**2. Minimal API + a typed `HttpClient`, with no extra NuGet packages.**
The surface is three read-only endpoints, so controllers would be ceremony. Keeping dependencies at zero also means nothing to go stale. The code is split into endpoints (HTTP concerns), a service (NHTSA + caching) and DTOs, behind an `IVehicleService` interface so it can be faked in tests.

**3. In-memory caching with different lifetimes.**
Makes (about 10k rows, rarely change) are cached 24h; vehicle types and models 1h. Failures are never cached. This keeps the UI fast and is polite to a free public API.

**4. One container serves both the API and the built React app.**
Same origin means no CORS configuration, and there is one thing to deploy on one free-tier instance. In local development Vite runs separately and proxies `/api`, so the frontend code is identical in both modes.

**5. React + TypeScript + Vite, with no state-management or data-fetching library.**
There are three dependent requests, so a ~40-line `useApi` hook is enough. It aborts superseded requests (so a slow answer for an old selection can't overwrite a newer one) and supports retry.

**6. A hand-written searchable combobox for the make.**
A native `<select>` with ~10k options is unusable. Search ranks "starts with" ahead of "contains", is capped at 50 results, and supports keyboard navigation and ARIA roles.

**7. .NET 10 (LTS).**
.NET 8 reaches end of support in November 2026, so a new project should start on the current LTS.

**8. AWS: a single EC2 instance running the Docker image.**
Chosen over Elastic Beanstalk, App Runner or ECS because it fits the Free Tier most predictably and has the fewest moving parts to explain. See trade-offs below.

## Assumptions

- NHTSA's makes list is used **as is**. It includes many non-car manufacturers (trailers, buses, motorcycles), and I did not try to filter it down to "cars".
- Vehicle types are **per make, not per year** (the vPIC endpoint takes no year), so the type chips don't change when the year changes.
- The type filter passes NHTSA's type **name** (e.g. `Passenger Car`) to the `vehicletype` path segment of the models endpoint. I'm assuming vPIC matches on that name. *Verify against live data; some type names are long or contain parentheses.*
- UI offers years 1980 to next year; the API accepts 1950 to next year.
- Names are trimmed, de-duplicated and sorted case-insensitively.

## Trade-offs

- **In-memory cache** is per-process and cleared on restart. Fine for one instance; it would need Redis or similar to scale out.
- **No retries/circuit breaker** on NHTSA calls. There is a 15s timeout and a clean `502`, and the UI has a Retry button, but nothing smarter.
- **Single EC2 instance:** no autoscaling or redundancy, and it is **HTTP only** (no TLS), with manual deploys.
- **Combobox is not fully polished:** the active option doesn't scroll into view when navigating long lists by keyboard.
- **Test coverage is thin:** only the make-search logic has unit tests so far.

## Next steps

1. Backend tests: xUnit + `WebApplicationFactory`, with a fake `HttpMessageHandler` returning recorded vPIC payloads (including empty and malformed responses).
2. GitHub Actions CI: lint, test, build the Docker image.
3. HTTPS and a real domain (CloudFront or a load balancer + ACM certificate).
4. Resilience: `Microsoft.Extensions.Http.Resilience` for retry with backoff and a circuit breaker.
5. Component tests (Testing Library) and one Playwright happy-path test.
6. UX: surface popular makes first, show model counts per type, deep-linkable URL state (`?make=474&year=2015`).
7. Infrastructure as code (Terraform/CDK) instead of console clicks.

## How I used AI

I used **Claude (Anthropic)** in an agentic coding session to scaffold the solution: the .NET API, the React app, the Dockerfile, and first drafts of the README and this file. I specified the requirements and constraints; the AI proposed the structure and wrote the code.

**Limits of that session you should know about:** the AI's sandbox had no .NET SDK, no Docker daemon, and no network access to NHTSA. So the React side was linted, unit tested and built there, but the **backend and Docker image were written without being compiled or run**, and the vPIC calls were not exercised against the live API.

> **TODO (author to complete before submitting):** what I reviewed and changed by hand, and what I found on first running the backend/Docker image against the real NHTSA API.

**One thing the AI got wrong that I fixed:**

> **TODO (author):** replace this with the most meaningful issue you find when you run the app, as it will make for a better interview story.
>
> A real example from the build session, for reference: while editing `NhtsaVehicleService.cs`, the AI used a `sed` command to strip some null-forgiving operators and in doing so left an extra closing parenthesis on three statements. It would have been a compile error. It was caught by printing the edited section and re-reading it, then fixed.
