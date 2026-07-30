'use client';

import { EntradaForm } from './EntradaForm';

interface RegistrarTabProps {
  onEntradaRegistered: () => void;
}

export function RegistrarTab({ onEntradaRegistered }: RegistrarTabProps) {
  return (
    <div style={{ animation: 'fadeUp .3s both' }}>
      <EntradaForm onRegistered={onEntradaRegistered} />
    </div>
  );
}
