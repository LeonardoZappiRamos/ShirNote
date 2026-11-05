import type { Plan } from './types';

/** RFM-13: o plano grátis guarda no máximo oito itens na biblioteca. */
export const FREE_SCORE_LIMIT = 8;

export function isPro(plan: Plan): boolean {
  return plan === 'pro';
}

/**
 * O limite conta itens, não importações: excluir libera vaga.
 * Itens já existentes nunca deixam de abrir quando o limite é atingido.
 */
export function canAddScore(plan: Plan, currentCount: number): boolean {
  if (isPro(plan)) return true;
  return Math.max(0, currentCount) < FREE_SCORE_LIMIT;
}

/** `null` significa ilimitado. */
export function remainingSlots(plan: Plan, currentCount: number): number | null {
  if (isPro(plan)) return null;
  return Math.max(0, FREE_SCORE_LIMIT - Math.max(0, currentCount));
}

export function canTranspose(plan: Plan): boolean {
  return isPro(plan);
}

/** RFM-07: renomear título e autor também é recurso do Pro (PRD móvel, seção 7). */
export function canEditMetadata(plan: Plan): boolean {
  return isPro(plan);
}

export function canExport(plan: Plan): boolean {
  return isPro(plan);
}

export function canSync(plan: Plan): boolean {
  return isPro(plan);
}

/** Mensagem única para os controles bloqueados antes da cobrança existir (Fase 10). */
export function proFeatureMessage(feature: 'transpose' | 'metadata' | 'export' | 'sync'): string {
  const action = {
    transpose: 'Transpor a partitura',
    metadata: 'Editar título e autor',
    export: 'Exportar e imprimir',
    sync: 'Sincronizar com a nuvem',
  }[feature];

  return `${action} faz parte do ShirNote Pro. A compra pela Play Store chega em uma próxima atualização.`;
}

export function freeLimitMessage(): string {
  return (
    `O plano grátis guarda até ${FREE_SCORE_LIMIT} partituras. ` +
    'Exclua um item ou conheça o ShirNote Pro, que também libera edição, exportação e sincronização.'
  );
}
