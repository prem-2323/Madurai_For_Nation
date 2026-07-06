const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');
const Report = require('../models/Report');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const mockReports = [
  {
    category: 'Industrial Emissions',
    description: 'Thick dark particulate smoke plume rising from the main factory exhaust tower, violating local particulate volume standards.',
    severity: 'high',
    location: 'Seward Park Industrial Zone, Seattle',
    latitude: 47.5512,
    longitude: -122.2625,
    createdAt: new Date('2026-07-03T14:32:00Z'),
    status: 'in_progress',
    confidence: 94.6,
    healthRisk: 'Severe respiratory risk for nearby residential estates. High sulfur dioxide content indicated by density analysis.',
    recommendation: 'Deploy municipal inspector, issue clean-air citation, and instruct residents within a 2-mile radius to close windows and run active HEPA air filtration.'
  },
  {
    category: 'Illegal Waste Dumping',
    description: 'Dozens of plastic chemical containers and oil drums abandoned adjacent to the wetland preservation boundary line.',
    severity: 'high',
    location: 'Duwamish Waterway Park, Seattle',
    latitude: 47.5318,
    longitude: -122.3211,
    createdAt: new Date('2026-07-03T10:15:00Z'),
    status: 'pending',
    confidence: 98.2,
    healthRisk: 'High threat of soil leach, toxic runoff into salmon spawning channels, and VOC evaporation.',
    recommendation: 'Dispatch Hazardous Material Response unit immediately. Coordinate with park rangers for potential perimeter security and camera installation.'
  },
  {
    category: 'Exhaust & Traffic Smog',
    description: 'Heavy diesel exhaust haze settled in the depressed freeway corridor, significantly reducing visibility and air quality.',
    severity: 'moderate',
    location: 'I-5 Corridor (Downtown Link), Seattle',
    latitude: 47.6062,
    longitude: -122.3321,
    createdAt: new Date('2026-07-02T17:45:00Z'),
    status: 'resolved',
    confidence: 88.5,
    healthRisk: 'Elevated PM2.5 levels. Triggers asthma attacks and cardiovascular stress in vulnerable demographics.',
    recommendation: 'Recommend transit-only lane restrictions during inversion peaks and display warning banners on electronic transit signs advising recirculation mode.'
  },
  {
    category: 'Construction Dust',
    description: 'Lack of dust suppression watering during multi-acre demolition phase. Cloud blowing into commercial shopping district.',
    severity: 'moderate',
    location: 'Capitol Hill Redevelopment Area, Seattle',
    latitude: 47.6145,
    longitude: -122.3215,
    createdAt: new Date('2026-07-02T11:20:00Z'),
    status: 'in_progress',
    confidence: 91.3,
    healthRisk: 'Coarse particulate matter (PM10) causes eye, throat, and sinus irritation for local shoppers and commuters.',
    recommendation: 'Deliver immediate warning to project manager requiring active misting/wetting agents. Pause high-dust operations if wind exceeds 15mph.'
  },
  {
    category: 'Water Contamination',
    description: 'Strange chemical sheen and green coloration spreading from storm outfall pipeline into public lake access point.',
    severity: 'high',
    location: 'Green Lake Beach West, Seattle',
    latitude: 47.6791,
    longitude: -122.3292,
    createdAt: new Date('2026-07-01T09:05:00Z'),
    status: 'resolved',
    confidence: 95.1,
    healthRisk: 'Potential toxic algae multiplier or industrial runoff. High danger to pets, children, and indigenous bird populations.',
    recommendation: 'Post temporary health warning signs, close beach access, collect water samples for laboratory profiling, and inspect uphill storm grates.'
  },
  {
    category: 'Agricultural Burning',
    description: 'Controlled agricultural residue clearing fire out of bounds, sending thick smoke plume over neighboring state highway.',
    severity: 'low',
    location: 'Enumclaw Boundary Farmlands',
    latitude: 47.2043,
    longitude: -121.9916,
    createdAt: new Date('2026-06-30T16:10:00Z'),
    status: 'resolved',
    confidence: 85.4,
    healthRisk: 'Temporary PM2.5 elevation. Moderate discomfort for individuals with bronchial sensitivities.',
    recommendation: 'Advise agricultural operator on wind-direction windows. Post highway alerts regarding low visibility and reduction in speed limit.'
  }
];

const seedDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not defined');
    
    await mongoose.connect(uri);
    console.log('Connected to MongoDB for seeding.');

    // Clear existing data
    await User.deleteMany({});
    await Report.deleteMany({});
    console.log('Cleared existing Users and Reports.');

    // Create a mock user
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@cleanair.com',
      password: 'adminpassword123',
      role: 'admin'
    });
    console.log('Created admin user:', adminUser.email);

    // Create reports
    const reportsWithUser = mockReports.map(r => ({
      ...r,
      reportedBy: adminUser._id
    }));

    await Report.insertMany(reportsWithUser);
    console.log('Successfully seeded mock reports!');

    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seedDB();
