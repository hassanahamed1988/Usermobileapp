const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function run() {
  const logo = 'public/logo.png';
  
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
    
    await sharp(logo)
      .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(path.join(dir, 'ic_launcher.png'));
      
    await sharp(logo)
      .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(path.join(dir, 'ic_launcher_round.png'));
  }
  
  for (const [folder, size] of Object.entries(bgForegroundSizes)) {
    const dir = path.join('android/app/src/main/res', folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    // background (pure white, since the truck is colorful, a white background is safe)
    await sharp({
      create: { width: size, height: size, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } }
    }).png().toFile(path.join(dir, 'ic_launcher_background.png'));
    
    // foreground (padded slightly)
    const fgSize = Math.round(size * 0.7);
    const fgBuffer = await sharp(logo)
      .resize(fgSize, fgSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .toBuffer();
      
    await sharp({
      create: { width: size, height: size, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 0 } }
    }).composite([{ input: fgBuffer, gravity: 'center' }])
      .png()
      .toFile(path.join(dir, 'ic_launcher_foreground.png'));
  }
  
  console.log('Fixed Android icons generated successfully');
}

run().catch(console.error);
