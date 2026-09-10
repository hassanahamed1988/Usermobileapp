const fs = require('fs');
let content = fs.readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8');

const perms = `
    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-feature android:name="android.hardware.location.gps" android:required="false" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.READ_CONTACTS" />
    <uses-permission android:name="android.permission.USE_BIOMETRIC" />
`;

content = content.replace(/<!-- Permissions -->\s*<uses-permission android:name="android\.permission\.INTERNET" \/>/, perms);
fs.writeFileSync('android/app/src/main/AndroidManifest.xml', content);
