const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function syncApiKeyToFirestore() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log('No GEMINI_API_KEY in environment, skipping Firestore REST sync.');
    return;
  }

  console.log('Syncing GEMINI_API_KEY to Firestore config/gemini via REST API...');
  const url = 'https://firestore.googleapis.com/v1/projects/fleetpromanager-1991/databases/fleetpromanager/documents/config/gemini?updateMask.fieldPaths=apiKey';
  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          apiKey: { stringValue: apiKey }
        }
      })
    });
    const data = await response.json();
    if (data && data.name) {
      console.log('Successfully synced GEMINI_API_KEY to Firestore!');
    } else {
      console.warn('Firestore REST API response did not indicate success:', JSON.stringify(data));
    }
  } catch (err) {
    console.error('Failed to sync GEMINI_API_KEY to Firestore via REST API:', err);
  }
}

function printServiceAccountSetupInstructions() {
  console.log('\n================================================================================');
  console.log('🔑 HOW TO SET UP YOUR FIREBASE SERVICE ACCOUNT IN GITHUB SECRETS:');
  console.log('================================================================================');
  console.log('1. Go to Google Cloud Console (https://console.cloud.google.com).');
  console.log('2. Select your project: fleetpromanager-1991');
  console.log('3. Navigate to "IAM & Admin" > "Service Accounts".');
  console.log('4. Select or create a service account with the following roles:');
  console.log('   - Firebase Admin');
  console.log('   - API Keys Viewer');
  console.log('   - Cloud Functions Developer');
  console.log('   - Service Account User');
  console.log('5. Click on the service account, go to the "Keys" tab, and click "Add Key" > "Create new key" (JSON format).');
  console.log('6. Open the downloaded JSON file and copy its ENTIRE contents.');
  console.log('7. Go to your GitHub repository:');
  console.log('   Settings > Secrets and variables > Actions.');
  console.log('8. Click "New repository secret".');
  console.log('9. Set the Name to exactly:');
  console.log('   FIREBASE_SERVICE_ACCOUNT_FLEETPROMANAGER_1991');
  console.log('10. Paste the ENTIRE JSON contents into the Secret field and save.');
  console.log('11. Re-run your GitHub workflow to deploy successfully!');
  console.log('================================================================================\n');
}

async function main() {
  // 1. Sync Key to Firestore
  await syncApiKeyToFirestore();

  // Validate GOOGLE_APPLICATION_CREDENTIALS
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credentialsPath) {
    console.error('Error: GOOGLE_APPLICATION_CREDENTIALS environment variable is not set.');
    console.error('Please make sure it is exported in your workflow run step.');
    process.exit(1);
  }

  if (!fs.existsSync(credentialsPath)) {
    console.error(`Error: Credentials file not found at path: ${credentialsPath}`);
    printServiceAccountSetupInstructions();
    process.exit(1);
  }

  const credentialsContent = fs.readFileSync(credentialsPath, 'utf8').trim();
  if (!credentialsContent) {
    console.error(`Error: Credentials file at ${credentialsPath} is empty.`);
    printServiceAccountSetupInstructions();
    process.exit(1);
  }

  try {
    const parsedCreds = JSON.parse(credentialsContent);
    if (!parsedCreds.project_id || !parsedCreds.private_key) {
      console.error(`Error: Credentials file at ${credentialsPath} does not appear to be a valid Google Service Account JSON key.`);
      console.error('It must contain "project_id" and "private_key" fields.');
      printServiceAccountSetupInstructions();
      process.exit(1);
    }
    console.log(`Successfully verified service account credentials for project: ${parsedCreds.project_id}`);
  } catch (err) {
    console.error(`Error: Failed to parse credentials file at ${credentialsPath} as JSON.`);
    console.error('Details:', err.message);
    printServiceAccountSetupInstructions();
    process.exit(1);
  }

  // 2. Write key to functions/.env so it is deployed as environment variable
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const envFilePath = path.join(__dirname, '../functions/.env');
      console.log(`Writing GEMINI_API_KEY to ${envFilePath}`);
      fs.writeFileSync(envFilePath, `GEMINI_API_KEY=${apiKey}\n`);
    } catch (err) {
      console.error('Failed to write functions/.env file:', err);
    }
  }

  // 3. Execute the deployment
  const args = [
    'firebase-tools',
    'deploy',
    '--only',
    'hosting,functions',
    '--project',
    'fleetpromanager-1991',
    '--non-interactive',
    '--force'
  ];

  console.log(`Running deployment: npx ${args.join(' ')}`);

  // Execute the command
  const result = spawnSync('npx', args, { 
    encoding: 'utf8', 
    shell: true,
    stdio: 'pipe' // Capture both stdout and stderr
  });

  // Output stdout and stderr
  console.log(result.stdout || '');
  console.error(result.stderr || '');

  const exitCode = result.status;
  if (exitCode === 0) {
    console.log('Deployment completed successfully with code 0!');
    process.exit(0);
  }

  const fullOutput = (result.stdout || '') + '\n' + (result.stderr || '');

  // Check if the error is the Artifact Registry cleanup policy issue
  const hasCleanupWarning = fullOutput.includes('could not set up cleanup policy') || 
                             fullOutput.includes('cleanup policy');
  const hasSuccessfulDeploy = fullOutput.includes('Functions successfully deployed') || 
                               fullOutput.includes('Skipping the deploy of unchanged functions') ||
                               fullOutput.includes('Skipped (No changes detected)');

  if (hasCleanupWarning && hasSuccessfulDeploy) {
    console.log('\n--------------------------------------------------');
    console.log('WARNING: Artifact Registry cleanup policy could not be set up, but the Functions and Hosting were successfully deployed.');
    console.log('Ignoring the warning and exiting with success code 0.');
    console.log('--------------------------------------------------\n');
    process.exit(0);
  }

  console.error(`Deployment failed with exit code: ${exitCode}`);
  process.exit(exitCode || 1);
}

main();
