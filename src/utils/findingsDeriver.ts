import { AuditedOmmRecord } from '../types/omm';
import { OrbitalObject, EvidenceGap } from '../types/vigil';

/**
 * Derives a single, authoritative collection of Evidence Gaps / Audit Findings
 * directly from actual record validation checks across the loaded orbital dataset.
 *
 * Guarantees:
 * 1. The executive evidence-gap count equals the findings collection and the filtered list.
 * 2. Every visible finding is backed by real record validation results (e.g. latency, unverified covariance).
 * 3. No invented or fictional conjunction findings.
 */
export function deriveEvidenceGaps(
  records: AuditedOmmRecord[],
  _satellites: OrbitalObject[]
): EvidenceGap[] {
  const findings: EvidenceGap[] = [];

  // Finding 1: System-wide GP/OMM Covariance Limitation
  // Public GP/OMM mean elements do not contain Conjunction Data Messages (CDMs) or 6x6 covariance tensors.
  const recordsWithoutCovariance = records.filter(
    (r) => !r.covarianceAvailable || r.checks.some((c) => c.category === 'COVARIANCE' && c.status === 'NOT_CHECKABLE')
  );

  if (recordsWithoutCovariance.length > 0) {
    const affectedNames = recordsWithoutCovariance
      .slice(0, 3)
      .map((r) => `${r.objectName} #${r.noradCatId}`);
    if (recordsWithoutCovariance.length > 3) {
      affectedNames.push(`+${recordsWithoutCovariance.length - 3} more catalog objects`);
    }

    findings.push({
      id: 'FINDING-CDM-COV-01',
      title: 'Missing Full 6x6 State Covariance Matrix in Public GP/OMM Records',
      severity: 'WARNING',
      category: 'MISSING_COVARIANCE',
      affectedObjects: affectedNames,
      description:
        'Public CelesTrak GP/OMM element sets provide mean Keplerian elements. Official 6x6 positional and velocity covariance tensors or Conjunction Data Messages (CDMs) are not supplied in GP/OMM formats.',
      whyItMatters:
        'Calculating a mathematically rigorous Collision Probability (PoC) requires an empirical 6x6 error covariance matrix. In its absence, calculating numerical collision probabilities requires ungrounded spherical error assumptions that misrepresent operational risk.',
      recommendedAction:
        'Keep collision-risk assessment classified as NOT PERFORMED for public GP/OMM elements. Ingest official 18th SDS / Space-Track CDMs before evaluating tactical collision probability.',
      impactOnVerdict:
        'Collision risk remains NOT PERFORMED. Automated maneuver burns are not certified from GP data alone.',
      detectionTimestamp: records[0]?.retrievedAtUtc || new Date().toISOString(),
      status: 'ACKNOWLEDGED',
    });
  }

  // Finding 2+: Record-specific Freshness / Latency Findings
  // Identify records whose epoch latency exceeds the 24h operational freshness policy.
  const latencyViolations = records.filter(
    (r) => r.freshnessCategory === 'STALE' || r.freshnessCategory === 'AGING' || r.recordAgeHours > 24
  );

  if (latencyViolations.length > 0) {
    const affectedObjects = latencyViolations.map((r) => `${r.objectName} #${r.noradCatId} (${r.recordAgeHours.toFixed(1)}h age)`);

    findings.push({
      id: 'FINDING-LAT-OBS-02',
      title: 'Public Catalog Element Set Latency Exceeds Operational Freshness Policy (>24h)',
      severity: 'WARNING',
      category: 'OBSERVATION_LATENCY',
      affectedObjects,
      description: `Orbital ephemeris epochs for ${latencyViolations.length} catalog object(s) exceed the 24-hour element freshness threshold relative to snapshot retrieval time.`,
      whyItMatters:
        'In Low Earth Orbit, atmospheric drag perturbations accumulate along-track position error over time, degrading SGP4 propagation accuracy as element age increases.',
      recommendedAction:
        'Trigger CelesTrak GP element set refresh or ingest fresh operator telemetry to re-anchor orbit determination.',
      impactOnVerdict:
        'Advisory warning: Element refresh recommended prior to high-precision conjunction screening.',
      detectionTimestamp: latencyViolations[0]?.epochUtc || new Date().toISOString(),
      status: 'OPEN',
    });
  }

  // Finding 3: Specific Schema or Numerical Domain Warnings (if any record has FAIL checks)
  const schemaOrDomainFails = records.filter((r) =>
    r.checks.some((c) => c.status === 'FAIL' && c.category !== 'COVARIANCE')
  );

  if (schemaOrDomainFails.length > 0) {
    findings.push({
      id: 'FINDING-SCHEMA-ANOM-03',
      title: 'Orbital Record Domain Bounds Anomaly Detected',
      severity: 'CRITICAL',
      category: 'SENSOR_LINEAGE',
      affectedObjects: schemaOrDomainFails.map((r) => `${r.objectName} #${r.noradCatId}`),
      description: `${schemaOrDomainFails.length} record(s) failed numerical or physical domain validation checks.`,
      whyItMatters:
        'Non-physical orbital parameters or corrupted mean motion values will produce invalid SGP4 ephemeris propagation.',
      recommendedAction:
        'Isolate corrupted records from automated flight dynamics pipeline and inspect raw OMM JSON payload.',
      impactOnVerdict:
        'Sets record data quality verdict to VALIDATION FAILED.',
      detectionTimestamp: new Date().toISOString(),
      status: 'INVESTIGATING',
    });
  }

  return findings;
}
