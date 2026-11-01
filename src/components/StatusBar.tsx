export type Stage = 'idle' | 'reading' | 'ready' | 'error';

export interface ViewerStatus {
  readonly stage: Stage;
  readonly message: string;
  readonly warnings: readonly string[];
}

const LABEL: Readonly<Record<Stage, string>> = {
  idle: 'Aguardando',
  reading: 'Lendo',
  ready: 'Pronto',
  error: 'Erro',
};

/** Estados de UX do PRD: vazio, carregando, sucesso, sucesso com avisos e erro. */
export function StatusBar({ status }: { readonly status: ViewerStatus }) {
  return (
    <div className={`status status--${status.stage}`} role="status" aria-live="polite">
      <p className="status__badge">{LABEL[status.stage]}</p>
      <p className="status__message">{status.message}</p>
      {status.warnings.length > 0 ? (
        <ul className="status__warnings">
          {status.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
