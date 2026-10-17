// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

// WOFF2 subconjuntados por scripts/subset-fonts.ts (se regeneran en predev / prebuild).
const dir = './src/assets/fonts';

export default defineConfig({
  // `site` (dominio) llega en la fase 8.
  devToolbar: { enabled: false },
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Shippori Mincho',
      cssVariable: '--font-serif',
      fallbacks: ['serif'],
      options: {
        variants: [
          { src: [`${dir}/shippori-mincho-400.woff2`], weight: 400, style: 'normal' },
          { src: [`${dir}/shippori-mincho-600.woff2`], weight: 600, style: 'normal' },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'Inter',
      cssVariable: '--font-sans',
      fallbacks: ['sans-serif'],
      options: {
        variants: [
          { src: [`${dir}/inter-400.woff2`], weight: 400, style: 'normal' },
          { src: [`${dir}/inter-500.woff2`], weight: 500, style: 'normal' },
          { src: [`${dir}/inter-600.woff2`], weight: 600, style: 'normal' },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'IBM Plex Mono',
      cssVariable: '--font-mono',
      fallbacks: ['monospace'],
      options: {
        variants: [{ src: [`${dir}/ibm-plex-mono-400.woff2`], weight: 400, style: 'normal' }],
      },
    },
  ],
});
