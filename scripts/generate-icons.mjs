import sharp from 'sharp'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ICONS_DIR = join(__dirname, '..', 'public', 'icons')
mkdirSync(ICONS_DIR, { recursive: true })

// Pata de pantera centralizada em viewBox 512x512:
// - 1 pad central (footpad) — elipse grande
// - 4 toe pads acima — círculos/elipses menores arranjados em arco
const PAW_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#AA00FF"/>

  <!-- Footpad central -->
  <ellipse cx="256" cy="340" rx="100" ry="85" fill="#FFFFFF"/>

  <!-- Toe pad 1 (interno esquerdo) -->
  <ellipse cx="172" cy="210" rx="38" ry="48" fill="#FFFFFF"/>

  <!-- Toe pad 2 (externo esquerdo) -->
  <ellipse cx="100" cy="270" rx="34" ry="42" fill="#FFFFFF"/>

  <!-- Toe pad 3 (interno direito) -->
  <ellipse cx="340" cy="210" rx="38" ry="48" fill="#FFFFFF"/>

  <!-- Toe pad 4 (externo direito) -->
  <ellipse cx="412" cy="270" rx="34" ry="42" fill="#FFFFFF"/>
</svg>`

const svgBuffer = Buffer.from(PAW_SVG)

// Salvar SVG fonte (para referência futura)
writeFileSync(join(ICONS_DIR, 'icon.svg'), PAW_SVG)

// Gerar PNGs nos dois tamanhos
await sharp(svgBuffer).resize(192, 192).png().toFile(join(ICONS_DIR, 'icon-192.png'))
await sharp(svgBuffer).resize(512, 512).png().toFile(join(ICONS_DIR, 'icon-512.png'))

console.log('Ícones gerados:')
console.log('  public/icons/icon.svg    (fonte)')
console.log('  public/icons/icon-192.png (192x192)')
console.log('  public/icons/icon-512.png (512x512)')
