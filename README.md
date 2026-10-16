# VIGIL — Orbital Evidence & Uncertainty Auditor

> **"Trust the evidence. Understand the uncertainty."**
> *Inspect data quality before interpreting orbital assessments.*

VIGIL is a specialized aerospace-forensics web application designed to audit data provenance, sensor latency, state covariance completeness, and perturbation sensitivity in space situational awareness (SSA) workflows.

## Architecture

VIGIL is a full-stack application with a React frontend and Node.js/Express backend:

```text
vigil/
├── server/                          # Backend Service
│   ├── src/
│   │   ├── config/                 # Configuration
│   │   ├── controllers/            # API controllers
│   │   ├── database/               # SQLite database & seeding
│   │   ├── middleware/             # Error handling, rate limiting, validation
│   │   ├── orbital/                # Orbital propagation logic
│   │   ├── repositories/           # Data access layer
│   │   ├── routes/                 # API routes
│   │   ├── schemas/                # Shared TypeScript types
│   │   ├── simulation/             # Simulation engine
│   │   ├── app.ts                  # Express app setup
│   │   └── index.ts                # Server entry point
│   ├── package.json
│   └── tsconfig.json
├── src/                            # Frontend (React + TypeScript)
│   ├── api/                        # Typed API client
│   ├── components/                 # React components
│   ├── features/                   # Feature pages
│   ├── data/                       # Data fixtures
│   ├── types/                      # TypeScript types
│   └── utils/                      # Utilities
├── .env.example                    # Environment variables template
├── package.json                    # Frontend dependencies
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js 18+ 
- npm or yarn

### 1. Install Dependencies

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd server
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` in the root directory:
```bash
cp .env.example .env
```

Configure backend environment in `server/.env`:
```bash
cd server
cp .env.example .env
```

### 3. Initialize Database

Seed the database with satellite data:
```bash
cd server
npm run seed
```

### 4. Start the Application

**Backend (Terminal 1):**
```bash
cd server
npm run dev
```
Backend runs on `http://localhost:3001`

**Frontend (Terminal 2):**
```bash
npm run dev
```
Frontend runs on `http://localhost:5173`

### 5. Build for Production

**Frontend:**
```bash
npm run build
```

**Backend:**
```bash
cd server
npm run build
npm start
```

## API Endpoints

### Health
- `GET /api/health` - Server health check

### Overview
- `GET /api/overview` - Dashboard overview data

### Satellites
- `GET /api/satellites` - List satellites (with pagination, search, filtering)
- `GET /api/satellites/:id` - Get satellite details
- `GET /api/satellites/:id/trajectory` - Get trajectory data

### Data Quality
- `GET /api/data/sources` - Data source registry
- `GET /api/data/quality` - Data quality summary
- `GET /api/data/manifest` - Data manifest

### Simulations
- `GET /api/simulations` - List simulations
- `POST /api/simulations` - Create simulation
- `GET /api/simulations/:id` - Get simulation details
- `POST /api/simulations/:id/run` - Run simulation
- `POST /api/simulations/:id/reset` - Reset simulation
- `GET /api/simulations/:id/states` - Get simulation states

### Audit
- `GET /api/audit-logs` - Get audit logs
- `GET /api/evidence-gaps` - Get evidence gaps
- `PATCH /api/evidence-gaps/:id` - Update evidence gap status

## Simulation Mode

VIGIL runs in **SIMULATION MODE** by default. A persistent banner at the top of the application indicates the current data mode:

- **SIMULATED** (default): Values are generated or derived for demonstration
- **LIVE**: Connected to live orbital data sources (future feature)
- **CACHED**: Using cached data

All simulated values include provenance metadata indicating:
- `dataMode`: SIMULATED | LIVE | CACHED
- `sourceType`: Type of data source
- `isSynthetic`: Whether the value is synthetic
- `limitations`: Known limitations of the data

## Data Quality Pipeline

Each satellite record undergoes validation checks:

1. **Schema Validation**: Required fields, data types
2. **Identifier Integrity**: NORAD CAT ID, International Designator
3. **Epoch Chronology**: Valid timestamps, age calculation
4. **Physical Bounds**: Mean motion, eccentricity, inclination ranges
5. **Freshness**: Element age relative to retrieval time
6. **Covariance Availability**: Check for 6x6 state covariance (NOT AVAILABLE in public GP/OMM)

## Orbital Propagation

The simulation engine uses a simplified two-body Keplerian propagator for demonstration. Limitations:

- No atmospheric drag modeling
- No Earth oblateness (J2) perturbations
- No solar radiation pressure
- No third-body gravity effects
- Mean anomaly propagated linearly (Kepler equation not solved iteratively)

For production use, integrate a proper SGP4 library.

## Known Limitations

1. **No Live Data Integration**: Currently uses local CelesTrak snapshots
2. **Simplified Propagation**: Two-body model without perturbations
3. **No 3D Dashboard**: Three.js integration pending
4. **Limited Testing**: Unit tests not yet implemented
5. **SQLite in Memory**: Uses sql.js (in-memory) - data persists only when explicitly saved

## Development

### Refresh Public Data
```bash
npm run refresh-data          # Uses 2-hour cache
npm run refresh-data:force   # Force live download
```

### Type Checking
```bash
npm run build                # Runs TypeScript compiler
```

## License

Internal project - Not for external distribution.
