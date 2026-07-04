import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { UploadCard } from '../components/UploadCard';
import { AIResultCard } from '../components/AIResultCard';
import { MapPin, Navigation, Sparkles, Send, RefreshCw, AlertCircle } from 'lucide-react';
import { PollutionReport, SeverityLevel, ReportStatus } from '../types';
import { CATEGORIES, SAMPLE_AI_ASSESSMENT } from '../data';

interface ReportProps {
  onAddReport: (report: PollutionReport) => void;
}

export const Report: React.FC<ReportProps> = ({ onAddReport }) => {
  const navigate = useNavigate();
  
  // Form States
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [location, setLocation] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 47.6062, lng: -122.3321 }); // Default Seattle
  const [isLocating, setIsLocating] = useState(false);

  // AI states
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [aiResult, setAiResult] = useState<{
    category: string;
    severity: SeverityLevel;
    confidence: number;
    healthRisk: string;
    recommendation: string;
  } | null>(null);

  // Alert Success
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  // Triggered when image selected (or preset clicked)
  const handleImageSelected = (
    imageUrl: string,
    presetData?: { category: string; description: string }
  ) => {
    setSelectedImage(imageUrl);
    setIsAnalyzed(false);
    setAiResult(null);

    // If preset clicked, auto-populate details
    if (presetData) {
      setCategory(presetData.category);
      setDescription(presetData.description);
      
      // Assign specific coordinates to presets so they pin in interesting Seattle areas
      const presetCoords: Record<string, { lat: number; lng: number; loc: string }> = {
        'Industrial Emissions': { lat: 47.5512, lng: -122.2625, loc: 'Seward Park Industrial Zone, Seattle' },
        'Illegal Waste Dumping': { lat: 47.5318, lng: -122.3211, loc: 'Duwamish Waterway Park, Seattle' },
        'Exhaust & Traffic Smog': { lat: 47.6062, lng: -122.3321, loc: 'I-5 Corridor (Downtown Link), Seattle' },
        'Construction Dust': { lat: 47.6145, lng: -122.3215, loc: 'Capitol Hill Redevelopment Area, Seattle' },
        'Water Contamination': { lat: 47.6791, lng: -122.3292, loc: 'Green Lake Beach West, Seattle' },
      };

      const match = presetCoords[presetData.category];
      if (match) {
        setCoords({ lat: match.lat, lng: match.lng });
        setLocation(match.loc);
      } else {
        // Randomize slightly
        const randomLat = 47.30 + Math.random() * 0.4;
        const randomLng = -122.35 + Math.random() * 0.15;
        setCoords({ lat: randomLat, lng: randomLng });
        setLocation(`Sector-${Math.floor(Math.random() * 90 + 10)}, Seattle Hub`);
      }
    }
  };

  // Browser Geolocation
  const handleGetLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setCoords({ lat, lng });
          setLocation(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)} (Current Geolocated Coordinates)`);
          setIsLocating(false);
        },
        (error) => {
          // Geolocation blocked or failed, use a random premium Seattle Coordinate
          setTimeout(() => {
            const randomLat = 47.52 + Math.random() * 0.15;
            const randomLng = -122.35 + Math.random() * 0.08;
            setCoords({ lat: randomLat, lng: randomLng });
            setLocation(`Lat: ${randomLat.toFixed(4)}, Lng: ${randomLng.toFixed(4)} (Space Needle District, Seattle)`);
            setIsLocating(false);
          }, 1000);
        }
      );
    } else {
      setIsLocating(false);
      alert('Geolocation API is not supported by your browser.');
    }
  };

  // Simulate AI evaluation
  const handleAnalyzeWithAI = () => {
    if (!selectedImage) {
      alert('Please upload or capture a photo first.');
      return;
    }
    setIsLoadingAI(true);
    
    setTimeout(() => {
      // Fetch matching mock AI assessment
      const matchedAssessment = SAMPLE_AI_ASSESSMENT[category];
      if (matchedAssessment) {
        setAiResult({
          category: matchedAssessment.category,
          severity: matchedAssessment.severity,
          confidence: matchedAssessment.confidence,
          healthRisk: matchedAssessment.healthRisk,
          recommendation: matchedAssessment.recommendation,
        });
      } else {
        setAiResult({
          category: category,
          severity: 'Medium',
          confidence: 91.2,
          healthRisk: 'General particulate pollution, triggering localized throat and eyes inflammation for hyper-sensitive age brackets.',
          recommendation: 'Issue clean-air directive to regional code-enforcement. Recommend localized air quality filtration index tracking.',
        });
      }
      setIsLoadingAI(false);
      setIsAnalyzed(true);
    }, 1500);
  };

  // Clear Form
  const handleClear = () => {
    setSelectedImage(null);
    setDescription('');
    setCategory(CATEGORIES[0]);
    setLocation('');
    setCoords({ lat: 47.6062, lng: -122.3321 });
    setIsAnalyzed(false);
    setAiResult(null);
  };

  // Submit report to central database
  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImage) {
      alert('Please upload or select an image first.');
      return;
    }
    if (!location) {
      alert('Please supply or detect incident coordinates.');
      return;
    }

    // Compile new report object
    const finalResult = aiResult || {
      category: category,
      severity: 'Medium' as SeverityLevel,
      confidence: 92.5,
      healthRisk: 'Coarse air quality hazard flagged in vicinity.',
      recommendation: 'Inspect area and enforce clean air ordinances.',
    };

    const newReport: PollutionReport = {
      id: `REP-2206-${Math.floor(100 + Math.random() * 900)}`,
      imageUrl: selectedImage,
      category: finalResult.category,
      description: description || `Reported emissions of type: ${finalResult.category.toLowerCase()}.`,
      severity: finalResult.severity,
      location: location,
      coordinates: coords,
      time: new Date().toISOString(),
      status: 'Reported' as ReportStatus,
      confidence: finalResult.confidence,
      healthRisk: finalResult.healthRisk,
      recommendation: finalResult.recommendation,
    };

    // Callback to parent state
    onAddReport(newReport);

    // Show Success, trigger navigation
    setShowSuccessAlert(true);
    setTimeout(() => {
      setShowSuccessAlert(false);
      navigate('/dashboard');
    }, 1800);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      
      {/* Page Header */}
      <div className="space-y-1">
        <span className="text-xs font-bold text-primary uppercase tracking-widest block">Citizen Node</span>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Report Localized Pollution</h1>
        <p className="text-sm text-muted-text max-w-3xl leading-relaxed">
          Log structural air hazards, industrial stack overflows, or illegal wetland littering. Leverage high-resolution visual matching engines to catalog emissions and direct municipal clean-up teams.
        </p>
      </div>

      {showSuccessAlert && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-xl bg-success/20 text-white border border-success/40 flex items-center gap-3"
        >
          <Sparkles className="w-5 h-5 text-success animate-pulse shrink-0" />
          <div>
            <span className="font-bold block">Environmental Incident Registered successfully!</span>
            <span className="text-xs text-muted-text">Deploying telemetry... Redirecting to local database logs.</span>
          </div>
        </motion.div>
      )}

      {/* Grid Layout: Left form controls, Right AI Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: UPLOADER & FORM FIELDS */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Uploader Section */}
          <UploadCard
            onImageSelected={handleImageSelected}
            selectedImage={selectedImage}
            onClear={handleClear}
          />

          {/* Form Fields Card */}
          <form onSubmit={handleSubmitReport} className="glass-panel rounded-2xl border border-white/5 p-6 space-y-5 shadow-lg">
            
            {/* Category dropdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-white block uppercase tracking-wide">
                  Incident Category
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setIsAnalyzed(false);
                    setAiResult(null);
                  }}
                  className="w-full p-3 bg-slate-900 border border-white/5 focus:border-primary/50 rounded-xl text-xs text-white outline-none cursor-pointer transition-all"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Geolocation Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-white block uppercase tracking-wide flex items-center justify-between">
                  <span>Pinpoint Coordinates</span>
                  <span className="text-[10px] text-muted-text lowercase">GPS/EXIF</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-text" />
                    <input
                      type="text"
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Retrieve GPS coordinates..."
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-white/5 focus:border-primary/50 rounded-xl text-xs text-white placeholder-muted-text outline-none transition-all"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={isLocating}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-white/5 flex items-center justify-center cursor-pointer disabled:opacity-50"
                    title="Retrieve current location coordinates"
                  >
                    {isLocating ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-secondary" />
                    ) : (
                      <Navigation className="w-4 h-4 text-secondary" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Description TextArea */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white block uppercase tracking-wide">
                Visual Description & Context
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detail clear markers, smoke density, smells, toxic runoff streams, or hazardous container quantities here..."
                rows={4}
                className="w-full p-3 bg-slate-900 border border-white/5 focus:border-primary/50 rounded-xl text-xs text-white placeholder-muted-text outline-none transition-all resize-none"
              />
            </div>

            {/* Button Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={handleAnalyzeWithAI}
                disabled={!selectedImage || isLoadingAI}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-secondary to-blue-500 text-white text-xs font-bold transition-all disabled:opacity-40 disabled:pointer-events-none hover:shadow-lg hover:shadow-secondary/20 hover:-translate-y-0.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Analyze with AI</span>
              </button>

              <button
                type="button"
                onClick={handleClear}
                className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-white/5 text-xs font-bold transition-all"
              >
                Clear Form
              </button>

              <button
                type="submit"
                disabled={!selectedImage || !location || !isAnalyzed}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary hover:bg-emerald-500 text-white text-xs font-bold transition-all disabled:opacity-40 disabled:pointer-events-none hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5"
              >
                <Send className="w-4 h-4" />
                <span>Submit Report</span>
              </button>
            </div>

            {/* Validation Hint Alert */}
            {!isAnalyzed && selectedImage && (
              <div className="p-3 bg-warning/10 rounded-xl border border-warning/20 flex gap-2 items-center">
                <AlertCircle className="w-4 h-4 text-warning shrink-0" />
                <span className="text-[10px] text-muted-text">
                  To fulfill regulatory guidelines, you must execute the <strong>Analyze with AI</strong> command prior to submitting this report.
                </span>
              </div>
            )}

          </form>

        </div>

        {/* RIGHT COLUMN: AI ASSESSMENT RESULTS CARD */}
        <div className="lg:col-span-5 h-full">
          <AIResultCard
            isLoading={isLoadingAI}
            isAnalyzed={isAnalyzed}
            result={aiResult}
          />
        </div>

      </div>

    </div>
  );
};
export default Report;
