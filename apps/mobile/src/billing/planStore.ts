import { useSyncExternalStore } from 'react';

import type { Plan } from '../library/types';
import { CURRENT_PLAN } from './entitlement';

/**
 * Plano efetivo da sessão.
 *
 * Até a Fase 10 o app não tem cobrança: o plano inicial é sempre `CURRENT_PLAN` (grátis).
 * Em build de desenvolvimento, a pílula do plano na biblioteca alterna para o Pro, para
 * testar transposição e metadados sem inventar um direito local no build de produção
 * (ADR 0007, RNFM-09).
 */
const IS_DEV = typeof __DEV__ !== 'undefined' && __DEV__;

let currentPlan: Plan = CURRENT_PLAN;
const listeners = new Set<() => void>();

export function getPlan(): Plan {
  return currentPlan;
}

export function setPlan(plan: Plan): void {
  if (!IS_DEV || plan === currentPlan) return;

  currentPlan = plan;
  for (const listener of listeners) listener();
}

export function usePlan(): Plan {
  return useSyncExternalStore(subscribe, getPlan, getPlan);
}

/** Exposto para a interface decidir se mostra o atalho de teste. */
export const DEV_PLAN_SWITCH = IS_DEV;

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
