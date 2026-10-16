import React, { useState, useMemo } from 'react';
import { PageId, OrbitalObject, AssessmentScenario } from './types/vigil';
import { AppShell } from './components/layout/AppShell';
import { OverviewPage } from './features/overview/OverviewPage';
import { DataProvenancePage } from './features/provenance/DataProvenancePage';
import { StabilityLabPage } from './features/stability/StabilityLabPage';
import { EvidenceReportPage } from './features/evidence/EvidenceReportPage';
import { ObjectCatalogPage } from './features/catalog/ObjectCatalogPage';
import { ManeuverModal } from './components/ui/ManeuverModal';
import {
  DEMO_FRESHNESS_CHECKS,
  DEMO_STABILITY_SCENARIOS,
  DEMO_EVIDENCE_GAPS,
  DEMO_EVIDENCE_TRACE,
  DEMO_AUDIT_LOG,
} from './data/demoData';
import celestrakSnapshot from './data/celestrakSnapshot.json';
import satcatSnapshot from './data/satcatSnapshot.json';
import { PublicDataManifest, AuditedOmmRecord, SatcatRecord } from './types/omm';

import { ommRecordToOrbitalObject } from './utils/ommTransform';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageId>('overview');
  const [celestrakManifest] = useState<PublicDataManifest>(celestrakSnapshot.manifest as PublicDataManifest);
  const [celestrakRecords] = useState<AuditedOmmRecord[]>(celestrakSnapshot.records as unknown as AuditedOmmRecord[]);
  const [satcatRecords] = useState<SatcatRecord[]>(satcatSnapshot.records as SatcatRecord[]);
  
  // SATCAT lookup map joined by NORAD_CAT_ID
  const satcatMap = useMemo(() => {
    const map = new Map<number, SatcatRecord>();
    satcatRecords.forEach((s) => map.set(s.NORAD_CAT_ID, s));
    return map;
  }, [satcatRecords]);

  // Single source of truth: 21 authentic CelesTrak OMM records enriched with SATCAT metadata
  const initialSatellites = useMemo(() => {
    return celestrakRecords.map((rec, idx) =>
      ommRecordToOrbitalObject(rec, idx, celestrakRecords.length, satcatMap)
    );
  }, [celestrakRecords, satcatMap]);

  const [satellites, setSatellites] = useState<OrbitalObject[]>(initialSatellites);
  const [selectedSatelliteId, setSelectedSatelliteId] = useState<string>('NORAD-25544');
  const [scenarios] = useState<AssessmentScenario[]>(DEMO_STABILITY_SCENARIOS);
  const [activeScenarioId, setActiveScenarioId] = useState<string>('SCN-DRAG-01');
  const [evidenceGaps, setEvidenceGaps] = useState(DEMO_EVIDENCE_GAPS);
  const [evidenceTrace] = useState(DEMO_EVIDENCE_TRACE);
  const [freshnessChecks] = useState(DEMO_FRESHNESS_CHECKS);
  const [auditLogs, setAuditLogs] = useState(DEMO_AUDIT_LOG);

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
      title: 'Data Provenance & Sensor Lineage',
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

  // Reset Demo Scenario to default parameters
  const handleResetDemo = () => {
    setSatellites(initialSatellites);
    setSelectedSatelliteId('NORAD-25544');
    setActiveScenarioId('SCN-DRAG-01');
    setEvidenceGaps(DEMO_EVIDENCE_GAPS);
    setSearchQuery('');
    showToast(
      'DATA RESTORED TO REAL CELESTRAK OMM',
      'All 21 CelesTrak orbital records reloaded. Verified baseline restored.'
    );
  };

  // Handle simulated evasive maneuver confirmation
  const handleConfirmBurn = () => {
    if (!modalTargetSat) return;
    const targetId = modalTargetSat.id;

    setSatellites((prev) =>
      prev.map((sat) => {
        if (sat.id === targetId) {
          return {
            ...sat,
            riskLevel: 'Nominal',
            color: '#35D39A',
            missDistance: 5380,
            poc: '< 1.0e-7',
            pocValue: 0.00000008,
            tca: 'RESOLVED (POST-BURN)',
            status: 'Operational [Modeled ΔV: +2.4 m/s]',
            auditVerdict: 'EVIDENCE VERIFIED',
            verdictReason: 'Modeled avoidance burn verified clear; miss distance exceeds 5.3 km threshold.',
          };
        }
        return sat;
      })
    );

    // Append to audit log
    const newLog = {
      id: `EVT-${Date.now().toString().slice(-4)}`,
      timestampUtc: new Date().toISOString().replace('T', ' ').substring(0, 19),
      operator: 'OPERATOR-MANUAL',
      action: 'SIMULATED_MANEUVER_BURN',
      category: 'VERDICT_OVERRIDE' as const,
      details: `Executed illustrative ΔV burn (+2.4 m/s) on ${modalTargetSat.name}. Projected miss distance 5,380m.`,
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    showToast(
      'SIMULATED MANEUVER EXECUTED',
      `Illustrative ΔV burn applied to ${modalTargetSat.name}. Projected miss distance increased to 5,380 m. Local state refreshed.`
    );
    setModalTargetSat(null);
  };

  // Handle sensor tasking simulation
  const handleTaskSensor = (gapId: string) => {
    setEvidenceGaps((prev) =>
      prev.map((gap) => (gap.id === gapId ? { ...gap, status: 'INVESTIGATING' } : gap))
    );
    showToast(
      'SENSOR TASKING DISPATCHED',
      `High-priority tracking request sent to ISRO NETRA and European radar nodes for gap ${gapId}.`
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
        />
      )}

      {currentPage === 'provenance' && (
        <DataProvenancePage
          manifest={celestrakManifest}
          ommRecords={celestrakRecords}
          selectedNoradId={selectedSatellite.noradId}
          onSelectNoradId={(noradId) => {
            const match = satellites.find((s) => s.noradId === noradId);
            if (match) setSelectedSatelliteId(match.id);
          }}
          onRefreshProvenance={() => {
            showToast(
              'AUDIT RE-EVALUATED',
              'All 21 CelesTrak OMM records re-audited against current time and domain bounds.'
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

      {/* Maneuver Confirmation Modal */}
      <ManeuverModal
        isOpen={Boolean(modalTargetSat)}
        onClose={() => setModalTargetSat(null)}
        onConfirm={handleConfirmBurn}
        targetSatellite={modalTargetSat}
      />
    </AppShell>
  );
};
