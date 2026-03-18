const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, '../dist/assets/icons');
const OG_DIR = path.join(__dirname, '../dist/assets/og');

const faviconSVG = fs.readFileSync(path.join(ICONS_DIR, 'favicon.svg'));
const ogSVG = fs.readFileSync(path.join(OG_DIR, 'default.svg'));

async function run() {
  await sharp(faviconSVG).resize(16, 16).png().toFile(path.join(ICONS_DIR, 'favicon-16.png'));
  await sharp(faviconSVG).resize(32, 32).png().toFile(path.join(ICONS_DIR, 'favicon-32.png'));
  await sharp(faviconSVG).resize(180, 180).png().toFile(path.join(ICONS_DIR, 'apple-touch-icon.png'));
  await sharp(faviconSVG).resize(192, 192).png().toFile(path.join(ICONS_DIR, 'icon-192.png'));
  await sharp(ogSVG).resize(1200, 630).png().toFile(path.join(OG_DIR, 'default.png'));

  // favicon.ico — copy from 32px PNG
  fs.copyFileSync(
    path.join(ICONS_DIR, 'favicon-32.png'),
    path.join(__dirname, '../dist/favicon.ico')
  );

  console.log('All icons exported successfully.');
}

run().catch(console.error);
