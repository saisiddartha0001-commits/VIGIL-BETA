// @ts-check
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const CELESTRAK_URL = 'https://celestrak.org/NORAD/elements/gp.php?GROUP=STATIONS&FORMAT=JSON';
const SOURCE_NAME = 'CelesTrak General Perturbations (GP) Orbit Elements';
const CACHE_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours per CelesTrak usage policy

const RAW_DATA_PATH = path.join(ROOT_DIR, 'public', 'data', 'raw', 'celestrak-stations.json');
const NORMALIZED_DATA_PATH = path.join(ROOT_DIR, 'public', 'data', 'normalized', 'celestrak-stations.json');
const MANIFEST_PATH = path.join(ROOT_DIR, 'public', 'data', 'manifest.json');
const SRC_DATA_PATH = path.join(ROOT_DIR, 'src', 'data', 'celestrakSnapshot.json');

// Keplerian gravitational constant for Earth (km^3 / s^2) and mean Earth radius (km)
const MU_EARTH = 398600.4418;
const R_EARTH = 6378.137;

/**
 * Audit domain bounds and schema compliance for an OMM record
 */
function auditOmmRecord(raw, retrievedAtUtc) {
  const missingFields = [];
  const checks = [];

  // 1. Structure & Identifiers
  const hasName = Boolean(raw.OBJECT_NAME && typeof raw.OBJECT_NAME === 'string' && raw.OBJECT_NAME.trim().length > 0);
  const hasId = Boolean(raw.OBJECT_ID && typeof raw.OBJECT_ID === 'string');
  const hasNorad = Number.isInteger(raw.NORAD_CAT_ID) && raw.NORAD_CAT_ID > 0;

  checks.push({
    id: 'CHK_ID_NAME',
    label: 'Object Name Usability',
    category: 'IDENTIFIERS',
    status: hasName ? 'PASS' : 'FAIL',
    details: hasName ? `Object title present: "${raw.OBJECT_NAME}"` : 'Missing or empty OBJECT_NAME',
    measuredValue: raw.OBJECT_NAME || 'EMPTY',
  });

  checks.push({
    id: 'CHK_ID_NORAD',
    label: 'NORAD Catalogue Identifier',
    category: 'IDENTIFIERS',
    status: hasNorad ? 'PASS' : 'FAIL',
    details: hasNorad ? `Positive integer NORAD ID: #${raw.NORAD_CAT_ID}` : 'Invalid or non-integer NORAD_CAT_ID',
    measuredValue: raw.NORAD_CAT_ID,
  });

  // 2. EPOCH Chronology & Parsing
  let epochDate = null;
  let epochValid = false;
  let epochIso = '';
  if (raw.EPOCH && typeof raw.EPOCH === 'string') {
    // CelesTrak timestamps are ISO 8601 without 'Z' or with microsecond resolution (e.g. 2026-10-15T19:43:34.186944)
    const formattedEpoch = raw.EPOCH.endsWith('Z') ? raw.EPOCH : `${raw.EPOCH}Z`;
    epochDate = new Date(formattedEpoch);
    if (!Number.isNaN(epochDate.getTime())) {
      epochValid = true;
      epochIso = epochDate.toISOString();
    }
  }

  checks.push({
    id: 'CHK_EPOCH_PARSE',
    label: 'Orbital Element Epoch Parsing',
    category: 'EPOCH_CHRONOLOGY',
    status: epochValid ? 'PASS' : 'FAIL',
    details: epochValid
      ? `Valid ISO 8601 UTC epoch: ${epochIso}`
      : `Unparseable EPOCH string: "${raw.EPOCH}"`,
    measuredValue: epochIso || String(raw.EPOCH),
  });

  // Age calculation (EPOCH vs Retrieval Time)
  let ageHours = 0;
  if (epochValid) {
    const retrievalDate = new Date(retrievedAtUtc);
    ageHours = Math.max(0, (retrievalDate.getTime() - epochDate.getTime()) / (1000 * 60 * 60));
  }

  // VIGIL Prototype Freshness Policy:
  // FRESH: < 24 hours
  // AGING: 24h - 48h
  // STALE: 48h - 72h
  // CRITICAL_LATENCY: > 72 hours
  const freshnessStatus =
    !epochValid
      ? 'FAIL'
      : ageHours < 24
      ? 'PASS'
      : ageHours < 48
      ? 'WARNING'
      : 'FAIL';

  checks.push({
    id: 'CHK_EPOCH_FRESHNESS',
    label: 'Orbital Element Age Policy (< 24h LEO)',
    category: 'FRESHNESS',
    status: freshnessStatus,
    details: `Element set age is ${ageHours.toFixed(1)} hours at retrieval time (VIGIL policy threshold: 24h).`,
    measuredValue: `${ageHours.toFixed(1)}h`,
    threshold: '< 24.0h',
  });

  // 3. Domain Bounds on Orbital Elements
  // Mean Motion: for LEO, typically 11 - 17 rev/day
  const mm = raw.MEAN_MOTION;
  const mmValid = typeof mm === 'number' && Number.isFinite(mm) && mm > 0 && mm < 20;
  checks.push({
    id: 'CHK_MEAN_MOTION',
    label: 'Mean Motion Physical Bounds (0 < n < 20 rev/day)',
    category: 'DOMAIN_BOUNDS',
    status: mmValid ? (mm >= 11 && mm <= 17 ? 'PASS' : 'WARNING') : 'FAIL',
    details: mmValid
      ? `Mean motion ${mm.toFixed(4)} rev/day is within plausible physical range.`
      : `Invalid mean motion: ${mm}`,
    measuredValue: `${mm} rev/day`,
    threshold: '11 - 17 rev/day (LEO)',
  });

  // Eccentricity: 0 <= e < 1 (for stations, near-circular e < 0.1)
  const ecc = raw.ECCENTRICITY;
  const eccValid = typeof ecc === 'number' && Number.isFinite(ecc) && ecc >= 0 && ecc < 1;
  checks.push({
    id: 'CHK_ECCENTRICITY',
    label: 'Eccentricity Closed Orbit Bounds (0 <= e < 1)',
    category: 'DOMAIN_BOUNDS',
    status: eccValid ? (ecc < 0.1 ? 'PASS' : 'WARNING') : 'FAIL',
    details: eccValid
      ? `Eccentricity ${ecc.toFixed(6)} confirmed elliptic/near-circular orbit.`
      : `Eccentricity ${ecc} exceeds elliptic bound [0, 1).`,
    measuredValue: ecc,
    threshold: '0.0 - 0.1 (Near-circular)',
  });

  // Inclination: 0 <= i <= 180 degrees
  const inc = raw.INCLINATION;
  const incValid = typeof inc === 'number' && Number.isFinite(inc) && inc >= 0 && inc <= 180;
  checks.push({
    id: 'CHK_INCLINATION',
    label: 'Inclination Angular Range (0° to 180°)',
    category: 'DOMAIN_BOUNDS',
    status: incValid ? 'PASS' : 'FAIL',
    details: incValid ? `Inclination ${inc.toFixed(4)}° is valid.` : `Invalid inclination: ${inc}`,
    measuredValue: `${inc}°`,
    threshold: '0° - 180°',
  });

  // Angles: RAAN, Arg of Pericenter, Mean Anomaly (0° to 360°)
  const raan = raw.RA_OF_ASC_NODE;
  const argP = raw.ARG_OF_PERICENTER;
  const ma = raw.MEAN_ANOMALY;
  const anglesValid =
    Number.isFinite(raan) && raan >= 0 && raan <= 360 &&
    Number.isFinite(argP) && argP >= 0 && argP <= 360 &&
    Number.isFinite(ma) && ma >= 0 && ma <= 360;

  checks.push({
    id: 'CHK_ANGLES',
    label: 'Keplerian Orbital Angles Range (0° to 360°)',
    category: 'DOMAIN_BOUNDS',
    status: anglesValid ? 'PASS' : 'FAIL',
    details: anglesValid
      ? `RAAN=${raan?.toFixed(2)}°, ArgP=${argP?.toFixed(2)}°, MA=${ma?.toFixed(2)}° within [0, 360°]`
      : 'One or more Keplerian angles out of range or non-finite',
    measuredValue: `RAAN:${raan}°, ArgP:${argP}°, MA:${ma}°`,
  });

  // 4. Missing Optional Fields
  const optionalFields = [
    'EPHEMERIS_TYPE',
    'CLASSIFICATION_TYPE',
    'ELEMENT_SET_NO',
    'REV_AT_EPOCH',
    'BSTAR',
    'MEAN_MOTION_DOT',
    'MEAN_MOTION_DDOT',
  ];
  for (const field of optionalFields) {
    if (raw[field] === undefined || raw[field] === null) {
      missingFields.push(field);
    }
  }

  checks.push({
    id: 'CHK_OPTIONAL_FIELDS',
    label: 'Optional SGP4 / BStar Metadata',
    category: 'SCHEMA',
    status: missingFields.length === 0 ? 'PASS' : 'WARNING',
    details: missingFields.length === 0
      ? 'All SGP4 perturbation parameters (BSTAR, derivatives) present.'
      : `Missing optional fields: ${missingFields.join(', ')}`,
    measuredValue: missingFields.length === 0 ? 'Complete' : `Missing: ${missingFields.length}`,
  });

  // 5. State Covariance Matrix Integrity
  // NOTE: Public GP/OMM elements are mean orbital elements, NOT Conjunction Data Messages (CDMs).
  // Covariance is NOT a missing schema field of GP/OMM. It is classified as NOT_CHECKABLE for OMM.
  checks.push({
    id: 'CHK_COVARIANCE',
    label: '6x6 State Error Covariance Tensor',
    category: 'COVARIANCE',
    status: 'NOT_CHECKABLE',
    details: 'NOT PROVIDED IN GP/OMM. CelesTrak public GP/OMM data provides mean Keplerian elements. Positional covariance requires conjunction-specific CDMs and is not evaluated from GP records alone.',
    measuredValue: 'NOT PROVIDED IN GP/OMM',
    threshold: 'Requires CDM Format',
  });

  // Calculate Semi-Major Axis & Approximate Altitude (Kepler's 3rd Law)
  let semiMajorAxisKm = 0;
  let approxAltitudeKm = 0;
  let orbitalPeriodMin = 0;
  if (mmValid) {
    const meanMotionRadS = (raw.MEAN_MOTION * 2 * Math.PI) / 86400;
    semiMajorAxisKm = Math.cbrt(MU_EARTH / Math.pow(meanMotionRadS, 2));
    approxAltitudeKm = Math.round(semiMajorAxisKm - R_EARTH);
    orbitalPeriodMin = 1440 / raw.MEAN_MOTION;
  }

  // Evidence Verdict
  const hasFailedRequiredChecks = checks.some((c) => c.status === 'FAIL' && c.id !== 'CHK_COVARIANCE');
  const evidenceVerdict = 'INSUFFICIENT EVIDENCE';
  const verdictReason =
    'Public GP/OMM elements provide mean Keplerian parameters without a 6x6 state covariance matrix. Collision probabilities cannot be verified.';

  return {
    raw,
    objectName: raw.OBJECT_NAME,
    objectId: raw.OBJECT_ID,
    noradCatId: raw.NORAD_CAT_ID,
    epochUtc: epochIso || raw.EPOCH,
    retrievedAtUtc,
    recordAgeHours: Math.round(ageHours * 10) / 10,
    freshnessCategory: ageHours < 24 ? 'FRESH' : ageHours < 48 ? 'AGING' : 'STALE',
    semiMajorAxisKm: Math.round(semiMajorAxisKm * 10) / 10,
    approxAltitudeKm,
    approxVelocityKmS: Math.round(Math.sqrt(MU_EARTH / (semiMajorAxisKm || (R_EARTH + 400))) * 100) / 100,
    orbitalPeriodMin: Math.round(orbitalPeriodMin * 10) / 10,
    covarianceAvailable: false,
    evidenceVerdict,
    verdictReason,
    checks,
    missingFields,
    qualityScore: Math.round((checks.filter((c) => c.status === 'PASS').length / checks.length) * 100),
  };
}

