import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const file of fs.readdirSync(src)) {
    fs.copyFileSync(path.join(src, file), path.join(dest, file));
  }
}

export default defineConfig({
  root: '.',
  plugins: [
    {
      name: 'copy-static-scripts',
      closeBundle() {
        copyDir('js', 'dist/js');
        if (fs.existsSync('audio')) copyDir('audio', 'dist/audio');
        if (fs.existsSync('images')) copyDir('images', 'dist/images');
      },
    },
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
  },
});
