const sharp = require('sharp');
const fs = require('fs');

async function run() {
  const svgBuffer = fs.readFileSync('public/logo.svg');
  
  if (!fs.existsSync('public/icons')) fs.mkdirSync('public/icons');
  
  const sizes = [48, 72, 96, 128, 144, 192, 256, 512];
  
  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(`public/icons/icon-${size}.png`);
    console.log(`Generated icon-${size}.png`);
  }
}

run().catch(console.error);
