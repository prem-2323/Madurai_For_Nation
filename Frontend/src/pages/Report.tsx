import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { UploadCard } from '../components/UploadCard';
import { AIResultCard } from '../components/AIResultCard';
import { AirQualityCard } from '../components/AirQualityCard';
import {
  MapPin, Navigation, Sparkles, Send, RefreshCw, AlertCircle, Check,
  Upload, Cpu, Map, FileCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PollutionReport, AIAnalysisResult, ReportStatus, AirQualityData } from '../types';
import { CATEGORIES } from '../data';
import { analyzePollutionImage, API_BASE_URL, imageUrlToFile } from '../api/analyze';

const SCAN_MESSAGES = [
  { text: 'Scanning smoke particles...', icon: '🔍' },
  { text: 'Detecting vehicles and emissions...', icon: '🚗' },
  { text: 'Analyzing pollution density...', icon: '📊' },
  { text: 'Checking severity levels...', icon: '⚠️' },
  { text: 'Estimating AQI impact...', icon: '🌬️' },
  { text: 'Generating health recommendations...', icon: '🏥' },
];

interface ReportProps { onAddReport: (report: PollutionReport) => void; token?: string | null; }

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
  const [scanIndex, setScanIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = useMemo(() => [
    { id: 1, label: 'Upload', icon: <Upload className="w-3 h-3" />, desc: 'Photo' },
    { id: 2, label: 'Location', icon: <Map className="w-3 h-3" />, desc: 'GPS' },
    { id: 3, label: 'AI Analysis', icon: <Cpu className="w-3 h-3" />, desc: 'Gemini' },
    { id: 4, label: 'Submit', icon: <FileCheck className="w-3 h-3" />, desc: 'Report' },
  ], []);

  useEffect(() => {
    if (selectedImage) setCurrentStep(1);
    if (location) setCurrentStep(2);
    if (isAnalyzed) setCurrentStep(3);
  }, [selectedImage, location, isAnalyzed]);

  useEffect(() => {
    if (!isLoadingAI) return;
    setScanIndex(0);
    const interval = setInterval(() => setScanIndex(prev => (prev + 1) % SCAN_MESSAGES.length), 2200);
    return () => clearInterval(interval);
  }, [isLoadingAI]);

  const handleImageSelected = (imageUrl: string, options?: { file?: File; category?: string; description?: string }) => {
    setSelectedImage(imageUrl);
    setSelectedFile(options?.file || null);
    setIsAnalyzed(false); setAiResult(null); setAirQuality(null); setSavedReportId(null);
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
        (pos) => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocation(`Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)}`); setIsLocating(false); },
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
    if (!selectedImage) { toast.error('Please upload a photo first.'); return; }
    setIsLoadingAI(true);
    try {
      const imageFile = await resolveImageFile();
      const { analysis, airQuality: aqiData, report } = await analyzePollutionImage({
        imageFile, latitude: coords.lat, longitude: coords.lng, description, location, token
      });
      setAiResult(analysis); setAirQuality(aqiData); setCategory(analysis.pollutionType);
      setIsAnalyzed(true); setSavedReportId(report.id);
      const si = report.image.startsWith('http') ? report.image : `${API_BASE_URL}${report.image}`;
      setSelectedImage(si);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'AI analysis failed', { id: 'ai-err' });
      setIsAnalyzed(false); setAiResult(null);
    } finally { setIsLoadingAI(false); }
  };

  const handleClear = () => {
    setSelectedImage(null); setSelectedFile(null); setDescription(''); setCategory(CATEGORIES[0]);
    setLocation(''); setCoords({ lat: 9.9252, lng: 78.1198 }); setIsAnalyzed(false);
    setAiResult(null); setAirQuality(null); setSavedReportId(null);
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImage) { toast.error('Upload an image first.'); return; }
    if (!location) { toast.error('Set coordinates.'); return; }
    if (!aiResult) { toast.error('Run AI analysis first.'); return; }
    try {
      const newReport: PollutionReport = {
        id: savedReportId || `REP-${Date.now()}`,
        imageUrl: selectedImage, category: aiResult.pollutionType,
        description: description || aiResult.reason || `Reported ${aiResult.pollutionType.toLowerCase()}.`,
        severity: aiResult.severity, location, coordinates: coords,
        time: new Date().toISOString(), status: 'AI Analyzed' as ReportStatus,
        confidence: aiResult.confidence, healthRisk: aiResult.healthRisk,
        recommendation: aiResult.recommendation, pollutionDetected: aiResult.pollutionDetected,
        reason: aiResult.reason, estimatedPM25Impact: aiResult.estimatedPM25Impact,
        estimatedPM10Impact: aiResult.estimatedPM10Impact, emergencyLevel: aiResult.emergencyLevel,
        needsMunicipalAction: aiResult.needsMunicipalAction, possibleSource: aiResult.possibleSource,
        priority: aiResult.priority, airQuality: airQuality ?? undefined,
      };
      onAddReport(newReport);
      toast.success('Report submitted! Awaiting municipal review.', { id: 'submit-ok' });
      setTimeout(() => navigate('/citizen/reports'), 1500);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit', { id: 'submit-err' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold text-primary uppercase tracking-[0.15em] block">Citizen Node · Madurai Municipal</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight"><span className="text-gradient">Report Localized Pollution</span></h1>
          <p className="text-xs text-muted-text">Upload a photo. Gemini 2.5 Flash inspects it. Data feeds the dashboard and map.</p>
        </div>
      </motion.div>

      {/* Stepper */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}
        className="glass-panel rounded-xl p-2.5 sm:p-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          {steps.map((step, i) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center gap-0.5">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-bold transition-all ${
                  currentStep >= i ? 'bg-gradient-to-br from-primary to-secondary text-white' : currentStep === i - 1
                    ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-slate-800/80 text-muted-text border border-white/5'
                }`}>{currentStep > i ? <Check className="w-2.5 h-2.5" /> : step.icon}</div>
                <span className={`text-[8px] font-semibold ${currentStep >= i ? 'text-white' : 'text-muted-text'}`}>{step.label}</span>
              </div>
              {i < steps.length - 1 && <div className={`flex-1 h-px mx-1 rounded-full ${currentStep > i ? 'bg-gradient-to-r from-primary to-secondary' : 'bg-white/5'}`} />}
            </React.Fragment>
          ))}
        </div>
      </motion.div>

      {/* Two-column layout with equal-height rows */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT COLUMN (60%): Upload + Form */}
        <div className="lg:col-span-3 grid grid-rows-[auto_1fr] gap-6">
          <UploadCard onImageSelected={handleImageSelected} selectedImage={selectedImage} onClear={handleClear} />

          <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            onSubmit={handleSubmitReport} className="glass-panel rounded-2xl p-5 flex flex-col h-full">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-primary/10"><MapPin className="w-3.5 h-3.5 text-primary" /></div>
                <div><h3 className="text-sm font-bold text-white">Report Details</h3><p className="text-[9px] text-muted-text/60">Category, location, description</p></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-white uppercase tracking-wider">Category</label>
                  <select value={category} onChange={(e) => { setCategory(e.target.value); setIsAnalyzed(false); setAiResult(null); }}
                    className="w-full p-2 bg-slate-900 border border-white/5 focus:border-primary/50 rounded-xl text-xs text-white outline-none cursor-pointer transition-all">
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    {aiResult && !CATEGORIES.includes(aiResult.pollutionType) && <option value={aiResult.pollutionType}>{aiResult.pollutionType}</option>}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-white uppercase tracking-wider flex items-center justify-between">
                    <span>Coordinates</span>
                    <span className="text-[8px] text-muted-text/60 font-normal">GPS</span>
                  </label>
                  <div className="flex gap-1.5">
                    <div className="relative flex-1">
                      <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-text" />
                      <input type="text" required value={location} onChange={(e) => setLocation(e.target.value)}
                        placeholder="Enter location..." className="w-full pl-8 pr-2.5 py-2 bg-slate-900 border border-white/5 focus:border-primary/50 rounded-xl text-xs text-white placeholder-muted-text/50 outline-none transition-all" />
                    </div>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="button" onClick={handleGetLocation} disabled={isLocating}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-white/5 disabled:opacity-50 transition-all" title="Get location">
                      {isLocating ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-secondary" /> : <Navigation className="w-3.5 h-3.5 text-secondary" />}
                    </motion.button>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-white uppercase tracking-wider">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe smoke density, smells, waste quantities..."
                  rows={2} className="w-full p-2.5 bg-slate-900 border border-white/5 focus:border-primary/50 rounded-xl text-xs text-white placeholder-muted-text/50 outline-none transition-all resize-none" />
              </div>

              <AnimatePresence>
                {isLoadingAI && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="relative overflow-hidden">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-secondary/10 to-blue-500/10 border border-secondary/20 relative overflow-hidden">
                      <div className="scan-line" />
                      <div className="flex items-center gap-3 relative z-10">
                        <div className="relative shrink-0">
                          <div className="w-8 h-8 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" />
                          <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-secondary animate-pulse" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2"><span className="text-xs font-bold text-secondary">Gemini Pipeline</span><span className="text-[8px] text-secondary/60 font-mono">gemini-2.5-flash</span></div>
                          <AnimatePresence mode="wait">
                            <motion.p key={scanIndex} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}
                              className="text-[10px] text-muted-text mt-0.5">{SCAN_MESSAGES[scanIndex].icon} {SCAN_MESSAGES[scanIndex].text}</motion.p>
                          </AnimatePresence>
                        </div>
                      </div>
                      <motion.div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-secondary to-blue-400" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 13, ease: 'linear' }} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex-shrink-0 space-y-4 pt-5">
              <div className="flex flex-col sm:flex-row gap-2">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="button" onClick={handleAnalyzeWithAI}
                  disabled={!selectedImage || isLoadingAI}
                  className="btn-ripple flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-secondary to-blue-500 text-white text-xs font-bold transition-all disabled:opacity-40 disabled:pointer-events-none hover:shadow-lg hover:shadow-secondary/20">
                  <Sparkles className="w-3.5 h-3.5" />{isLoadingAI ? 'Analyzing...' : 'Analyze with AI'}</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="button" onClick={handleClear}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-white/5 text-xs font-bold transition-all">Clear</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit"
                  disabled={!selectedImage || !location || !isAnalyzed}
                  className="btn-ripple flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-emerald-500 text-white text-xs font-bold transition-all disabled:opacity-40 disabled:pointer-events-none hover:shadow-lg hover:shadow-primary/20">
                  <Send className="w-3.5 h-3.5" /> Submit Report</motion.button>
              </div>

              <AnimatePresence>
                {!isAnalyzed && selectedImage && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                    className="p-2.5 bg-warning/10 rounded-xl border border-warning/20 flex gap-2 items-center">
                    <AlertCircle className="w-3.5 h-3.5 text-warning shrink-0" />
                    <span className="text-[9px] text-muted-text">Run <strong className="text-white">Analyze with AI</strong> to inspect and save to database.</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.form>
        </div>

        {/* RIGHT COLUMN (40%): AQI + AI Diagnostics */}
        <div className="lg:col-span-2 grid grid-rows-[auto_auto_1fr] gap-5">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="space-y-0.5">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-[0.15em] block">Live Monitoring</span>
            <h2 className="text-lg font-extrabold tracking-tight"><span className="text-gradient-blue">Real-Time Air Quality</span></h2>
            <p className="text-xs text-muted-text">OpenWeather data for your coordinates.</p>
          </motion.div>

          <AirQualityCard data={airQuality} isLoading={isLoadingAI} />
          <AIResultCard isLoading={isLoadingAI} isAnalyzed={isAnalyzed} result={aiResult} imageUrl={selectedImage} airQuality={airQuality} />
        </div>
      </div>

      {/* Footer */}
      <div className="text-center"><span className="text-[8px] text-muted-text/40">Madurai For Nation · AI-Powered Environmental Monitoring Platform</span></div>
    </div>
  );
};
export default Report;
