export type Stage = 'idle' | 'reading' | 'rendering' | 'ready' | 'error';

export interface ViewerStatus {
  readonly stage: Stage;
  readonly message: string;
  readonly warnings: readonly string[];
}

const LABEL: Readonly<Record<Stage, string>> = {
  idle: 'Aguardando',
  reading: 'Lendo',
  rendering: 'Renderizando',
  ready: 'Pronto',
  error: 'Erro',
};

/**
 * Estados de UX do PRD: vazio, carregando, sucesso, sucesso com avisos e erro.
 *
 * `rendering` separa "o arquivo foi lido" de "a partitura apareceu": o OSMD desenha depois do parse, e
 * sem esse estado o status prometia sucesso com a tela ainda vazia (tarefa 3.2).
 */
export function StatusBar({ status }: { readonly status: ViewerStatus }) {
  return (
    // RNF-07: o erro interrompe o leitor de tela; os demais estados esperam a fala atual terminar.
    <div
      className={`status status--${status.stage}`}
      role="status"
      aria-live={status.stage === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
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
