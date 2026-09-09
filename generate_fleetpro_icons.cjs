const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function run() {
  const sourceImage = 'src/assets/images/fleetpro_premium_logo_road_1784869272959.jpg';
  
  if (!fs.existsSync(sourceImage)) {
    console.error("Source image not found!");
    process.exit(1);
  }

  const iconBuffer = await sharp(sourceImage)
    .resize(1024, 1024, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toBuffer();

  const pathsToUpdate = [
    'assets/icon.png',
    'assets/icon-only.png',
    'assets/logo.png',
    'public/logo.png'
  ];

  for (const p of pathsToUpdate) {
    fs.writeFileSync(p, iconBuffer);
    console.log(`Updated ${p}`);
  }
}

run().catch(console.error);
