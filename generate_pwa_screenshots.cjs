const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const mobileSvg = `
<svg width="1080" height="1920" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#00838f;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#grad)" />
  
  <!-- Outer Device Mockup -->
  <rect x="90" y="160" width="900" height="1600" rx="80" fill="#1e293b" stroke="#334155" stroke-width="8" />
  <!-- Screen Area -->
  <rect x="120" y="220" width="840" height="1480" rx="40" fill="#0b0f19" />
  
  <!-- Notch -->
  <rect x="440" y="235" width="200" height="40" rx="20" fill="#1e293b" />
  
  <!-- UI Mockup Inside Screen -->
  <!-- Top Bar -->
  <rect x="150" y="320" width="240" height="40" rx="10" fill="#00bcd4" opacity="0.15" />
  <text x="170" y="345" font-family="sans-serif" font-size="18" font-weight="bold" fill="#00bcd4">Fleetpro Active</text>
  
  <circle cx="810" cy="340" r="15" fill="#38bdf8" />
  <circle cx="850" cy="340" r="15" fill="#10b981" />
  
  <!-- Header Text -->
  <text x="150" y="450" font-family="sans-serif" font-size="44" font-weight="900" fill="#ffffff">Fleet &amp; Expenses</text>
  <text x="150" y="500" font-family="sans-serif" font-size="22" font-weight="bold" fill="#00bcd4">REAL-TIME TRACKER &amp; ANALYTICS</text>
  
  <!-- Dashboard Card 1 -->
  <rect x="150" y="560" width="780" height="260" rx="24" fill="#1e293b" stroke="#00bcd4" stroke-width="2" />
  <text x="190" y="620" font-family="sans-serif" font-size="20" font-weight="bold" fill="#94a3b8">ACTIVE TRIPS</text>
  <text x="190" y="690" font-family="sans-serif" font-size="54" font-weight="900" fill="#ffffff">12 Active</text>
  <text x="190" y="750" font-family="sans-serif" font-size="18" font-weight="bold" fill="#10b981">↑ 4 new trips dispatched today</text>
  
  <!-- Dashboard Card 2 -->
  <rect x="150" y="850" width="780" height="260" rx="24" fill="#1e293b" />
  <text x="190" y="910" font-family="sans-serif" font-size="20" font-weight="bold" fill="#94a3b8">TOTAL FUEL EXPENSES</text>
  <text x="190" y="980" font-family="sans-serif" font-size="54" font-weight="900" fill="#00bcd4">$4,850.00</text>
  <text x="190" y="1040" font-family="sans-serif" font-size="18" font-weight="bold" fill="#94a3b8">For June 2026 • 24 Transactions</text>
  
  <!-- Mini Lists / Logs -->
  <text x="150" y="1170" font-family="sans-serif" font-size="24" font-weight="bold" fill="#ffffff">Recent Trip Logs</text>
  
  <rect x="150" y="1210" width="780" height="100" rx="16" fill="#0f172a" />
  <text x="180" y="1270" font-family="sans-serif" font-size="20" font-weight="bold" fill="#ffffff">Trip #4012 - Port to Warehouse</text>
  <text x="830" y="1270" font-family="sans-serif" font-size="20" font-weight="bold" fill="#10b981">Done</text>
  
  <rect x="150" y="1330" width="780" height="100" rx="16" fill="#0f172a" />
  <text x="180" y="1390" font-family="sans-serif" font-size="20" font-weight="bold" fill="#ffffff">Trip #4013 - City Delivery</text>
  <text x="800" y="1390" font-family="sans-serif" font-size="20" font-weight="bold" fill="#00bcd4">Active</text>
  
  <!-- Watermark logo -->
  <text x="540" y="1800" font-family="sans-serif" font-size="28" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="4">FLEETPRO MANAGER</text>
</svg>
`;

