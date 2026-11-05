import { useId, useState } from 'react';
import {
  MAX_TRANSPOSE_SEMITONES,
  UNISON,
  intervalBetweenKeys,
  intervalFifths,
  intervalForSemitones,
  intervalName,
  keyName,
  type Interval,
  type KeySignature,
  type TransposeDirection,
} from '../music';

interface TransposeControlsProps {
  /** Armação de origem, da primeira parte. */
  readonly sourceKey: KeySignature;
  readonly interval: Interval;
  readonly onChange: (interval: Interval) => void;
  readonly disabled?: boolean;
}

const KEY_FIFTHS = Array.from({ length: 15 }, (_, index) => index - 7);

const DIRECTION_LABEL: Readonly<Record<TransposeDirection, string>> = {
  nearest: 'Mais perto',
  up: 'Para cima',
  down: 'Para baixo',
};

/**
 * Transposição por grau (docs/transposicao.md): a pessoa escolhe o tom de destino e a direção,
 * ou anda meio tom por vez. Tudo vira um intervalo; o modelo neutro faz o resto.
 */
export function TransposeControls({
  sourceKey,
  interval,
  onChange,
  disabled = false,
}: TransposeControlsProps) {
  const [direction, setDirection] = useState<TransposeDirection>('nearest');
  const id = useId();
  const targetFifths = sourceKey.fifths + intervalFifths(interval);

  const chooseTarget = (fifths: number, nextDirection = direction) =>
    onChange(intervalBetweenKeys(sourceKey.fifths, fifths, nextDirection));

  const step = (delta: number) => {
    const semitones = interval.semitones + delta;
    if (Math.abs(semitones) > MAX_TRANSPOSE_SEMITONES) return;
    onChange(intervalForSemitones(semitones, sourceKey.fifths));
  };

  const signed = interval.semitones > 0 ? `+${interval.semitones}` : String(interval.semitones);

  return (
    <div className="transpose" role="group" aria-labelledby={`${id}-title`}>
      <p id={`${id}-title`} className="transpose__title">
        Tom original: <strong>{keyName(sourceKey)}</strong>
      </p>

      <div className="transpose__row">
        <label className="transpose__field" htmlFor={`${id}-target`}>
          Transpor para
          <select
            id={`${id}-target`}
            value={targetFifths}
            disabled={disabled}
            onChange={(event) => chooseTarget(Number(event.target.value))}
          >
            {KEY_FIFTHS.map((fifths) => (
              <option key={fifths} value={fifths}>
                {keyName({ fifths, ...(sourceKey.mode ? { mode: sourceKey.mode } : {}) })}
              </option>
            ))}
          </select>
        </label>

        <label className="transpose__field" htmlFor={`${id}-direction`}>
          Direção
          <select
            id={`${id}-direction`}
            value={direction}
            disabled={disabled}
            onChange={(event) => {
              const next = event.target.value as TransposeDirection;
              setDirection(next);
              if (targetFifths !== sourceKey.fifths) chooseTarget(targetFifths, next);
            }}
          >
            {(Object.keys(DIRECTION_LABEL) as TransposeDirection[]).map((value) => (
              <option key={value} value={value}>
                {DIRECTION_LABEL[value]}
              </option>
            ))}
          </select>
        </label>

        <div className="transpose__steps" role="group" aria-label="Meio tom por vez">
          <button
            type="button"
            className="zoom__button"
            disabled={disabled || interval.semitones <= -MAX_TRANSPOSE_SEMITONES}
            onClick={() => step(-1)}
            aria-label="Baixar meio tom"
          >
            −½
          </button>
          <button
            type="button"
            className="zoom__button"
            disabled={disabled || interval.semitones >= MAX_TRANSPOSE_SEMITONES}
            onClick={() => step(1)}
            aria-label="Subir meio tom"
          >
            +½
          </button>
          <button
            type="button"
            className="zoom__reset"
            disabled={disabled || interval.semitones === 0}
            onClick={() => onChange(UNISON)}
          >
            Tom original
          </button>
        </div>
      </div>

      <output className="transpose__result" aria-live="polite">
        {interval.semitones === 0 && interval.steps === 0
          ? 'Sem transposição.'
          : `${intervalName(interval)} (${signed} semitons): ${keyName({
              fifths: targetFifths,
              ...(sourceKey.mode ? { mode: sourceKey.mode } : {}),
            })}.`}
      </output>
    </div>
  );
}
