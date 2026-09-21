import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        kontakt: resolve(__dirname, 'kontakt.html'),
        projekte: resolve(__dirname, 'projekte.html'),
        impressum: resolve(__dirname, 'impressum.html'),
        datenschutz: resolve(__dirname, 'datenschutz.html'),
        blogGoogleSichtbarkeit: resolve(__dirname, 'blog/google-sichtbarkeit-unternehmen/index.html'),
        blogWebsiteFehler: resolve(__dirname, 'blog/website-fehler-kunden-verlust/index.html'),
        blogModerneWebsite: resolve(__dirname, 'blog/moderne-website-vertrauen/index.html'),
        blogGoogleRanking: resolve(__dirname, 'blog/einfacher-weg-bei-google-hoeher-zu-ranken/index.html'),
        blogWozuGoogle: resolve(__dirname, 'blog/wozu-eigentlich-bei-google-ganz-oben/index.html'),
        blogStarkeMarkeOwl: resolve(__dirname, 'blog/wie-bauen-unternehmer-in-owl-eine-starke-marke-auf/index.html'),
      },
    },
  },
});
