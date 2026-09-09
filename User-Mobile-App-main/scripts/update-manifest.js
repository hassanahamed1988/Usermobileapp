import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const manifestPath = path.join(__dirname, '../android/app/src/main/AndroidManifest.xml');

if (fs.existsSync(manifestPath)) {
  let manifest = fs.readFileSync(manifestPath, 'utf8');
  
  const permissions = [
    '<uses-permission android:name="android.permission.INTERNET" />',
    '<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />',
    '<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />',
    '<uses-permission android:name="android.permission.CAMERA" />',
    '<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />',
    '<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />',
    '<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />',
    '<uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />',
    '<uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />',
    '<uses-permission android:name="android.permission.READ_MEDIA_VISUAL_USER_SELECTED" />'
  ];

  let changed = false;
  
  permissions.forEach(perm => {
    // Check if permission already exists
    if (!manifest.includes(perm.split('"')[1])) {
      // Insert before <application> tag
      manifest = manifest.replace('<application', `    ${perm}\n    <application`);
      changed = true;
    }
  });

  // Inject usesCleartextTraffic="true" into the <application tag if it's missing
  if (!manifest.includes('android:usesCleartextTraffic="true"')) {
    manifest = manifest.replace('<application', '<application android:usesCleartextTraffic="true"');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(manifestPath, manifest, 'utf8');
    console.log('✅ Successfully injected required permissions into AndroidManifest.xml');
  } else {
    console.log('✅ Permissions already exist in AndroidManifest.xml');
  }
} else {
  console.log('⚠️ AndroidManifest.xml not found. This script should run after "npx cap add android".');
}
