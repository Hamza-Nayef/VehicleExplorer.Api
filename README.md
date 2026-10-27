# Vehicle Explorer

Pick a car **make** and **model year** and see the matching **vehicle types** and **models**, powered by the free [NHTSA vPIC API](https://vpic.nhtsa.dot.gov/api/) (no API key needed).

- **Backend:** .NET 10 Web API (minimal APIs). Proxies and caches NHTSA, and serves the built UI.
- **Frontend:** React + TypeScript (Vite).
- **Packaging:** one Docker image containing both.

> Design choices, assumptions, trade-offs and AI usage are in [DECISIONS.md](DECISIONS.md).

## Run locally

### Option A: Docker (recommended, nothing else to install)

Prerequisite: [Docker](https://docs.docker.com/get-docker/).

1. Clone the repo and go into it:
   ```bash
   git clone https://github.com/<your-username>/vehicle-explorer.git
   cd vehicle-explorer
   ```
2. Build and start:
   ```bash
   docker compose up --build
   ```
3. Open <http://localhost:8080>.
4. Stop with `Ctrl+C` (then `docker compose down` to remove the container).

Without Compose:

```bash
docker build -t vehicle-explorer .
docker run --rm -p 8080:8080 vehicle-explorer
```

### Option B: Without Docker (hot reload for development)

Prerequisites: [.NET 10 SDK](https://dotnet.microsoft.com/download) and [Node.js 22+](https://nodejs.org/).

1. **Terminal 1, API** (listens on <http://localhost:5080>):
   ```bash
   cd backend/VehicleExplorer.Api
   dotnet run
   ```
2. **Terminal 2, UI** (listens on <http://localhost:5173> and proxies `/api` to the API):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
3. Open <http://localhost:5173>.

### Tests and checks

```bash
cd frontend
npm test        # unit tests (Vitest)
npm run lint
npm run build   # type-checks and builds
```

## API

| Method | Path | Notes |
|---|---|---|
| GET | `/api/makes` | All makes, sorted by name. Cached 24h. |
| GET | `/api/makes/{makeId}/vehicle-types` | Vehicle types NHTSA lists for the make. |
| GET | `/api/makes/{makeId}/models?year=2015` | Models for make + year. `year` is required (1950 to next year). |
| GET | `/api/makes/{makeId}/models?year=2015&vehicleType=Passenger%20Car` | Same, narrowed to one vehicle type. |
| GET | `/health` | Liveness check. |

```bash
curl http://localhost:8080/api/makes/474/models?year=2015
```

Errors use RFC 7807 problem details: `400` for invalid input, `502` when NHTSA is unavailable.

## Project layout

```
backend/VehicleExplorer.Api/
  Program.cs                 composition root, error handling, static files
  Endpoints/                 HTTP surface (routing + input validation)
  Services/                  NHTSA client + caching
  Models/                    DTOs returned by our API
frontend/src/
  api.ts                     typed client for our API
  useApi.ts                  data-loading hook (abort + retry)
  components/MakePicker.tsx  searchable combobox
  lib/filterMakes.ts         search/ranking logic (unit tested)
Dockerfile                   multi-stage: build UI -> publish API -> slim runtime
```

## Deploy to AWS (Free Tier)

The app is a single container, so the simplest fit is one small EC2 instance running Docker. **No credentials are stored in this repo**; you authenticate via the AWS console and your own SSH key.

> Free Tier rules depend on when your AWS account was created (12-month offer vs. the newer credit-based free plan). Check **Billing > Free Tier** in the console, pick an instance type it marks as free-tier eligible (e.g. `t3.micro`), and terminate the instance when you are done.

1. **Launch an instance** in the EC2 console: Amazon Linux 2023, a free-tier-eligible type, and create/download a key pair (keep the `.pem` out of git).
2. **Security group:** allow inbound **HTTP 80** from anywhere and **SSH 22 from your IP only**.
3. **Connect:**
   ```bash
   ssh -i /path/to/key.pem ec2-user@<public-ip>
   ```
4. **Install Docker and Git:**
   ```bash
   sudo dnf install -y docker git
   sudo systemctl enable --now docker
   ```
5. **Add swap** (a 1 GB instance can run out of memory while building):
   ```bash
   sudo dd if=/dev/zero of=/swapfile bs=128M count=16 && sudo chmod 600 /swapfile
   sudo mkswap /swapfile && sudo swapon /swapfile
   ```
6. **Build and run:**
   ```bash
   git clone https://github.com/<your-username>/vehicle-explorer.git
   cd vehicle-explorer
   sudo docker build -t vehicle-explorer .
   sudo docker run -d --name vehicle-explorer --restart unless-stopped -p 80:8080 vehicle-explorer
   ```
7. Open `http://<public-ip>` and check `http://<public-ip>/health`.

To update: `git pull`, rebuild, then `sudo docker rm -f vehicle-explorer` and run step 6's `docker run` again.
