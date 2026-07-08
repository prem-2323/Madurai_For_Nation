import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCard } from '../components/UploadCard';
import { AIResultCard } from '../components/AIResultCard';
import { AirQualityCard } from '../components/AirQualityCard';
import { MapPin, Navigation, Sparkles, Send, RefreshCw, AlertCircle, Check, Upload, Cpu, Map, FileCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { PollutionReport, AIAnalysisResult, ReportStatus, AirQualityData } from '../types';
import { CATEGORIES } from '../data';
import { analyzePollutionImage, API_BASE_URL, imageUrlToFile } from '../api/analyze';

const SCAN_MESSAGES = [
  'Scanning smoke particles...',
  'Detecting vehicles and emissions...',
  'Analyzing pollution density...',
  'Checking severity levels...',
  'Estimating AQI impact...',
  'Generating health recommendations...',
];

interface ReportProps {
  onAddReport: (report: PollutionReport) => void;
  token?: string | null;
}

export const Report: React.FC<ReportProps> = ({ onAddReport, token }) => {
  const navigate = useNavigate();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [location, setLocation] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 9.9252, lng: 78.1198 });
  const [isLocating, setIsLocating] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);
  const [savedReportId, setSavedReportId] = useState<string | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [scanMessage, setScanMessage] = useState(SCAN_MESSAGES[0]);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { id: 1, label: 'Upload', icon: <Upload className="w-3.5 h-3.5" /> },
    { id: 2, label: 'Location', icon: <Map className="w-3.5 h-3.5" /> },
    { id: 3, label: 'AI Analysis', icon: <Cpu className="w-3.5 h-3.5" /> },
    { id: 4, label: 'Submit', icon: <FileCheck className="w-3.5 h-3.5" /> },
  ];

  useEffect(() => {
    if (selectedImage) setCurrentStep(1);
    if (location) setCurrentStep(2);
    if (isAnalyzed) setCurrentStep(3);
  }, [selectedImage, location, isAnalyzed]);

  useEffect(() => {
    if (!isLoadingAI) return;
    setScanMessage(SCAN_MESSAGES[0]);
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % SCAN_MESSAGES.length;
      setScanMessage(SCAN_MESSAGES[i]);
    }, 2000);
    return () => clearInterval(interval);
  }, [isLoadingAI]);

  const handleImageSelected = (imageUrl: string, options?: { file?: File; category?: string; description?: string }) => {
    setSelectedImage(imageUrl);
    setSelectedFile(options?.file || null);
    setIsAnalyzed(false);
    setAiResult(null);
    setAirQuality(null);
    setSavedReportId(null);
    setAnalyzeError(null);
    setSubmitError(null);
    if (options?.category) {
      setCategory(options.category);
      setDescription(options.description || '');
      const presetCoords: Record<string, { lat: number; lng: number; loc: string }> = {
        'Industrial Emissions': { lat: 9.9123, lng: 78.1145, loc: 'SIDCO Industrial Estate, Madurai' },
        'Illegal Waste Dumping': { lat: 9.8956, lng: 78.1289, loc: 'Vaigai River Bank, Madurai' },
        'Exhaust & Traffic Smog': { lat: 9.9198, lng: 78.1195, loc: 'Mattuthavani Bus Stand, Madurai' },
        'Construction Dust': { lat: 9.9345, lng: 78.1056, loc: 'KK Nagar Construction Zone, Madurai' },
        'Water Contamination': { lat: 9.9412, lng: 78.1312, loc: 'Vandiyur Lake, Madurai' },
      };
      const match = presetCoords[options.category];
      if (match) { setCoords({ lat: match.lat, lng: match.lng }); setLocation(match.loc); }
    }
  };

  const handleGetLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => { setCoords({ lat: position.coords.latitude, lng: position.coords.longitude }); setLocation(`Lat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)}`); setIsLocating(false); },
        () => { setCoords({ lat: 9.9252, lng: 78.1198 }); setLocation('Meenakshi Amman Temple Area, Madurai'); setIsLocating(false); }
      );
    } else { setIsLocating(false); alert('Geolocation not supported.'); }
  };

  const resolveImageFile = async (): Promise<File> => {
    if (selectedFile) return selectedFile;
    if (!selectedImage) throw new Error('No image selected');
    return imageUrlToFile(selectedImage, 'pollution-report.jpg');
  };

  const handleAnalyzeWithAI = async () => {
    if (!selectedImage) { toast.error('Please upload or capture a photo first.'); return; }
    setIsLoadingAI(true);
    setAnalyzeError(null);
    try {
      const imageFile = await resolveImageFile();
      const { analysis, airQuality: aqiData, report } = await analyzePollutionImage({ imageFile, latitude: coords.lat, longitude: coords.lng, description, location, token });
      setAiResult(analysis);
      setAirQuality(aqiData);
      setCategory(analysis.pollutionType);
      setIsAnalyzed(true);
      setSavedReportId(report.id);
      const serverImage = report.image.startsWith('http') ? report.image : `${API_BASE_URL}${report.image}`;
      setSelectedImage(serverImage);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI analysis failed';
      toast.error(message, { id: 'ai-analyze-error' });
      setIsAnalyzed(false);
      setAiResult(null);
    } finally { setIsLoadingAI(false); }
  };

  const handleClear = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    setDescription('');
    setCategory(CATEGORIES[0]);
    setLocation('');
    setCoords({ lat: 9.9252, lng: 78.1198 });
    setIsAnalyzed(false);
    setAiResult(null);
    setAirQuality(null);
    setSavedReportId(null);
    setAnalyzeError(null);
    setSubmitError(null);
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!selectedImage) { toast.error('Please upload an image first.'); return; }
    if (!location) { toast.error('Please supply or detect coordinates.'); return; }
    if (!aiResult) { toast.error('Please run AI analysis before submitting.'); return; }
    try {
      const newReport: PollutionReport = {
        id: savedReportId || `REP-${Date.now()}`,
        imageUrl: selectedImage,
        category: aiResult.pollutionType,
        description: description || aiResult.reason || `Reported ${aiResult.pollutionType.toLowerCase()}.`,
        severity: aiResult.severity,
        location,
        coordinates: coords,
        time: new Date().toISOString(),
        status: 'AI Analyzed' as ReportStatus,
        confidence: aiResult.confidence,
        healthRisk: aiResult.healthRisk,
        recommendation: aiResult.recommendation,
        pollutionDetected: aiResult.pollutionDetected,
        reason: aiResult.reason,
        estimatedPM25Impact: aiResult.estimatedPM25Impact,
        estimatedPM10Impact: aiResult.estimatedPM10Impact,
        emergencyLevel: aiResult.emergencyLevel,
        needsMunicipalAction: aiResult.needsMunicipalAction,
        possibleSource: aiResult.possibleSource,
        priority: aiResult.priority,
        airQuality: airQuality ?? undefined,
      };
      onAddReport(newReport);
      toast.success('Report submitted successfully! Awaiting municipal review.', { id: 'report-submit-success' });
      setTimeout(() => navigate('/citizen/reports'), 1500);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit report';
      toast.error(message, { id: 'report-submit-error' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">

      {/* Header */}
      <div className="space-y-1">
        <span className="text-xs font-bold text-primary uppercase tracking-widest block">Citizen Node</span>
        <h1 className="heading-text text-white">Report Localized Pollution</h1>
        <p className="body-text text-muted-text max-w-3xl">
          Upload a photo of pollution in Madurai. Gemini 2.5 Flash inspects the image, saves structured data to MongoDB, and feeds your dashboard and map.
        </p>
      </div>

      {/* Wizard Steps */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {steps.map((step, i) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  currentStep >= i ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/20' : 'bg-slate-800 text-muted-text border border-white/5'
                }`}>
                  {currentStep > i ? <Check className="w-4 h-4" /> : step.icon}
                </div>
                <span className={`text-[10px] font-semibold ${currentStep >= i ? 'text-white' : 'text-muted-text'}`}>{step.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-px mx-2 sm:mx-4 ${currentStep > i ? 'bg-gradient-to-r from-primary to-secondary' : 'bg-white/10'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          <UploadCard onImageSelected={handleImageSelected} selectedImage={selectedImage} onClear={handleClear} />

          <form onSubmit={handleSubmitReport} className="glass-panel rounded-2xl p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-white block uppercase tracking-wide">Incident Category</label>
                <select value={category} onChange={(e) => { setCategory(e.target.value); setIsAnalyzed(false); setAiResult(null); }} className="w-full p-3 bg-slate-900 border border-white/5 focus:border-primary/50 rounded-xl text-xs text-white outline-none cursor-pointer transition-all">
                  {CATEGORIES.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                  {aiResult && !CATEGORIES.includes(aiResult.pollutionType) && (<option value={aiResult.pollutionType}>{aiResult.pollutionType}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-white block uppercase tracking-wide flex items-center justify-between">
                  <span>Pinpoint Coordinates</span>
                  <span className="text-[10px] text-muted-text lowercase">GPS</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-text" />
                    <input type="text" required value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Retrieve GPS coordinates..." className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-white/5 focus:border-primary/50 rounded-xl text-xs text-white placeholder-muted-text outline-none transition-all" />
                  </div>
                  <button type="button" onClick={handleGetLocation} disabled={isLocating} className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-white/5 flex items-center justify-center cursor-pointer disabled:opacity-50" title="Get current location">
                    {isLocating ? <RefreshCw className="w-4 h-4 animate-spin text-secondary" /> : <Navigation className="w-4 h-4 text-secondary" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-white block uppercase tracking-wide">Visual Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detail smoke density, smells, toxic runoff, or waste quantities..." rows={4} className="w-full p-3 bg-slate-900 border border-white/5 focus:border-primary/50 rounded-xl text-xs text-white placeholder-muted-text outline-none transition-all resize-none" />
            </div>

            {/* Scanning Animation */}
            {isLoadingAI && (
              <div className="p-4 bg-secondary/5 rounded-xl border border-secondary/20 relative overflow-hidden">
                <div className="scan-line" />
                <div className="flex items-center gap-3">
                  <div className="animate-spin w-8 h-8 border-2 border-secondary border-t-transparent rounded-full" />
                  <div>
                    <p className="text-xs font-semibold text-secondary">Gemini Vision Pipeline Active</p>
                    <p className="text-[10px] text-muted-text mt-0.5">{scanMessage}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button type="button" onClick={handleAnalyzeWithAI} disabled={!selectedImage || isLoadingAI} className="btn-ripple flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-secondary to-blue-500 text-white text-xs font-bold transition-all disabled:opacity-40 disabled:pointer-events-none hover:shadow-lg hover:shadow-secondary/20 hover:-translate-y-0.5">
                <Sparkles className="w-4 h-4" />
                <span>{isLoadingAI ? 'Analyzing...' : 'Analyze with AI'}</span>
              </button>
              <button type="button" onClick={handleClear} className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-white/5 text-xs font-bold transition-all">
                Clear Form
              </button>
              <button type="submit" disabled={!selectedImage || !location || !isAnalyzed} className="btn-ripple flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary hover:bg-emerald-500 text-white text-xs font-bold transition-all disabled:opacity-40 disabled:pointer-events-none hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5">
                <Send className="w-4 h-4" />
                <span>Submit Report</span>
              </button>
            </div>

            {!isAnalyzed && selectedImage && (
              <div className="p-3 bg-warning/10 rounded-xl border border-warning/20 flex gap-2 items-center">
                <AlertCircle className="w-4 h-4 text-warning shrink-0" />
                <span className="text-[10px] text-muted-text">Run <strong>Analyze with AI</strong> first — Gemini will inspect the image and save results to MongoDB.</span>
              </div>
            )}
          </form>
        </div>

        <div className="lg:col-span-5 h-full space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-bold text-primary uppercase tracking-widest block">Results</span>
            <h2 className="text-xl font-extrabold text-white tracking-tight">Live Air Quality</h2>
            <p className="text-sm text-muted-text">Populated from the backend AQI response returned by OpenWeather.</p>
          </div>
          <AirQualityCard data={airQuality} isLoading={isLoadingAI} />
          <AIResultCard isLoading={isLoadingAI} isAnalyzed={isAnalyzed} result={aiResult} imageUrl={selectedImage} airQuality={airQuality} />
        </div>
      </div>
    </div>
  );
};
export default Report;
