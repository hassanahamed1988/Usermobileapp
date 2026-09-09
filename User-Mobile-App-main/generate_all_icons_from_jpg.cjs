const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function run() {
  const sourceImage = 'src/assets/images/fleetpro_premium_logo_road_1784869272959.jpg';
  
  if (!fs.existsSync(sourceImage)) {
    console.error("Source image not found!");
    process.exit(1);
  }

  // Ensure it's a square image by padding it or fit: 'contain'
  const imgBuffer = await sharp(sourceImage)
    .resize(1024, 1024, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toBuffer();

  console.log("Generating public/logo.png...");
  fs.writeFileSync('public/logo.png', imgBuffer);

  console.log("Generating assets/icon.png...");
  if (!fs.existsSync('assets')) fs.mkdirSync('assets');
  fs.writeFileSync('assets/icon.png', imgBuffer);
  fs.writeFileSync('assets/logo.png', imgBuffer);
  
  const iconOnlyBuffer = await sharp(sourceImage)
    .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toBuffer();
  fs.writeFileSync('assets/icon-only.png', iconOnlyBuffer);

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

    await sharp(imgBuffer)
      .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(path.join(dir, 'ic_launcher.png'));

    await sharp(imgBuffer)
      .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
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
    const fgBuffer = await sharp(imgBuffer)
      .resize(fgSize, fgSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .toBuffer();

    await sharp({
      create: { width: size, height: size, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 0 } }
    }).composite([{ input: fgBuffer, gravity: 'center' }])
      .png()
      .toFile(path.join(dir, 'ic_launcher_foreground.png'));
  }

  console.log("Done generating all icons!");
}

run().catch(console.error);
