const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SOURCE = path.join(__dirname, 'android/app/src/Photos/Accueil/icone.png');

const configs = [
  { dir: 'mipmap-mdpi',    size: 48,  fgSize: 108 },
  { dir: 'mipmap-hdpi',    size: 72,  fgSize: 162 },
  { dir: 'mipmap-xhdpi',   size: 96,  fgSize: 216 },
  { dir: 'mipmap-xxhdpi',  size: 144, fgSize: 324 },
  { dir: 'mipmap-xxxhdpi', size: 192, fgSize: 432 },
];

async function generate() {
  for (const cfg of configs) {
    const base = path.join(__dirname, 'android/app/src/main/res', cfg.dir);

    await sharp(SOURCE).resize(cfg.size, cfg.size).toFile(path.join(base, 'ic_launcher.png'));
    await sharp(SOURCE).resize(cfg.size, cfg.size).toFile(path.join(base, 'ic_launcher_round.png'));
    await sharp(SOURCE).resize(cfg.fgSize, cfg.fgSize).toFile(path.join(base, 'ic_launcher_foreground.png'));

    console.log(`✓ ${cfg.dir}: ${cfg.size}px (fg: ${cfg.fgSize}px)`);
  }

  // favicon
  await sharp(SOURCE).resize(512, 512).toFile(path.join(__dirname, 'src/assets/icon/favicon.png'));
  console.log('✓ favicon.png (512px)');
}

generate().catch(console.error);
