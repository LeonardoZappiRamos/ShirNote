const INDENT = '  ';

export interface XmlElement {
  readonly tag: string;
  readonly attributes?: Readonly<Record<string, string>>;
  readonly children?: readonly XmlNode[];
  /** Conteúdo textual do elemento (mutuamente exclusivo com `children`). */
  readonly text?: string;
}

export type XmlNode = XmlElement | string;

const XML_ENTITIES: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};

export function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => XML_ENTITIES[character] ?? character);
}

/** Serializa a árvore com indentação de 2 espaços e quebra de linha final. */
export function serializeXml(root: XmlElement, header?: string): string {
  const body = serializeElement(root, 0);
  return header ? `${header}\n${body}\n` : `${body}\n`;
}

function serializeElement(element: XmlElement, depth: number): string {
  const padding = INDENT.repeat(depth);
  const attributes = Object.entries(element.attributes ?? {})
    .map(([name, value]) => ` ${name}="${escapeXml(value)}"`)
    .join('');
  const open = `<${element.tag}${attributes}`;

  if (element.text !== undefined) {
    return `${padding}${open}>${escapeXml(element.text)}</${element.tag}>`;
  }

  if (!element.children || element.children.length === 0) {
    return `${padding}${open}/>`;
  }

  const children = element.children
    .map((child) =>
      typeof child === 'string'
        ? `${INDENT.repeat(depth + 1)}${escapeXml(child)}`
        : serializeElement(child, depth + 1),
    )
    .join('\n');

  return `${padding}${open}>\n${children}\n${padding}</${element.tag}>`;
}
