import type { Plan } from '../library/types';

/**
 * Até a Fase 10 não existe cobrança: o app opera no grátis.
 * O Pro só será liberado por um direito assinado pelo backend (ADR 0007, RNFM-09),
 * nunca por uma resposta ou preferência local.
 */
export const CURRENT_PLAN: Plan = 'free';
