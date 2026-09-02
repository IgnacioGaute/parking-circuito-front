'use client';

import { useEffect, useMemo, useState } from 'react';
import { getInsideAction } from '@/actions/parking-records.actions';
import { AdminTab } from '@/components/admin/AdminTab';
import { DentroTab } from '@/components/dashboard/DentroTab';
import { EstadisticasTab } from '@/components/dashboard/EstadisticasTab';
import { FrecuentesTab } from '@/components/dashboard/FrecuentesTab';
import { Header } from '@/components/dashboard/Header';
import { HistorialTab } from '@/components/dashboard/HistorialTab';
import { NavTabs, type TabKey } from '@/components/dashboard/NavTabs';
import { RegistrarTab } from '@/components/dashboard/RegistrarTab';
import { Toast } from '@/components/dashboard/Toast';
import { TourOverlay } from '@/components/tour/TourOverlay';
import { UsuariosTab } from '@/components/dashboard/UsuariosTab';
import { readActiveOperator } from '@/lib/active-operator';
import { TOUR_STEPS } from '@/lib/tour-steps';
import { useToast } from '@/lib/use-toast';
import { colors, screenBackground } from '@/styles/theme';
import type { Operator } from '@/types';

const SIDEBAR_COLLAPSED_KEY = 'sidebar_collapsed';

export default function DashboardPage() {
  const [isDesktop, setIsDesktop] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('registrar');
  const [activeOperator, setActiveOperator] = useState<Operator | null>(null);
  const [insideCount, setInsideCount] = useState(0);
  const [tourStep, setTourStep] = useState<number | null>(null);
  const [tourAdminSection, setTourAdminSection] = useState<'operadores' | 'campos' | undefined>(
    undefined,
  );
  const { toast, showToast } = useToast();
  const isAdmin = activeOperator?.role === 'admin';
  const tourSteps = useMemo(
    () => TOUR_STEPS.filter((step) => !step.adminOnly || isAdmin),
    [isAdmin],
  );

  useEffect(() => {
    // localStorage and window.innerWidth only exist client-side, so the
    // initial read has to happen here rather than during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveOperator(readActiveOperator());
    setSidebarCollapsed(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true');

    const checkDesktop = () => setIsDesktop(window.innerWidth >= 900);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  useEffect(() => {
    getInsideAction()
      .then((records) => setInsideCount(records.length))
      .catch(() => undefined);
  }, []);

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed((current) => {
      const next = !current;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {
        // Private browsing / storage disabled — collapse just won't persist.
      }
      return next;
    });
  };

  // Drives the actual screen (and, for admin steps, the Operadores/Campos
  // sub-section) to match whatever the guided tour is currently explaining,
  // so the spotlighted element is real on-screen content, not a description
  // of a screen the user isn't looking at. Adjusted during render (React's
  // documented pattern for this) rather than in an effect, to avoid an
  // extra cascading render.
  const [tourSyncedStep, setTourSyncedStep] = useState<number | null>(null);
  if (tourStep !== tourSyncedStep) {
    setTourSyncedStep(tourStep);
    if (tourStep !== null) {
      const step = tourSteps[tourStep];
      if (step) {
        setActiveTab(step.tab);
        setTourAdminSection(step.adminSection);
      }
    }
  }

  const startTour = () => setTourStep(0);
  const nextTourStep = () =>
    setTourStep((current) => (current === null ? null : Math.min(current + 1, tourSteps.length - 1)));
  const prevTourStep = () =>
    setTourStep((current) => (current === null ? null : Math.max(current - 1, 0)));
  const closeTour = () => {
    setTourStep(null);
    setTourAdminSection(undefined);
  };

  const nav = (
    <NavTabs
      isDesktop={isDesktop}
      activeTab={activeTab}
      insideCount={insideCount}
      isAdmin={isAdmin}
      onSelect={setActiveTab}
      collapsed={sidebarCollapsed}
      onToggleCollapsed={toggleSidebarCollapsed}
    />
  );

  const content = (
    <div
      style={{
        maxWidth: isDesktop ? 1120 : '100%',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      }}
    >
      {activeTab === 'registrar' && (
        <RegistrarTab onEntradaRegistered={() => setInsideCount((count) => count + 1)} />
      )}
      {activeTab === 'dentro' && (
        <DentroTab
          isDesktop={isDesktop}
          onCountChange={setInsideCount}
          onToast={showToast}
        />
      )}
      {activeTab === 'frecuentes' && <FrecuentesTab onToast={showToast} />}
      {activeTab === 'historial' && <HistorialTab isAdmin={isAdmin} onToast={showToast} />}
      {activeTab === 'estadisticas' && <EstadisticasTab />}
      {activeTab === 'usuarios' && <UsuariosTab />}
      {activeTab === 'admin' && isAdmin && (
        <AdminTab
          currentOperatorId={activeOperator?.id ?? null}
          onToast={showToast}
          forcedSection={tourAdminSection}
        />
      )}
    </div>
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        position: 'relative',
        background: colors.bg,
        ...screenBackground,
        fontFamily: 'var(--font-manrope), system-ui, sans-serif',
        color: colors.textPrimary,
        // Plain `overflowX: hidden` would force overflow-y to `auto` too (per the
        // CSS overflow spec), which makes this box the sticky containing block
        // instead of the viewport — breaking the sticky Header/NavTabs below.
        overflowX: 'clip',
      }}
    >
      {isDesktop ? (
        // Classic dashboard shell: full-height sidebar alongside a column
        // holding a slim utility header + the scrollable content — distinct
        // from the mobile structure below (full-width header on top, tab
        // bar fixed to the bottom), not a shared layout stretched to fit.
        <div style={{ display: 'flex', position: 'relative', zIndex: 1 }}>
          {nav}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
            <Header
              operatorName={activeOperator?.name ?? '—'}
              isDesktop
              onStartTour={startTour}
              activeTab={activeTab}
              insideCount={insideCount}
            />
            <main
              style={{
                flex: 1,
                minWidth: 0,
                overflowY: 'auto',
                padding: '32px 36px',
              }}
            >
              {content}
            </main>
          </div>
        </div>
      ) : (
        <>
          <Header
            operatorName={activeOperator?.name ?? '—'}
            onStartTour={startTour}
            activeTab={activeTab}
            insideCount={insideCount}
          />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {nav}
            <main
              style={{
                flex: 1,
                minWidth: 0,
                overflowY: 'auto',
                padding: 16,
                paddingBottom: 'calc(88px + env(safe-area-inset-bottom))',
              }}
            >
              {content}
            </main>
          </div>
        </>
      )}

      <Toast message={toast} />

      {tourStep !== null && (
        <TourOverlay
          steps={tourSteps}
          stepIndex={tourStep}
          onNext={nextTourStep}
          onBack={prevTourStep}
          onClose={closeTour}
        />
      )}
    </div>
  );
}
