const sharp = require('sharp');
const fs = require('fs');

async function run() {
  const logo = 'public/logo.png';
  
  // Create Android Icons
  const sizes = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192
  };
  
  for (const [folder, size] of Object.entries(sizes)) {
    const dir = `android/app/src/main/res/${folder}`;
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    // Using alpha: 0 ensures that if the image isn't perfectly square, 
    // the padded area will be transparent instead of default black.
    await sharp(logo)
      .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .toFile(`${dir}/ic_launcher.png`);
      
    await sharp(logo)
      .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .toFile(`${dir}/ic_launcher_round.png`);
  }
  
  console.log('Android icons updated successfully with transparent padding');
}

run().catch(console.error);