const desktopSvg = `
<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#00838f;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#grad)" />
  
  <!-- Laptop Device Mockup -->
  <rect x="260" y="140" width="1400" height="800" rx="30" fill="#1e293b" stroke="#334155" stroke-width="8" />
  <rect x="290" y="170" width="1340" height="740" rx="10" fill="#0b0f19" />
  
  <!-- Laptop Base -->
  <path d="M 160 940 L 1760 940 L 1710 970 L 210 970 Z" fill="#334155" />
  <rect x="860" y="940" width="200" height="10" rx="5" fill="#475569" />
  
  <!-- UI Mockup Inside Screen -->
  <!-- Sidebar -->
  <rect x="290" y="170" width="260" height="740" fill="#0f172a" />
  <text x="330" y="230" font-family="sans-serif" font-size="26" font-weight="900" fill="#ffffff" letter-spacing="2">FLEETPRO</text>
  
  <rect x="310" y="280" width="220" height="50" rx="10" fill="#00bcd4" opacity="0.15" />
  <text x="340" y="312" font-family="sans-serif" font-size="16" font-weight="bold" fill="#00bcd4">Dashboard</text>
  
  <text x="340" y="382" font-family="sans-serif" font-size="16" font-weight="bold" fill="#94a3b8">Active Trips</text>
  <text x="340" y="442" font-family="sans-serif" font-size="16" font-weight="bold" fill="#94a3b8">Fuel Ledger</text>
  <text x="340" y="502" font-family="sans-serif" font-size="16" font-weight="bold" fill="#94a3b8">CV Generator</text>
  <text x="340" y="562" font-family="sans-serif" font-size="16" font-weight="bold" fill="#94a3b8">Settings</text>
  
  <!-- Main Panel -->
  <text x="600" y="240" font-family="sans-serif" font-size="36" font-weight="900" fill="#ffffff">Fleet Management Dashboard</text>
  <text x="600" y="280" font-family="sans-serif" font-size="16" font-weight="bold" fill="#00bcd4">WELCOME BACK, MANAGER</text>
  
  <!-- Cards -->
  <rect x="600" y="330" width="310" height="180" rx="16" fill="#1e293b" stroke="#00bcd4" stroke-width="2" />
  <text x="630" y="380" font-family="sans-serif" font-size="16" font-weight="bold" fill="#94a3b8">ACTIVE TRIPS</text>
  <text x="630" y="440" font-family="sans-serif" font-size="36" font-weight="900" fill="#ffffff">12 Active</text>
  
  <rect x="940" y="330" width="310" height="180" rx="16" fill="#1e293b" />
  <text x="970" y="380" font-family="sans-serif" font-size="16" font-weight="bold" fill="#94a3b8">FUEL SPENT</text>
  <text x="970" y="440" font-family="sans-serif" font-size="36" font-weight="900" fill="#00bcd4">$4,850.00</text>
  
  <rect x="1280" y="330" width="310" height="180" rx="16" fill="#1e293b" />
  <text x="1310" y="380" font-family="sans-serif" font-size="16" font-weight="bold" fill="#94a3b8">DRIVERS ACTIVE</text>
  <text x="1310" y="440" font-family="sans-serif" font-size="36" font-weight="900" fill="#38bdf8">8 Drivers</text>
  
  <!-- Data Table Mockup -->
  <rect x="600" y="550" width="990" height="320" rx="16" fill="#1e293b" />
  <text x="630" y="600" font-family="sans-serif" font-size="20" font-weight="bold" fill="#ffffff">Live Operations Log</text>
  
  <!-- Table Header -->
  <text x="630" y="650" font-family="sans-serif" font-size="14" font-weight="bold" fill="#94a3b8">TRIP ID</text>
  <text x="750" y="650" font-family="sans-serif" font-size="14" font-weight="bold" fill="#94a3b8">ROUTE</text>
  <text x="1000" y="650" font-family="sans-serif" font-size="14" font-weight="bold" fill="#94a3b8">DRIVER</text>
  <text x="1200" y="650" font-family="sans-serif" font-size="14" font-weight="bold" fill="#94a3b8">STATUS</text>
  
  <line x1="630" y1="670" x2="1550" y2="670" stroke="#334155" stroke-width="2" />
  
  <!-- Table Row 1 -->
  <text x="630" y="710" font-family="sans-serif" font-size="15" font-weight="bold" fill="#ffffff">#TR-4012</text>
  <text x="750" y="710" font-family="sans-serif" font-size="15" font-weight="bold" fill="#ffffff">Hamad Port to Sanaiya</text>
  <text x="1000" y="710" font-family="sans-serif" font-size="15" font-weight="bold" fill="#ffffff">Ahmed Al-Saeed</text>
  <text x="1200" y="710" font-family="sans-serif" font-size="15" font-weight="bold" fill="#10b981">Dispatched</text>
  
  <!-- Table Row 2 -->
  <text x="630" y="760" font-family="sans-serif" font-size="15" font-weight="bold" fill="#ffffff">#TR-4011</text>
  <text x="750" y="760" font-family="sans-serif" font-size="15" font-weight="bold" fill="#ffffff">Doha Port to Mesaieed</text>
  <text x="1000" y="760" font-family="sans-serif" font-size="15" font-weight="bold" fill="#ffffff">Sajid Khan</text>
  <text x="1200" y="760" font-family="sans-serif" font-size="15" font-weight="bold" fill="#00bcd4">In Progress</text>
  
  <!-- Table Row 3 -->
  <text x="630" y="810" font-family="sans-serif" font-size="15" font-weight="bold" fill="#ffffff">#TR-4010</text>
  <text x="750" y="810" font-family="sans-serif" font-size="15" font-weight="bold" fill="#ffffff">Al-Rayyan to Industrial Area</text>
  <text x="1000" y="810" font-family="sans-serif" font-size="15" font-weight="bold" fill="#ffffff">Mohammad Ali</text>
  <text x="1200" y="810" font-family="sans-serif" font-size="15" font-weight="bold" fill="#f97316">Loading</text>
</svg>
`;

async function run() {
  const screenshotsDir = path.join(__dirname, 'public', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  await sharp(Buffer.from(mobileSvg.trim()))
    .png()
    .toFile(path.join(screenshotsDir, 'screenshot-mobile.png'));
  console.log('Generated screenshot-mobile.png successfully');

  await sharp(Buffer.from(desktopSvg.trim()))
    .png()
    .toFile(path.join(screenshotsDir, 'screenshot-desktop.png'));
  console.log('Generated screenshot-desktop.png successfully');
}

run().catch(err => {
  console.error('Error generating screenshots:', err);
  process.exit(1);
});
