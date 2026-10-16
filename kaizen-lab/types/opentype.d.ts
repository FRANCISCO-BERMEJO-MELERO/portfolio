// Tipos mínimos de opentype.js 2 (el paquete no los publica) para lo que usa el build.
declare module 'opentype.js' {
  namespace opentype {
    type PathCommand =
      | { type: 'M' | 'L'; x: number; y: number }
      | { type: 'Q'; x1: number; y1: number; x: number; y: number }
      | { type: 'C'; x1: number; y1: number; x2: number; y2: number; x: number; y: number }
      | { type: 'Z' };
    interface BoundingBox {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    }
    interface Path {
      commands: PathCommand[];
    }
    interface Glyph {
      advanceWidth: number;
      getBoundingBox(): BoundingBox;
      getPath(x: number, y: number, fontSize: number): Path;
    }
    interface Font {
      unitsPerEm: number;
      tables: { hhea: { ascender: number; descender: number } };
      charToGlyph(char: string): Glyph;
    }
  }
  const opentype: { parse(buffer: ArrayBuffer | Uint8Array): opentype.Font };
  export default opentype;
}
