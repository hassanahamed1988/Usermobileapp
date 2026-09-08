const fs = require('fs');
const path = require('path');

const content = {
  "project_info": {
    "project_number": "1070292426921",
    "project_id": "fleetpromanager-1991",
    "storage_bucket": "fleetpromanager-1991.firebasestorage.app"
  },
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": "1:1070292426921:android:com.transportmanager.app",
        "android_client_info": {
          "package_name": "com.transportmanager.app"
        }
      },
      "oauth_client": [
        {
          "client_id": "1070292426921-qhasb3cm3v3skiqobdhfgpopk1c5rpb9.apps.googleusercontent.com",
          "client_type": 3
        }
      ],
      "api_key": [
        {
          "current_key": "AIzaSyAWqkAdzqXwPql2FnSKy6dOutDHLUx7CcY"
        }
      ],
      "services": {
        "appinvite_service": {
          "other_platform_oauth_client": []
        }
      }
    }
  ],
  "configuration_version": "1"
};

const dirs = [
  path.join(__dirname, '../android/app'),
  path.join(__dirname, '../android/app/src/debug'),
  path.join(__dirname, '../android/app/src/release')
];

dirs.forEach(dir => {
  // Create directory if it doesn't exist
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (e) {
      console.log(`Could not create ${dir}`);
    }
  }
  
  if (fs.existsSync(dir)) {
    const filePath = path.join(dir, 'google-services.json');
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
    console.log(`Generated ${filePath}`);
  }
});