async function main() {
  const args = process.argv.slice(2);
  const forceRefresh = args.includes('--force');

  console.log('🛰️  VIGIL PUBLIC DATA PIPELINE — CELESTRAK GP/OMM HARNESS');
  console.log(`Source Target: ${CELESTRAK_URL}`);

  // Check existing snapshot & caching policy
  if (!forceRefresh && fs.existsSync(MANIFEST_PATH) && fs.existsSync(RAW_DATA_PATH)) {
    try {
      const existingManifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
      const retrievedAt = new Date(existingManifest.retrievedAtUtc).getTime();
      const now = Date.now();
      const elapsed = now - retrievedAt;

      if (elapsed < CACHE_WINDOW_MS) {
        const remainingMin = Math.round((CACHE_WINDOW_MS - elapsed) / (60 * 1000));
        console.log(`\n📦 Cached snapshot is fresh (${Math.round(elapsed / 60000)}m old, threshold: 120m).`);
        console.log(`Per CelesTrak usage policy, reusing local snapshot. Cache expires in ${remainingMin} minutes.`);
        console.log('To force an immediate re-download, run with --force flag.');
        return;
      }
      console.log(`Cache window expired (${Math.round(elapsed / 60000)}m > 120m). Requesting updated element sets...`);
    } catch (e) {
      console.warn('Existing manifest read error, proceeding to refresh:', e.message);
    }
  }

  const startTime = Date.now();
  console.log(`\nInitiating HTTP GET request to CelesTrak...`);

  let response;
  try {
    response = await fetch(CELESTRAK_URL, {
      headers: {
        'User-Agent': 'VIGIL-Orbital-Auditor/1.0 (Hackathon Research Prototype; Data-Engineering-Pipeline)',
        'Accept': 'application/json',
      },
    });
  } catch (err) {
    console.error(`\n❌ Network retrieval error: ${err.message}`);
    if (fs.existsSync(MANIFEST_PATH) && fs.existsSync(RAW_DATA_PATH)) {
      console.warn(`Preserving previous cached snapshot at ${RAW_DATA_PATH}.`);
    }
    process.exit(1);
  }

  if (!response.ok) {
    console.error(`\n❌ CelesTrak returned non-200 HTTP status: ${response.status} ${response.statusText}`);
    process.exit(1);
  }

  const contentType = response.headers.get('content-type') || 'application/json';
  console.log(`HTTP ${response.status} OK — Content-Type: ${contentType}`);

  const rawText = await response.text();
  let rawJson;
  try {
    rawJson = JSON.parse(rawText);
  } catch (err) {
    console.error(`\n❌ Response body failed JSON parsing: ${err.message}`);
    process.exit(1);
  }

  if (!Array.isArray(rawJson) || rawJson.length === 0) {
    console.error(`\n❌ Unexpected response format: Expected non-empty JSON array, received:`, typeof rawJson);
    process.exit(1);
  }

  const retrievedAtUtc = new Date().toISOString();
  const sha256 = crypto.createHash('sha256').update(rawText).digest('hex');

  console.log(`✓ Received ${rawJson.length} Orbit Mean-Elements Message (OMM) records.`);
  console.log(`✓ SHA-256 Digest: ${sha256}`);

  // Ensure directories exist
  fs.mkdirSync(path.dirname(RAW_DATA_PATH), { recursive: true });
  fs.mkdirSync(path.dirname(NORMALIZED_DATA_PATH), { recursive: true });
  fs.mkdirSync(path.dirname(SRC_DATA_PATH), { recursive: true });

  // 1. Write unmodified raw data
  fs.writeFileSync(RAW_DATA_PATH, rawText, 'utf-8');
  console.log(`✓ Saved raw snapshot to ${path.relative(ROOT_DIR, RAW_DATA_PATH)}`);

  // 2. Normalize and perform forensic validation
  const normalizedRecords = rawJson.map((item) => auditOmmRecord(item, retrievedAtUtc));

  fs.writeFileSync(
    NORMALIZED_DATA_PATH,
    JSON.stringify(normalizedRecords, null, 2),
    'utf-8'
  );
  console.log(`✓ Saved normalized audited records to ${path.relative(ROOT_DIR, NORMALIZED_DATA_PATH)}`);

  // Also write to src/data for bundled offline development/tests
  fs.writeFileSync(
    SRC_DATA_PATH,
    JSON.stringify(
      {
        manifest: {
          sourceName: SOURCE_NAME,
          exactUrl: CELESTRAK_URL,
          retrievedAtUtc,
          recordCount: rawJson.length,
          contentType,
          httpStatus: response.status,
          sha256,
          isCached: false,
          cachingPolicy: '2-hour GP element update window (celestrak.org/usage-policy.php)',
          nextRecommendedRefreshUtc: new Date(Date.now() + CACHE_WINDOW_MS).toISOString(),
        },
        records: normalizedRecords,
      },
      null,
      2
    ),
    'utf-8'
  );

  // 3. Write public manifest
  const manifest = {
    sourceName: SOURCE_NAME,
    exactUrl: CELESTRAK_URL,
    retrievedAtUtc,
    recordCount: rawJson.length,
    contentType,
    httpStatus: response.status,
    sha256,
    isCached: false,
    cachingPolicy: '2-hour GP element update window (celestrak.org/usage-policy.php)',
    nextRecommendedRefreshUtc: new Date(Date.now() + CACHE_WINDOW_MS).toISOString(),
  };

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`✓ Saved manifest to ${path.relative(ROOT_DIR, MANIFEST_PATH)}`);

  console.log(`\nPipeline completed successfully in ${Date.now() - startTime}ms.`);
  console.log(`Retrieved ${rawJson.length} public records at ${retrievedAtUtc}.`);
}

main().catch((err) => {
  console.error('Fatal pipeline execution error:', err);
  process.exit(1);
});
