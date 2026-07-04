import { PollutionReport } from './types';

export const INITIAL_REPORTS: PollutionReport[] = [
  {
    id: 'REP-2026-001',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    category: 'Industrial Emissions',
    description: 'Thick dark particulate smoke plume rising from the main factory exhaust tower, violating local particulate volume standards.',
    severity: 'High',
    location: 'Seward Park Industrial Zone, Seattle',
    coordinates: { lat: 47.5512, lng: -122.2625 },
    time: '2026-07-03T14:32:00Z',
    status: 'Action Scheduled',
    confidence: 94.6,
    healthRisk: 'Severe respiratory risk for nearby residential estates. High sulfur dioxide content indicated by density analysis.',
    recommendation: 'Deploy municipal inspector, issue clean-air citation, and instruct residents within a 2-mile radius to close windows and run active HEPA air filtration.'
  },
  {
    id: 'REP-2026-002',
    imageUrl: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?auto=format&fit=crop&w=600&q=80',
    category: 'Illegal Waste Dumping',
    description: 'Dozens of plastic chemical containers and oil drums abandoned adjacent to the wetland preservation boundary line.',
    severity: 'High',
    location: 'Duwamish Waterway Park, Seattle',
    coordinates: { lat: 47.5318, lng: -122.3211 },
    time: '2026-07-03T10:15:00Z',
    status: 'Reported',
    confidence: 98.2,
    healthRisk: 'High threat of soil leach, toxic runoff into salmon spawning channels, and VOC evaporation.',
    recommendation: 'Dispatch Hazardous Material Response unit immediately. Coordinate with park rangers for potential perimeter security and camera installation.'
  },
  {
    id: 'REP-2026-003',
    imageUrl: 'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?auto=format&fit=crop&w=600&q=80',
    category: 'Exhaust & Traffic Smog',
    description: 'Heavy diesel exhaust haze settled in the depressed freeway corridor, significantly reducing visibility and air quality.',
    severity: 'Medium',
    location: 'I-5 Corridor (Downtown Link), Seattle',
    coordinates: { lat: 47.6062, lng: -122.3321 },
    time: '2026-07-02T17:45:00Z',
    status: 'Resolved',
    confidence: 88.5,
    healthRisk: 'Elevated PM2.5 levels. Triggers asthma attacks and cardiovascular stress in vulnerable demographics.',
    recommendation: 'Recommend transit-only lane restrictions during inversion peaks and display warning banners on electronic transit signs advising recirculation mode.'
  },
  {
    id: 'REP-2026-004',
    imageUrl: 'https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?auto=format&fit=crop&w=600&q=80',
    category: 'Construction Dust',
    description: 'Lack of dust suppression watering during multi-acre demolition phase. Cloud blowing into commercial shopping district.',
    severity: 'Medium',
    location: 'Capitol Hill Redevelopment Area, Seattle',
    coordinates: { lat: 47.6145, lng: -122.3215 },
    time: '2026-07-02T11:20:00Z',
    status: 'Action Scheduled',
    confidence: 91.3,
    healthRisk: 'Coarse particulate matter (PM10) causes eye, throat, and sinus irritation for local shoppers and commuters.',
    recommendation: 'Deliver immediate warning to project manager requiring active misting/wetting agents. Pause high-dust operations if wind exceeds 15mph.'
  },
  {
    id: 'REP-2026-005',
    imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80',
    category: 'Water Contamination',
    description: 'Strange chemical sheen and green coloration spreading from storm outfall pipeline into public lake access point.',
    severity: 'High',
    location: 'Green Lake Beach West, Seattle',
    coordinates: { lat: 47.6791, lng: -122.3292 },
    time: '2026-07-01T09:05:00Z',
    status: 'Resolved',
    confidence: 95.1,
    healthRisk: 'Potential toxic algae multiplier or industrial runoff. High danger to pets, children, and indigenous bird populations.',
    recommendation: 'Post temporary health warning signs, close beach access, collect water samples for laboratory profiling, and inspect uphill storm grates.'
  },
  {
    id: 'REP-2026-006',
    imageUrl: 'https://images.unsplash.com/photo-1569003339405-ea396a5a8a90?auto=format&fit=crop&w=600&q=80',
    category: 'Agricultural Burning',
    description: 'Controlled agricultural residue clearing fire out of bounds, sending thick smoke plume over neighboring state highway.',
    severity: 'Low',
    location: 'Enumclaw Boundary Farmlands',
    coordinates: { lat: 47.2043, lng: -121.9916 },
    time: '2026-06-30T16:10:00Z',
    status: 'Resolved',
    confidence: 85.4,
    healthRisk: 'Temporary PM2.5 elevation. Moderate discomfort for individuals with bronchial sensitivities.',
    recommendation: 'Advise agricultural operator on wind-direction windows. Post highway alerts regarding low visibility and reduction in speed limit.'
  }
];

