# XSD do MusicXML 4.0

Cópia de `schema/` do repositório [w3c/musicxml](https://github.com/w3c/musicxml/tree/v4.0/schema),
tag `v4.0`, usada por `src/musicxml/schema.test.ts` para validar o MusicXML gerado (RF-08).

Única alteração: em `musicxml.xsd`, os `xs:import` apontam para `xml.xsd` e `xlink.xsd` locais, em
vez de `http://www.musicxml.org/xsd/`, porque o validador (`xmllint-wasm`) não faz acesso à rede.

Licença: [W3C Community Final Specification Agreement](https://www.w3.org/community/about/agreements/final/).
