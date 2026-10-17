import React, { useState, useMemo, useEffect } from 'react';
import { PageId, OrbitalObject, AssessmentScenario } from './types/vigil';
import { AppShell } from './components/layout/AppShell';
import { OverviewPage } from './features/overview/OverviewPage';
import { DataProvenancePage } from './features/provenance/DataProvenancePage';
import { StabilityLabPage } from './features/stability/StabilityLabPage';
import { EvidenceReportPage } from './features/evidence/EvidenceReportPage';
import { ObjectCatalogPage } from './features/catalog/ObjectCatalogPage';
import {
  DEMO_FRESHNESS_CHECKS,
  DEMO_STABILITY_SCENARIOS,
  DEMO_EVIDENCE_TRACE,
  DEMO_AUDIT_LOG,
} from './data/demoData';
import celestrakSnapshot from './data/celestrakSnapshot.json';
import satcatSnapshot from './data/satcatSnapshot.json';
import { PublicDataManifest, AuditedOmmRecord, SatcatRecord } from './types/omm';

import { ommRecordToOrbitalObject } from './utils/ommTransform';
import { deriveEvidenceGaps } from './utils/findingsDeriver';
import { AuditDossierModal } from './components/ui/AuditDossierModal';
import { sharedSimulationEngine } from './simulation/engine';
import {
  simulatedSatelliteToOrbitalObject,
  simulatedSatelliteToAuditedOmm,
  buildSimulatedManifest,
} from './simulation/adapter';
import { deriveSimulationEvidenceGaps } from './simulation/simulationFindings';
import { SimulationSnapshot } from './types/simulation';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageId>('overview');
  
  // SIMULATION_MODE setting (Enabled by default as required by specification)
  const [isSimulationMode] = useState<boolean>(true);

  // Simulation Engine State Subscription
  const [simSnapshot, setSimSnapshot] = useState<SimulationSnapshot>(() => sharedSimulationEngine.getSnapshot());
  const [simClock, setSimClock] = useState(() => sharedSimulationEngine.getClock());

  useEffect(() => {
    const unsubscribe = sharedSimulationEngine.subscribe((snapshot) => {
      setSimSnapshot(snapshot);
      setSimClock(sharedSimulationEngine.getClock());
    });
    return unsubscribe;
  }, []);

  // Map simulated satellites to application OrbitalObject schema
  const simulatedOrbitalObjects = useMemo(() => {
    return simSnapshot.satellites.map((s, idx) =>
      simulatedSatelliteToOrbitalObject(s, idx, simSnapshot.satellites.length)
    );
  }, [simSnapshot.satellites]);

  // Map simulated satellites to AuditedOmmRecord schema for provenance inspection
  const simulatedOmmRecords = useMemo(() => {
    return simSnapshot.satellites.map((s) =>
      simulatedSatelliteToAuditedOmm(s, simSnapshot.timestampUtc)
    );
  }, [simSnapshot.satellites, simSnapshot.timestampUtc]);

  const simulatedManifest = useMemo(() => {
    return buildSimulatedManifest(simSnapshot.timestampUtc, simSnapshot.satellites.length);
  }, [simSnapshot.timestampUtc, simSnapshot.satellites.length]);

  // Derived evidence gaps directly from active simulation state
  const simulationGaps = useMemo(() => {
    return deriveSimulationEvidenceGaps(simSnapshot);
  }, [simSnapshot]);

  // Fallback / historical real records
  const [celestrakManifest] = useState<PublicDataManifest>(celestrakSnapshot.manifest as PublicDataManifest);
  const [celestrakRecords] = useState<AuditedOmmRecord[]>(celestrakSnapshot.records as unknown as AuditedOmmRecord[]);
  const [satcatRecords] = useState<SatcatRecord[]>(satcatSnapshot.records as SatcatRecord[]);
  
  const satcatMap = useMemo(() => {
    const map = new Map<number, SatcatRecord>();
    satcatRecords.forEach((s) => map.set(s.NORAD_CAT_ID, s));
    return map;
  }, [satcatRecords]);

  const realSatellites = useMemo(() => {
    return celestrakRecords.map((rec, idx) =>
      ommRecordToOrbitalObject(rec, idx, celestrakRecords.length, satcatMap)
    );
  }, [celestrakRecords, satcatMap]);

  // When SIMULATION_MODE is active, use the authoritative simulated dataset
  const satellites = isSimulationMode ? simulatedOrbitalObjects : realSatellites;
  const manifest = isSimulationMode ? simulatedManifest : celestrakManifest;
  const ommRecords = isSimulationMode ? simulatedOmmRecords : celestrakRecords;

  const [selectedSatelliteId, setSelectedSatelliteId] = useState<string>('SIM-000001');
  const [scenarios] = useState<AssessmentScenario[]>(DEMO_STABILITY_SCENARIOS);
  const [activeScenarioId, setActiveScenarioId] = useState<string>('SCN-DRAG-01');

  const evidenceGaps = isSimulationMode ? simulationGaps : deriveEvidenceGaps(celestrakRecords, realSatellites);
  const [evidenceTrace] = useState(DEMO_EVIDENCE_TRACE);
  const [freshnessChecks] = useState(DEMO_FRESHNESS_CHECKS);
  const [auditLogs] = useState(DEMO_AUDIT_LOG);

  const [searchQuery, setSearchQuery] = useState('');
  const [modalTargetSat, setModalTargetSat] = useState<OrbitalObject | null>(null);
  const [toastMessage, setToastMessage] = useState<{ title: string; body: string } | null>(null);
  const [focusGapId, setFocusGapId] = useState<string | undefined>(undefined);

  const showToast = (title: string, body: string, durationMs = 4500) => {
    setToastMessage({ title, body });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.title === title ? null : prev));
    }, durationMs);
  };

  const selectedSatellite = useMemo(() => {
    return satellites.find((s) => s.id === selectedSatelliteId) || satellites[0];
  }, [satellites, selectedSatelliteId]);

  const activeScenario = useMemo(() => {
    return scenarios.find((s) => s.id === activeScenarioId) || scenarios[0];
  }, [scenarios, activeScenarioId]);

  const freshnessFailuresCount = useMemo(() => {
    return freshnessChecks.filter((c) => c.status !== 'PASS').length;
  }, [freshnessChecks]);

  // Page title & description map
  const pageMeta: Record<PageId, { title: string; desc: string }> = {
    overview: {
      title: 'Orbital Situational Awareness HUD',
      desc: 'Real-time telemetry, radar projection, and uncertainty audit pipeline',
    },
    provenance: {
      title: 'Data Provenance & Lineage Auditor',
      desc: 'Source tracking catalogs, observation epochs, and cryptographic verification hashes',
    },
    stability: {
      title: 'Stability Lab & Perturbation Engine',
      desc: 'Atmospheric drag, solar radiation pressure, and gravitational sensitivity modeling',
    },
    evidence: {
      title: 'Evidence Quality & Uncertainty Audit Report',
      desc: 'Forensic inspection of observation latency, covariance omissions, and maneuver blockers',
    },
    catalog: {
      title: 'Orbital Catalog & Fleet Registry',
      desc: 'Multi-regime space asset tracking with quality grades and conjunction threat vectors',
    },
  };

  // Navigation action with optional target deep-link
  const handleNavigate = (page: PageId, targetId?: string) => {
    if (page === 'evidence' && targetId) {
      setFocusGapId(targetId);
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset Simulation Scenario to initial epoch and seed
  const handleResetDemo = () => {
    sharedSimulationEngine.reset();
    setSelectedSatelliteId('SIM-000001');
    setActiveScenarioId('SCN-DRAG-01');
    setSearchQuery('');
    showToast(
      'SIMULATION SCENARIO RESET',
      'Simulation engine reset to initial seed epoch (2026-10-17 00:00:00 UTC). Authoritative state restored.'
    );
  };

  // Handle sensor tasking simulation
  const handleTaskSensor = (gapId: string) => {
    showToast(
      'SIMULATED SENSOR TASKING DISPATCHED',
      `Virtual tracking task scheduled across simulated ground radar network for gap ${gapId}.`
    );
  };

  return (
    <AppShell
      currentPage={currentPage}
      onSelectPage={(page) => handleNavigate(page)}
      pageTitle={pageMeta[currentPage].title}
      pageDescription={pageMeta[currentPage].desc}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      gapsCount={evidenceGaps.length}
      catalogCount={satellites.length}
      freshnessFailuresCount={freshnessFailuresCount}
      onResetDemo={handleResetDemo}
      toastMessage={toastMessage}
      onDismissToast={() => setToastMessage(null)}
    >
      {currentPage === 'overview' && (
        <OverviewPage
          satellites={satellites}
          simSatellites={simSnapshot.satellites}
          selectedSatellite={selectedSatellite}
          onSelectSatellite={(sat) => setSelectedSatelliteId(sat.id)}
          scenarios={scenarios}
          activeScenario={activeScenario}
          onSelectScenario={(sc) => setActiveScenarioId(sc.id)}
          evidenceGaps={evidenceGaps}
          evidenceTrace={evidenceTrace}
          freshnessChecks={freshnessChecks}
          onNavigate={handleNavigate}
          onRequestSimBurn={(satId) => {
            const sat = satellites.find((s) => s.id === satId);
            if (sat) setModalTargetSat(sat);
          }}
          isSimPlaying={simClock.isPlaying}
          onToggleSimPlay={() => {
            if (simClock.isPlaying) {
              sharedSimulationEngine.pause();
            } else {
              sharedSimulationEngine.start();
            }
          }}
          simSpeed={simClock.speedMultiplier}
          onSetSimSpeed={(spd) => sharedSimulationEngine.setSpeed(spd)}
          onResetSimClock={() => sharedSimulationEngine.reset()}
          currentSimUtc={simSnapshot.timestampUtc}
        />
      )}

      {currentPage === 'provenance' && (
        <DataProvenancePage
          manifest={manifest}
          ommRecords={ommRecords}
          selectedNoradId={selectedSatellite.noradId}
          onSelectNoradId={(noradId) => {
            const match = satellites.find((s) => s.noradId === noradId);
            if (match) setSelectedSatelliteId(match.id);
          }}
          onRefreshProvenance={() => {
            showToast(
              'AUDIT RE-EVALUATED',
              isSimulationMode
                ? `All ${ommRecords.length} simulated Keplerian orbits and 6x6 covariance tensors re-verified.`
                : 'All 21 CelesTrak OMM records re-audited against current time and domain bounds.'
            );
          }}
          onNavigateToEvidence={() => handleNavigate('evidence')}
          onNavigateToStability={() => handleNavigate('stability')}
        />
      )}

      {currentPage === 'stability' && (
        <StabilityLabPage
          scenarios={scenarios}
          activeScenario={activeScenario}
          onSelectScenario={(sc) => setActiveScenarioId(sc.id)}
          onNavigateToEvidence={() => handleNavigate('evidence')}
        />
      )}

      {currentPage === 'evidence' && (
        <EvidenceReportPage
          evidenceGaps={evidenceGaps}
          auditLogs={auditLogs}
          selectedSatellite={selectedSatellite}
          selectedGapId={focusGapId}
          onNavigateToStability={() => handleNavigate('stability')}
          onNavigateToProvenance={() => handleNavigate('provenance')}
          onTaskSensor={handleTaskSensor}
        />
      )}

      {currentPage === 'catalog' && (
        <ObjectCatalogPage
          satellites={satellites}
          selectedSatellite={selectedSatellite}
          onSelectSatellite={(sat) => setSelectedSatelliteId(sat.id)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onNavigateToEvidence={() => handleNavigate('evidence')}
          onNavigateToStability={() => handleNavigate('stability')}
          onRequestSimBurn={(satId) => {
            const sat = satellites.find((s) => s.id === satId);
            if (sat) setModalTargetSat(sat);
          }}
        />
      )}

      {/* Forensic Audit Dossier Modal */}
      <AuditDossierModal
        isOpen={Boolean(modalTargetSat)}
        onClose={() => setModalTargetSat(null)}
        targetSatellite={modalTargetSat}
      />
    </AppShell>
  );
};
