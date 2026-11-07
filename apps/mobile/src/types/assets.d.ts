/** O Metro transforma o HTML gerado em um módulo de asset (número). */
declare module '*.html' {
  const asset: number;
  export default asset;
}
