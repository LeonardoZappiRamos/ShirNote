import { useId, useState } from 'react';
import {
  MAX_TRANSPOSE_SEMITONES,
  OCTAVE,
  UNISON,
  WRITTEN_FOR,
  addIntervals,
  intervalBetweenKeys,
  intervalFifths,
  intervalForSemitones,
  intervalName,
  keyName,
  soundingFifths,
  type Interval,
  type KeySignature,
  type TransposeDirection,
  type WrittenFor,
} from '../music';

interface TransposeControlsProps {
  /** Armação de origem, da primeira parte. */
  readonly sourceKey: KeySignature;
  readonly interval: Interval;
  readonly onChange: (interval: Interval) => void;
  /** Troca dobrados pela nota simples de mesmo som (docs/transposicao.md, regra 7). */
  readonly simplifyDoubles: boolean;
  readonly onSimplifyDoublesChange: (value: boolean) => void;
  readonly disabled?: boolean;
}

const KEY_FIFTHS = Array.from({ length: 15 }, (_, index) => index - 7);

/** Sem instrumento transpositor: o escrito é o que soa. */
const CONCERT: WrittenFor = WRITTEN_FOR[0] ?? { id: 'C', label: 'Dó', fifths: 0 };

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
  simplifyDoubles,
  onSimplifyDoublesChange,
  disabled = false,
}: TransposeControlsProps) {
  const [direction, setDirection] = useState<TransposeDirection>('nearest');
  const [writtenFor, setWrittenFor] = useState<WrittenFor>(CONCERT);
  const id = useId();
  const targetFifths = sourceKey.fifths + intervalFifths(interval);

  /** Nome da tonalidade escrita e, se o instrumento transpõe, a que soa. */
  const describeKey = (fifths: number) => {
    const mode = sourceKey.mode ? { mode: sourceKey.mode } : {};
    const written = keyName({ fifths, ...mode });
    if (writtenFor.fifths === 0) return written;
    return `${written}, soa ${keyName({ fifths: soundingFifths(fifths, writtenFor), ...mode })}`;
  };

  const chooseTarget = (fifths: number, nextDirection = direction) =>
    onChange(intervalBetweenKeys(sourceKey.fifths, fifths, nextDirection));

  const step = (delta: number) => {
    const semitones = interval.semitones + delta;
    if (Math.abs(semitones) > MAX_TRANSPOSE_SEMITONES) return;
    onChange(intervalForSemitones(semitones, sourceKey.fifths));
  };

  // Oitava a critério de quem toca: a extensão do instrumento decide (docs/transposicao.md).
  const shiftOctave = (sign: 1 | -1) => {
    const next = addIntervals(interval, {
      steps: sign * OCTAVE.steps,
      semitones: sign * OCTAVE.semitones,
    });
    if (Math.abs(next.semitones) <= MAX_TRANSPOSE_SEMITONES) onChange(next);
  };

  const tritone = direction === 'nearest' && Math.abs(interval.semitones) === 6;

  const signed = interval.semitones > 0 ? `+${interval.semitones}` : String(interval.semitones);

  return (
    <div className="transpose" role="group" aria-labelledby={`${id}-title`}>
      <p id={`${id}-title`} className="transpose__title">
        Tom original: <strong>{describeKey(sourceKey.fifths)}</strong>
      </p>

      <div className="transpose__row">
        <label className="transpose__field" htmlFor={`${id}-written-for`}>
          Escrita para
          <select
            id={`${id}-written-for`}
            value={writtenFor.id}
            disabled={disabled}
            onChange={(event) =>
              setWrittenFor(
                WRITTEN_FOR.find((option) => option.id === event.target.value) ?? CONCERT,
              )
            }
          >
            {WRITTEN_FOR.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

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
                {describeKey(fifths)}
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
            className="zoom__button"
            disabled={disabled || interval.semitones - 12 < -MAX_TRANSPOSE_SEMITONES}
            onClick={() => shiftOctave(-1)}
          >
            8ª abaixo
          </button>
          <button
            type="button"
            className="zoom__button"
            disabled={disabled || interval.semitones + 12 > MAX_TRANSPOSE_SEMITONES}
            onClick={() => shiftOctave(1)}
          >
            8ª acima
          </button>
          <button
            type="button"
            className="zoom__reset"
            disabled={disabled || (interval.semitones === 0 && interval.steps === 0)}
            onClick={() => onChange(UNISON)}
          >
            Tom original
          </button>
        </div>
      </div>

      <label className="transpose__check">
        <input
          type="checkbox"
          checked={simplifyDoubles}
          disabled={disabled}
          onChange={(event) => onSimplifyDoublesChange(event.target.checked)}
        />
        Simplificar dobrados (ex.: si dobrado bemol vira lá)
      </label>

      <output className="transpose__result" aria-live="polite">
        {interval.semitones === 0 && interval.steps === 0
          ? 'Sem transposição.'
          : `${intervalName(interval)} (${signed} semitons): ${describeKey(targetFifths)}.`}
        {tritone
          ? ' Trítono: a mesma distância para os dois lados. Escolha "Para cima" ou "Para baixo" conforme a extensão do instrumento.'
          : ''}
      </output>
    </div>
  );
}
