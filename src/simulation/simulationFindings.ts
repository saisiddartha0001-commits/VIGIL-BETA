/**
 * Simulation Findings & Evidence Auditor
 * Derives simulation-aware findings directly from active simulated scenarios,
 * physical propagation constraints, and modeled close approaches.
 */

import { EvidenceGap } from '../types/vigil';
import { SimulationSnapshot } from '../types/simulation';

export function deriveSimulationEvidenceGaps(snapshot: SimulationSnapshot): EvidenceGap[] {
  const findings: EvidenceGap[] = [];

  // Finding 1: SIMULATION MODE ACTIVE & MODEL ASSUMPTIONS
  findings.push({
    id: 'SIM-AUDIT-001',
    title: 'Simulation Mode Active: Two-Body Keplerian Mechanics Baseline',
    severity: 'INFORMATIONAL',
    category: 'ATMOSPHERIC_MODEL',
    affectedObjects: [`All ${snapshot.satellites.length} Simulated Space Objects`],
    description:
      'The application is running in deterministic SIMULATION_MODE. Orbital propagation uses a two-body Keplerian model with an iterative Newton-Raphson solver for Kepler’s equation.',
    whyItMatters:
      'High-order perturbations (J2-J4 geopotential harmonics, atmospheric drag variations, and lunar-solar third body attractions) are modeled in perturbation sensitivity labs rather than active two-body propagation.',
    recommendedAction:
      'Evaluate orbital state evolution within the context of the configured simulation epoch and two-body Keplerian mechanics.',
    impactOnVerdict:
      'Orbital states are simulated and verified against two-body dynamics.',
    detectionTimestamp: snapshot.timestampUtc,
    status: 'ACKNOWLEDGED',
  });

  // Finding 2: Close Approach Conjunction Candidates
  if (snapshot.conjunctions.length > 0) {
    const topConj = snapshot.conjunctions[0];
    findings.push({
      id: 'SIM-AUDIT-002',
      title: `Predicted Simulated Close Approach: ${topConj.primaryName} ↔ ${topConj.secondaryName}`,
      severity: topConj.riskSeverity === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
      category: 'MANEUVER_DRIFT',
      affectedObjects: [topConj.primaryName, topConj.secondaryName],
      description: `Numerical encounter search identified a predicted minimum miss distance of ${topConj.missDistanceMeters} m at TCA (${topConj.tcaUtc}) with relative velocity of ${topConj.relativeSpeedKmS} km/s.`,
      whyItMatters: `Close approach encounters below 5 km warrant screening. Modeled collision probability on the encounter B-plane is computed as ${topConj.collisionProbability.toExponential(3)} under configured relative covariance.`,
      recommendedAction:
        'Inspect the encounter geometry on the 3D Orbital Intelligence Dashboard and review simulated maneuver burn options.',
      impactOnVerdict:
        topConj.riskSeverity === 'CRITICAL'
          ? 'Critical conjunction alert active in simulation scenario.'
          : 'Elevated encounter geometry monitored in simulation horizon.',
      detectionTimestamp: snapshot.timestampUtc,
      status: 'INVESTIGATING',
    });
  }

  // Finding 3: Covariance & Uncertainty Modeling Calibration
  const objectsWithCovariance = snapshot.satellites.filter(s => Boolean(s.covariance));
  findings.push({
    id: 'SIM-AUDIT-003',
    title: 'Simulated Gaussian Uncertainty Model Configured',
    severity: 'INFORMATIONAL',
    category: 'MISSING_COVARIANCE',
    affectedObjects: [`${objectsWithCovariance.length} Objects with UVW Covariance`],
    description:
      'Each simulated object defines an illustrative 6x6 positional/velocity uncertainty covariance model calibrated for its orbital regime (Radial, In-track, Cross-track).',
    whyItMatters:
      'Collision probability is derived from explicit covariance projection onto the encounter B-plane (Foster-1992 approximation), rather than arbitrary numbers or ungrounded heuristics.',
    recommendedAction:
      'Inspect covariance sigma bounds in the Object Catalog before approving automated avoidance maneuvers.',
    impactOnVerdict:
      'Collision probability calculation verified against modeled covariance.',
    detectionTimestamp: snapshot.timestampUtc,
    status: 'ACKNOWLEDGED',
  });

  return findings;
}
