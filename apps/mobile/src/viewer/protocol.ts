/** Mensagens da ponte React Native ↔ WebView. Só dados tipados, nunca HTML. */

export interface RenderMessage {
  readonly type: 'render';
  readonly musicXml: string;
  readonly label: string;
  readonly zoom: number;
  /** Fração de rolagem a restaurar depois de redesenhar (0 a 1). */
  readonly scrollRatio?: number;
}

export interface ZoomMessage {
  readonly type: 'zoom';
  readonly zoom: number;
}

export type ViewerInboundMessage = RenderMessage | ZoomMessage;

export type ViewerOutboundMessage =
  | { readonly type: 'ready' }
  | { readonly type: 'rendered'; readonly pageCount: number }
  | { readonly type: 'scroll'; readonly ratio: number }
  | { readonly type: 'error'; readonly message: string };

/**
 * `JSON.stringify` não escapa U+2028/U+2029, que quebram um script injetado no Android.
 * A substituição mantém a string válida em JavaScript.
 */
export function serializeViewerMessage(message: ViewerInboundMessage): string {
  return JSON.stringify(message)
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
