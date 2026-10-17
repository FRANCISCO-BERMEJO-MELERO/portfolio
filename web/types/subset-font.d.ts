// Tipos mínimos de subset-font 2 (el paquete no los publica) para lo que usa scripts/subset-fonts.ts.
declare module 'subset-font' {
  interface Options {
    targetFormat?: 'sfnt' | 'truetype' | 'woff' | 'woff2';
    variationAxes?: Record<string, number | { min: number; max: number; default?: number }>;
  }
  export default function subsetFont(font: Buffer | Uint8Array, text: string, options?: Options): Promise<Buffer>;
}
