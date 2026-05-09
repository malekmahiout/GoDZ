const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const INPUT_DIR = './screenshots';
const OUTPUT_DIR = './screenshots-fixed';
const TARGET_W = 1080;
const TARGET_H = 1920;

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

const files = fs.readdirSync(INPUT_DIR).filter(f => /\.(png|jpg|jpeg)$/i.test(f));

Promise.all(files.map(async file => {
  const input = path.join(INPUT_DIR, file);
  const output = path.join(OUTPUT_DIR, file.replace(/\.(jpg|jpeg)$/i, '.png'));
  const meta = await sharp(input).metadata();

  // detect orientation from original
  const isLandscape = meta.width > meta.height;
  const w = isLandscape ? TARGET_H : TARGET_W;
  const h = isLandscape ? TARGET_W : TARGET_H;

  await sharp(input)
    .resize(w, h, { fit: 'cover', position: 'centre' })
    .png()
    .toFile(output);

  console.log(`${file} → ${w}×${h} → ${path.basename(output)}`);
})).then(() => console.log('\nTerminé. Fichiers dans screenshots-fixed/'));
