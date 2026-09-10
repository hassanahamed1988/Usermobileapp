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
    
    // background (solid matching blue)
    await sharp({
      create: { width: size, height: size, channels: 4, background: { r: 11, g: 87, b: 208, alpha: 1 } } // #0b57d0
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
  
  // Ensure mipmap-anydpi-v26 exists and contains correct adaptive XMLs
  const anydpiDir = 'android/app/src/main/res/mipmap-anydpi-v26';
  if (!fs.existsSync(anydpiDir)) fs.mkdirSync(anydpiDir, { recursive: true });

  const xmlContent = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>`;

  fs.writeFileSync(path.join(anydpiDir, 'ic_launcher.xml'), xmlContent);
  fs.writeFileSync(path.join(anydpiDir, 'ic_launcher_round.xml'), xmlContent);

  // Ensure values directory exists and contains correct ic_launcher_background color resource
  const valuesDir = 'android/app/src/main/res/values';
  if (!fs.existsSync(valuesDir)) fs.mkdirSync(valuesDir, { recursive: true });

  const colorContent = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#0b57d0</color>
</resources>`;

  fs.writeFileSync(path.join(valuesDir, 'ic_launcher_background.xml'), colorContent);
  
  console.log('Fixed Android icons generated successfully');
}

run().catch(console.error);
