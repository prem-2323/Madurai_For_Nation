const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:5000/api';
const PASSWORD = 'Madurai@2024';
const PIC_DIR = path.join(__dirname, 'pic');

// Each entry: login as EXISTING user, submit a NEW report ~200m away from their first report
// This creates clusters of 2+ reports within 400m → hotspots!
const entries = [
  {
    loginEmail: '24ALR044001@madurai4nation.com',
    image: 'Construction dust.jpg',
    description: 'Construction debris and dust near SIDCO Estate boundary road',
    location: 'SIDCO Industrial Estate, Madurai',
    lat: 9.9145,
    lng: 78.1125,
  },
  {
    loginEmail: '24ALR044001@madurai4nation.com',
    image: 'Factory smoke.jpg',
    description: 'Additional factory smoke observed near SIDCO main gate',
    location: 'SIDCO Industrial Estate, Madurai',
    lat: 9.9108,
    lng: 78.1160,
  },
  {
    loginEmail: '24ALR044002@madurai4nation.com',
    image: 'Traffic pollution.jpg',
    description: 'Traffic congestion and exhaust fumes at T Nagar signal junction',
    location: 'T Nagar, Chennai',
    lat: 13.0435,
    lng: 80.2355,
  },
  {
    loginEmail: '24ALR044002@madurai4nation.com',
    image: 'Traffic pollution1.jpg',
    description: 'Vehicular emissions near T Nagar market area',
    location: 'T Nagar, Chennai',
    lat: 13.0400,
    lng: 80.2320,
  },
  {
    loginEmail: '24ALR044003@madurai4nation.com',
    image: 'Construction dust.jpg',
    description: 'Road construction dust near Peelamedu junction',
    location: 'Peelamedu, Coimbatore',
    lat: 11.0270,
    lng: 76.9785,
  },
  {
    loginEmail: '24ALR044003@madurai4nation.com',
    image: 'Factory smoke.jpg',
    description: 'Industrial emissions near Peelamedu industrial zone',
    location: 'Peelamedu, Coimbatore',
    lat: 11.0240,
    lng: 76.9820,
  },
  {
    loginEmail: '24ALR044004@madurai4nation.com',
    image: 'Clean environment (no pollution).jpg',
    description: 'Clean stretch near Marine Drive promenade',
    location: 'Marine Drive, Mumbai',
    lat: 18.9230,
    lng: 72.8270,
  },
  {
    loginEmail: '24ALR044005@madurai4nation.com',
    image: 'Traffic pollution.jpg',
    description: 'Traffic congestion near Marina Beach entrance road',
    location: 'Marina Beach, Chennai',
    lat: 13.0585,
    lng: 80.2835,
  },
  {
    loginEmail: '24ALR044006@madurai4nation.com',
    image: 'QQFF-K79S8.jpg',
    description: 'Industrial chimney emissions in Chembur MIDC area',
    location: 'Chembur, Mumbai',
    lat: 19.0595,
    lng: 72.9015,
  },
  {
    loginEmail: '24ALR044006@madurai4nation.com',
    image: 'Factory smoke.jpg',
    description: 'Factory smoke from chemical plant in Chembur',
    location: 'Chembur, Mumbai',
    lat: 19.0565,
    lng: 72.8985,
  },
];

async function login(email) {
  const r = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  const d = await r.json();
  if (!d.success) throw new Error(`Login failed for ${email}: ${d.message}`);
  return d.data.token;
}

async function analyze(token, { image, description, location, lat, lng }) {
  const imagePath = path.join(PIC_DIR, image);
  const buf = fs.readFileSync(imagePath);
  const fd = new FormData();
  fd.append('image', new Blob([buf], { type: 'image/jpeg' }), image);
  fd.append('latitude', String(lat));
  fd.append('longitude', String(lng));
  fd.append('description', description);
  fd.append('location', location);
  const r = await fetch(`${BASE}/analyze`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  return r.json();
}

async function main() {
  const results = [];

  for (const entry of entries) {
    console.log(`\n--- ${entry.loginEmail} → ${entry.location} (${entry.lat}, ${entry.lng}) ---`);
    try {
      const token = await login(entry.loginEmail);
      const data = await analyze(token, entry);
      if (data.success) {
        console.log(`  ✓ Report ${data.data.report.id}`);
        results.push({ email: entry.loginEmail, location: entry.location, status: 'success', id: data.data.report.id });
      } else {
        console.log(`  ✗ ${data.message}`);
        results.push({ email: entry.loginEmail, location: entry.location, status: 'failed', error: data.message });
      }
    } catch (e) {
      console.log(`  ✗ ${e.message}`);
      results.push({ email: entry.loginEmail, location: entry.location, status: 'failed', error: e.message });
    }
  }

  console.log('\n========== SUMMARY ==========');
  const ok = results.filter(r => r.status === 'success').length;
  console.log(`${ok}/${results.length} reports submitted successfully`);
  for (const r of results) {
    if (r.status === 'success') console.log(`  ✓ ${r.email} → ${r.id} @ ${r.location}`);
    else console.log(`  ✗ ${r.email} → ${r.error} @ ${r.location}`);
  }
}

main().catch(console.error);
