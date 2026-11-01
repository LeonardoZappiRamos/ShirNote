import { useId, useRef, useState } from 'react';

interface FileUploaderProps {
  readonly onFile: (file: File) => void;
  readonly disabled?: boolean;
}

/** RF-01: seleção por diálogo ou arrastar e soltar, restrita a `.enc`. */
export function FileUploader({ onFile, disabled = false }: FileUploaderProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const pick = (file: File | undefined) => {
    if (file) onFile(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div
      className={`uploader${dragging ? ' uploader--dragging' : ''}`}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (!disabled) pick(event.dataTransfer.files[0]);
      }}
    >
      <label className="uploader__button" htmlFor={inputId}>
        Selecionar arquivo .enc
      </label>
      <input
        ref={inputRef}
        id={inputId}
        className="uploader__input"
        type="file"
        accept=".enc"
        disabled={disabled}
        onChange={(event) => pick(event.target.files?.[0])}
      />
      <p className="uploader__hint">ou arraste o arquivo para esta área</p>
    </div>
  );
}
