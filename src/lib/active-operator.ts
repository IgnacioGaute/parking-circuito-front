import type { Operator } from '@/types';

const STORAGE_KEY = 'parking_active_operator';

export function saveActiveOperator(operator: Operator): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(operator));
}

export function readActiveOperator(): Operator | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Operator;
  } catch {
    return null;
  }
}

export function clearActiveOperator(): void {
  localStorage.removeItem(STORAGE_KEY);
}
