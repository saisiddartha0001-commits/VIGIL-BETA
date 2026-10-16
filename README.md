# VIGIL — Orbital Evidence & Uncertainty Auditor

> **"Trust the evidence. Understand the uncertainty."**  
> *Inspect data quality before interpreting orbital assessments.*

VIGIL is a specialized aerospace-forensics web application designed to audit data provenance, sensor latency, state covariance completeness, and perturbation sensitivity in space situational awareness (SSA) workflows.

---

## 🛰️ Architecture & Modular Structure

VIGIL follows a decoupled architecture where data ingestion, validation logic, presentation, design tokens, and types are cleanly separated:

```text
vigil/
├── public/
│   ├── data/
│   │   ├── manifest.json            # Public data retrieval manifest (URL, timestamp, SHA-256)
│   │   ├── raw/
│   │   │   └── celestrak-stations.json # Unmodified CelesTrak OMM raw payload
│   │   └── normalized/
│   │       └── celestrak-stations.json # Audited, normalized orbital element records
│   └── favicon.svg                  # Custom aerospace orbital favicon
├── scripts/
│   └── refresh-public-data.mjs      # CelesTrak GP/OMM acquisition & validation pipeline
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx         # Shared app frame with responsive drawer
│   │   │   ├── Sidebar.tsx          # Navigation menu with real OMM badges
│   │   │   └── TopBar.tsx           # UTC clock, demo indicator, and object search
│   │   ├── ui/
│   │   │   ├── StatusBadge.tsx      # Multi-type badge (Risk, Freshness, Verdict, Grade)
│   │   │   ├── MetricCard.tsx       # Scientific instrument metric tile
│   │   │   ├── Panel.tsx            # Modular card container with accent lines
│   │   │   ├── SectionHeader.tsx    # Standardized section typography & actions
│   │   │   └── ManeuverModal.tsx    # Confirmation dialog for simulated avoidance burns
│   │   └── charts/
│   │       ├── SensitivityChart.tsx # Native SVG trajectory divergence with 3σ bands
│   │       ├── OrbitSchematic.tsx   # Native SVG 2D polar projection & threat vectors
│   │       └── EvidenceTraceDiagram.tsx # 4-step interactive forensic audit pipeline
│   ├── features/
│   │   ├── overview/
│   │   │   └── OverviewPage.tsx     # Primary dashboard with focal assessment verdict
│   │   ├── provenance/
│   │   │   └── DataProvenancePage.tsx # Real public CelesTrak OMM auditor & evidence trace
│   │   ├── stability/
│   │   │   └── StabilityLabPage.tsx # Perturbation testing & parameter variance
│   │   ├── evidence/
│   │   │   └── EvidenceReportPage.tsx # Collapsible gap analysis & remediation dossier
│   │   └── catalog/
│   │       └── ObjectCatalogPage.tsx # Searchable, multi-filtered fleet registry
│   ├── data/
│   │   ├── celestrakSnapshot.json   # Bundled snapshot of real CelesTrak OMM stations
│   │   └── demoData.ts              # Synthetic scenarios and perturbation models
│   ├── types/
│   │   ├── omm.ts                   # CelesTrak CCSDS OMM schemas, manifests, & check types
│   │   └── vigil.ts                 # Strongly-typed domain interfaces
│   ├── utils/
│   │   ├── ommQualityAuditor.ts     # Physical domain bounds, epoch chronology, & trace
│   │   └── formatters.ts            # Aerospace distance, velocity, & age formatters
│   ├── styles/
│   │   └── tokens.css               # Design tokens, radar grid, & scrollbars
│   ├── App.tsx                      # Page routing & global harness state
│   ├── main.tsx                     # React 18 DOM mount point
│   ├── index.css                    # Tailwind CSS v4 import & theme mappings
│   └── vite-env.d.ts                # Vite client type references
├── index.html                       # HTML5 entry with Google Fonts (Inter & JetBrains Mono)
├── package.json                     # Local dependencies & pipeline scripts
├── tsconfig.json                    # Root TypeScript project references
├── tsconfig.app.json                # Browser application TypeScript config
├── tsconfig.node.json               # Node/Vite configuration TypeScript config
├── vite.config.ts                   # Vite 6 config with React & Tailwind v4 plugins
├── legacy/
│   └── ai_studio_code (2).html      # Preserved legacy prototype
└── README.md
```

