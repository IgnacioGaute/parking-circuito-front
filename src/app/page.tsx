'use client';

import { useEffect, useState } from 'react';
import { getInsideAction } from '@/actions/parking-records.actions';
import { AdminTab } from '@/components/admin/AdminTab';
import { DentroTab } from '@/components/dashboard/DentroTab';
import { Header } from '@/components/dashboard/Header';
import { HistorialTab } from '@/components/dashboard/HistorialTab';
import { NavTabs, type TabKey } from '@/components/dashboard/NavTabs';
import { RegistrarTab } from '@/components/dashboard/RegistrarTab';
import { Toast } from '@/components/dashboard/Toast';
import { UsuariosTab } from '@/components/dashboard/UsuariosTab';
import { readActiveOperator } from '@/lib/active-operator';
import { useToast } from '@/lib/use-toast';
import { colors, screenBackground } from '@/styles/theme';
import type { Operator } from '@/types';

export default function DashboardPage() {
  const [isDesktop, setIsDesktop] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('registrar');
  const [activeOperator, setActiveOperator] = useState<Operator | null>(null);
  const [insideCount, setInsideCount] = useState(0);
  const { toast, showToast } = useToast();
  const isAdmin = activeOperator?.role === 'admin';

  useEffect(() => {
    // localStorage and window.innerWidth only exist client-side, so the
    // initial read has to happen here rather than during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveOperator(readActiveOperator());

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
      <Header operatorName={activeOperator?.name ?? '—'} />

      <div
        style={{
          display: 'flex',
          position: 'relative',
          zIndex: 1,
          flexDirection: isDesktop ? 'row' : 'column',
        }}
      >
        <NavTabs
          isDesktop={isDesktop}
          activeTab={activeTab}
          insideCount={insideCount}
          isAdmin={isAdmin}
          onSelect={setActiveTab}
        />

        <main
          style={{
            flex: 1,
            minWidth: 0,
            overflowY: 'auto',
            padding: isDesktop ? '32px 36px' : 16,
            paddingBottom: isDesktop ? 36 : 'calc(88px + env(safe-area-inset-bottom))',
          }}
        >
          <div
            style={{
              maxWidth: isDesktop ? 920 : '100%',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
            }}
          >
            {activeTab === 'registrar' && (
              <RegistrarTab
                onEntradaRegistered={() => setInsideCount((count) => count + 1)}
              />
            )}
            {activeTab === 'dentro' && (
              <DentroTab isDesktop={isDesktop} onCountChange={setInsideCount} />
            )}
            {activeTab === 'historial' && <HistorialTab />}
            {activeTab === 'usuarios' && <UsuariosTab />}
            {activeTab === 'admin' && isAdmin && (
              <AdminTab currentOperatorId={activeOperator?.id ?? null} onToast={showToast} />
            )}
          </div>
        </main>
      </div>

      <Toast message={toast} />
    </div>
  );
}