export const CATEGORIES = [
  'Industrial Emissions',
  'Illegal Waste Dumping',
  'Exhaust & Traffic Smog',
  'Water Contamination',
  'Construction Dust',
  'Agricultural Burning'
];

export const SAMPLE_AI_ASSESSMENT: Record<string, Omit<PollutionReport, 'id' | 'imageUrl' | 'description' | 'location' | 'coordinates' | 'time' | 'status'>> = {
  'Industrial Emissions': {
    category: 'Industrial Emissions',
    severity: 'High',
    confidence: 93.4,
    healthRisk: 'Dangerous inhalation levels of Sulfur Dioxide (SO2) and Nitrogen Oxides (NOx). Immediate threat to residents with asthma or cardiopulmonary history.',
    recommendation: 'Enact emergency emissions inspection. Notify municipal air quality control board. Recommend nearby populations trigger high HEPA filtration modes.'
  },
  'Illegal Waste Dumping': {
    category: 'Illegal Waste Dumping',
    severity: 'High',
    confidence: 97.8,
    healthRisk: 'Severe ecological hazard. Risk of localized soil bio-accumulation and aquatic contamination through nearby storm runoff drains.',
    recommendation: 'Alert the Municipal Hazardous Response Department. Deploy physical barriers to prevent rain runoff spread and install CCTV security monitors.'
  },
  'Exhaust & Traffic Smog': {
    category: 'Exhaust & Traffic Smog',
    severity: 'Medium',
    confidence: 89.2,
    healthRisk: 'Elevated Carbon Monoxide (CO) and Fine Particulate Matter (PM2.5). Cumulative high risk for morning commuters and road crews.',
    recommendation: 'Advise drivers to close windows and activate air cabin recirculation. Recommend city planners evaluate active congestion charging during low-wind events.'
  },
  'Water Contamination': {
    category: 'Water Contamination',
    severity: 'High',
    confidence: 95.6,
    healthRisk: 'Critical hazard. Potential chemical or biological discharge. Exposure may cause severe dermatological reactions or gastrointestinal issues if ingested.',
    recommendation: 'Cordon off water access. Collect immediate baseline water samples. Alert local water management authority and post toxicity warnings.'
  },
  'Construction Dust': {
    category: 'Construction Dust',
    severity: 'Medium',
    confidence: 91.8,
    healthRisk: 'Coarse Crystalline Silica dust (PM10) causing localized eye, nose, and respiratory membrane inflammation.',
    recommendation: 'Issue municipal order for immediate ground wetting. Verify that contractors are using dust barriers and dust-extraction equipment on power tools.'
  },
  'Agricultural Burning': {
    category: 'Agricultural Burning',
    severity: 'Low',
    confidence: 87.5,
    healthRisk: 'Mild respiratory irritation due to organic particulate smoke. Minimal risk unless localized wind stagnation occurs.',
    recommendation: 'Verify agricultural burn permit compliance. Coordinate with county officials to ensure burn occurs during optimal atmospheric dispersal conditions.'
  }
};
