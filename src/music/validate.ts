import { timeSignatureInQuarters, voiceDurationInQuarters, type Fraction } from './duration';
import type { Score, TimeSignature } from './model';

export type IssueSeverity = 'warning' | 'error';

export interface ScoreIssue {
  readonly severity: IssueSeverity;
  readonly code:
    | 'empty-score'
    | 'empty-part'
    | 'empty-measure'
    | 'duplicate-voice-id'
    | 'measure-duration-mismatch'
    | 'pitch-octave-out-of-range';
  readonly message: string;
  readonly partId?: string;
  readonly measureNumber?: number;
}

/**
 * Verificações tolerantes: o gerador continua funcionando, mas a UI pode avisar
 * o que provavelmente está errado (base do modo tolerante, RF-11).
 */
export function validateScore(score: Score): ScoreIssue[] {
  const issues: ScoreIssue[] = [];

  if (score.parts.length === 0) {
    issues.push({ severity: 'error', code: 'empty-score', message: 'A partitura não tem partes.' });
    return issues;
  }

  for (const part of score.parts) {
    if (part.measures.length === 0) {
      issues.push({
        severity: 'warning',
        code: 'empty-part',
        message: `A parte "${part.name}" não tem compassos.`,
        partId: part.id,
      });
      continue;
    }

    let currentTime: TimeSignature | undefined;
    for (const measure of part.measures) {
      if (measure.attributes?.time) currentTime = measure.attributes.time;

      if (measure.voices.length === 0) {
        issues.push({
          severity: 'warning',
          code: 'empty-measure',
          message: `O compasso ${measure.number} não tem vozes.`,
          partId: part.id,
          measureNumber: measure.number,
        });
      }

      const seenVoiceIds = new Set<string>();
      for (const voice of measure.voices) {
        if (seenVoiceIds.has(voice.id)) {
          issues.push({
            severity: 'warning',
            code: 'duplicate-voice-id',
            message: `A voz "${voice.id}" aparece duas vezes no compasso ${measure.number}.`,
            partId: part.id,
            measureNumber: measure.number,
          });
        }
        seenVoiceIds.add(voice.id);

        for (const event of voice.events) {
          if (event.type === 'note' && (event.pitch.octave < 0 || event.pitch.octave > 9)) {
            issues.push({
              severity: 'warning',
              code: 'pitch-octave-out-of-range',
              message: `Oitava ${event.pitch.octave} fora da faixa 0–9 no compasso ${measure.number}.`,
              partId: part.id,
              measureNumber: measure.number,
            });
          }
        }
      }

      if (!currentTime) continue;

      const time = currentTime;
      const expected = timeSignatureInQuarters(time);
      measure.voices.forEach((voice, index) => {
        if (voice.events.length === 0) return;
        const actual = voiceDurationInQuarters(measure, index);
        if (!equals(expected, actual)) {
          issues.push({
            severity: 'warning',
            code: 'measure-duration-mismatch',
            message: `A voz "${voice.id}" do compasso ${measure.number} soma ${formatFraction(actual)} semínimas, mas a fórmula ${time.beats}/${time.beatType} exige ${formatFraction(expected)}.`,
            partId: part.id,
            measureNumber: measure.number,
          });
        }
      });
    }
  }

  return issues;
}

function equals(a: Fraction, b: Fraction): boolean {
  return a.numerator * b.denominator === b.numerator * a.denominator;
}

function formatFraction(value: Fraction): string {
  return value.denominator === 1
    ? String(value.numerator)
    : `${value.numerator}/${value.denominator}`;
}