---

## 📡 Public Orbital Data Pipeline (CelesTrak GP/OMM)

### Endpoint
- **URL**: `https://celestrak.org/NORAD/elements/gp.php?GROUP=STATIONS&FORMAT=JSON`
- **Format Specification**: [CelesTrak GP Orbit Data Formats (OMM JSON)](https://celestrak.org/NORAD/documentation/gp-data-formats.php)
- **Usage Policy Compliance**: [CelesTrak Usage Policy](https://celestrak.org/usage-policy.php). GP orbital data updates on a 2-hour schedule. To prevent unnecessary server load, the pipeline caches local snapshots and rejects frequent polling unless `--force` is specified.

### Running the Data Pipeline
```powershell
# Refresh data (uses 2-hour cache snapshot if available)
npm run refresh-data

# Force immediate live download from CelesTrak
npm run refresh-data:force
```

### Manifest (`public/data/manifest.json`)
The pipeline records a cryptographic audit manifest with:
- `sourceName`: "CelesTrak General Perturbations (GP) Orbit Elements"
- `exactUrl`: Complete endpoint URL
- `retrievedAtUtc`: UTC timestamp of acquisition
- `recordCount`: Total records received (21 stations/orbiters)
- `contentType`: `application/json; charset=UTF-8`
- `httpStatus`: `200`
- `sha256`: Cryptographic digest of the unmodified raw response
- `cachingPolicy`: 2-hour GP update policy documentation reference

---

## 🔬 Transparent Quality Checks & Evidence Trace

Each CelesTrak OMM element set undergoes 9 transparent quality checks in [`src/utils/ommQualityAuditor.ts`](file:///c:/Users/siddy01/Desktop/vigil%20beta/src/utils/ommQualityAuditor.ts):

1. **Object Name Usability (`CHK_ID_NAME`)**: Validates non-empty `OBJECT_NAME`.
2. **International Designator (`CHK_ID_INTL`)**: Validates `OBJECT_ID` (COSPAR designator).
3. **NORAD Identifier (`CHK_ID_NORAD`)**: Confirms positive integer `NORAD_CAT_ID`.
4. **Epoch Chronology & Parsing (`CHK_EPOCH_PARSE`)**: Parses ISO 8601 UTC timestamp.
5. **Freshness Policy (`CHK_EPOCH_FRESHNESS`)**: Computes element set age relative to retrieval time against configurable threshold (< 24h LEO default).
6. **Mean Motion Bounds (`CHK_MEAN_MOTION`)**: Confirms $0 < n < 20$ rev/day (11–17 rev/day for LEO).
7. **Eccentricity Closed Orbit (`CHK_ECCENTRICITY`)**: Enforces $0 \le e < 1$ (near-circular $e < 0.1$).
8. **Angular Bounds (`CHK_INCLINATION`, `CHK_ANGLES`)**: Verifies $0 \le i \le 180^\circ$ and Keplerian angles within $[0^\circ, 360^\circ]$.
9. **State Error Covariance Audit (`CHK_COVARIANCE`)**: Audits whether 6x6 covariance tensors are present. **Result: FAIL / ABSENT** in public GP data.

### Evidence Trace Panel
`Source record → Validation checks → Assumptions → Displayed result`
- **Result**: **`INSUFFICIENT EVIDENCE`** — Prevents premature propulsive maneuver recommendations because public GP elements lack the 6x6 state covariance necessary to certify collision risk.

---

## 🚀 Running the Application

### 1. Development Server
```powershell
npm.cmd run dev
```
Access the application at `http://localhost:5173`.

### 2. Production Build
```powershell
npm.cmd run build
```

### 3. Production Preview
```powershell
npm.cmd run preview
```
