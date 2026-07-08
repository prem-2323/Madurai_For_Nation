const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:5000/api';
const PASSWORD = 'Madurai@2024';
const PIC_DIR = path.join(__dirname, 'pic');

const entries = [
  {
    id: '24ALR044001',
    email: '24ALR044001@madurai4nation.com',
    image: 'Factory smoke.jpg',
    description: 'Industrial smoke emissions from factory chimney in SIDCO Industrial Estate, Madurai',
    location: 'SIDCO Industrial Estate, Madurai',
    lat: 9.9123,
    lng: 78.1145,
  },
  {
    id: '24ALR044002',
    email: '24ALR044002@madurai4nation.com',
    image: 'Traffic pollution.jpg',
    description: 'Heavy traffic congestion causing exhaust and smog at T Nagar junction, Chennai',
    location: 'T Nagar, Chennai',
    lat: 13.0418,
    lng: 80.2341,
  },
  {
    id: '24ALR044003',
    email: '24ALR044003@madurai4nation.com',
    image: 'Construction dust.jpg',
    description: 'Construction dust from ongoing building work at Peelamedu, Coimbatore',
    location: 'Peelamedu, Coimbatore',
    lat: 11.0255,
    lng: 76.9800,
  },
  {
    id: '24ALR044004',
    email: '24ALR044004@madurai4nation.com',
    image: 'Clean environment (no pollution).jpg',
    description: 'Clean environment along Marine Drive with no visible pollution, Mumbai',
    location: 'Marine Drive, Mumbai',
    lat: 18.9217,
    lng: 72.8256,
  },
  {
    id: '24ALR044005',
    email: '24ALR044005@madurai4nation.com',
    image: 'Traffic pollution1.jpg',
    description: 'Traffic smog near Marina Beach during peak hours, Chennai',
    location: 'Marina Beach, Chennai',
    lat: 13.0569,
    lng: 80.2825,
  },
  {
    id: '24ALR044006',
    email: '24ALR044006@madurai4nation.com',
    image: 'QQFF-K79S8.jpg',
    description: 'Industrial emissions from factories in Chembur area, Mumbai',
    location: 'Chembur, Mumbai',
    lat: 19.0580,
    lng: 72.9000,
  },
];

async function main() {
  const results = [];

  for (const entry of entries) {
    console.log(`\n========== ${entry.id} — ${entry.location} ==========`);

    // 1. Register user
    console.log(`Registering ${entry.email}...`);
    const regRes = await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: entry.id, email: entry.email, password: PASSWORD, role: 'citizen' }),
    });
    const regData = await regRes.json();
    if (!regData.success) {
      console.log(`  ✗ Register failed: ${regData.message}`);
      results.push({ id: entry.id, status: 'failed', error: regData.message });
      continue;
    }
    const token = regData.data.token;
    console.log(`  ✓ Registered`);

    // 2. Upload & analyze image
    const imagePath = path.join(PIC_DIR, entry.image);
    if (!fs.existsSync(imagePath)) {
      console.log(`  ✗ Image not found: ${imagePath}`);
      results.push({ id: entry.id, status: 'failed', error: 'Image not found' });
      continue;
    }

    console.log(`Analyzing ${entry.image}...`);
    const imageBuffer = fs.readFileSync(imagePath);
    const fd = new FormData();
    fd.append('image', new Blob([imageBuffer], { type: 'image/jpeg' }), entry.image);
    fd.append('latitude', String(entry.lat));
    fd.append('longitude', String(entry.lng));
    fd.append('description', entry.description);
    fd.append('location', entry.location);

    const anaRes = await fetch(`${BASE}/analyze`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    const anaData = await anaRes.json();
    if (anaData.success) {
      console.log(`  ✓ Analyzed — Report ID: ${anaData.data.report.id}`);
      results.push({ id: entry.id, status: 'success', reportId: anaData.data.report.id });
    } else {
      console.log(`  ✗ Analyze failed: ${anaData.message}`);
      results.push({ id: entry.id, status: 'failed', error: anaData.message });
    }
  }

  console.log('\n========================================');
  console.log('              SUMMARY');
  console.log('========================================');
  for (const r of results) {
    console.log(`${r.id}: ${r.status === 'success' ? '✓' : '✗'} ${r.reportId ? `report=${r.reportId}` : r.error}`);
  }
}

main().catch(console.error);
