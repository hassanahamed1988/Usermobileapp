const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function run() {
  const svgBuffer = fs.readFileSync('public/logo.svg');

  console.log("Generating public/logo.png...");
  await sharp(svgBuffer)
    .resize(1024, 1024)
    .png()
    .toFile('public/logo.png');

  console.log("Generating assets/icon.png...");
  if (!fs.existsSync('assets')) fs.mkdirSync('assets');
  await sharp(svgBuffer)
    .resize(1024, 1024)
    .png()
    .toFile('assets/icon.png');
  await sharp(svgBuffer)
    .resize(1024, 1024)
    .png()
    .toFile('assets/logo.png');
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile('assets/icon-only.png');

  console.log("Generating Android Icons...");
  
  const sizes = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192
  };

  const bgForegroundSizes = {
    'mipmap-mdpi': 108,
    'mipmap-hdpi': 162,
    'mipmap-xhdpi': 216,
    'mipmap-xxhdpi': 324,
    'mipmap-xxxhdpi': 432
  };

  for (const [folder, size] of Object.entries(sizes)) {
    const dir = path.join('android/app/src/main/res', folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    await sharp(svgBuffer)
      .resize(size, size, { fit: 'contain' })
      .png()
      .toFile(path.join(dir, 'ic_launcher.png'));

    await sharp(svgBuffer)
      .resize(size, size, { fit: 'contain' })
      .png()
      .toFile(path.join(dir, 'ic_launcher_round.png'));
  }

  for (const [folder, size] of Object.entries(bgForegroundSizes)) {
    const dir = path.join('android/app/src/main/res', folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // background (pure white)
    await sharp({
      create: { width: size, height: size, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } }
    }).png().toFile(path.join(dir, 'ic_launcher_background.png'));

    // foreground (padded slightly)
    const fgSize = Math.round(size * 0.65);
    const fgBuffer = await sharp(svgBuffer)
      .resize(fgSize, fgSize, { fit: 'contain' })
      .toBuffer();

    await sharp({
      create: { width: size, height: size, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 0 } }
    }).composite([{ input: fgBuffer, gravity: 'center' }])
      .png()
      .toFile(path.join(dir, 'ic_launcher_foreground.png'));
  }

  console.log("Done generating all icons from SVG!");
}

run().catch(console.error);
