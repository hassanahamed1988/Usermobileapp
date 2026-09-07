const sharp = require('sharp');
const fs = require('fs');

const sizes = [48, 72, 96, 128, 144, 192, 256, 512];
const inputFile = 'logo.png';
const outputDir = 'public/icons';

if (!fs.existsSync(outputDir)){
    fs.mkdirSync(outputDir, { recursive: true });
}

fs.copyFileSync(inputFile, 'public/logo.png');

async function generateIcons() {
  for (const size of sizes) {
    await sharp(inputFile)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .toFile(`${outputDir}/icon-${size}.png`);
    console.log(`Generated icon-${size}.png`);
  }
}

generateIcons().then(() => console.log('All icons generated successfully!')).catch(err => {
    console.error('Error generating icons:', err);
    process.exit(1);
});
