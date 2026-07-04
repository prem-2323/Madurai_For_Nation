import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Camera, Trash2, Image as ImageIcon, Sparkles, AlertCircle, Play } from 'lucide-react';

interface PresetPhoto {
  id: string;
  name: string;
  url: string;
  category: string;
  description: string;
}

export const PRESET_PHOTOS: PresetPhoto[] = [
  {
    id: 'pr-1',
    name: 'Refinery Plume',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    category: 'Industrial Emissions',
    description: 'Thick smoke plume rising from industrial chimneys settled over local atmosphere.'
  },
  {
    id: 'pr-2',
    name: 'Wetland Litter',
    url: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?auto=format&fit=crop&w=800&q=80',
    category: 'Illegal Waste Dumping',
    description: 'Abandoned plastic canisters and containers rotting in wild wetland preservation spaces.'
  },
  {
    id: 'pr-3',
    name: 'Highway Smog',
    url: 'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?auto=format&fit=crop&w=800&q=80',
    category: 'Exhaust & Traffic Smog',
    description: 'Thick brown nitrogen-dioxide smog hanging above major urban multi-lane highway interchanges.'
  },
  {
    id: 'pr-4',
    name: 'Redevelopment Dust',
    url: 'https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?auto=format&fit=crop&w=800&q=80',
    category: 'Construction Dust',
    description: 'Dry concrete dust and topsoil blown from demolition site due to lack of wet suppression.'
  },
  {
    id: 'pr-5',
    name: 'Chemical Lake Runoff',
    url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
    category: 'Water Contamination',
    description: 'Strange fluorescent green algae blooms and chemical sheen pooling on public lake boundaries.'
  }
];

interface UploadCardProps {
  onImageSelected: (imageUrl: string, presetData?: { category: string; description: string }) => void;
  selectedImage: string | null;
  onClear: () => void;
}

export const UploadCard: React.FC<UploadCardProps> = ({
  onImageSelected,
  selectedImage,
  onClear,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'camera' | 'presets'>('upload');
  const [cameraState, setCameraState] = useState<'idle' | 'loading' | 'active' | 'captured'>('idle');

  // Drag-and-drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WEBP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        onImageSelected(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Camera simulator
  const startCamera = () => {
    setCameraState('loading');
    setTimeout(() => {
      setCameraState('active');
    }, 800);
  };

  const captureSnapshot = () => {
    setCameraState('captured');
    // Select a random sample preset URL as a simulated snapshot
    const randomPreset = PRESET_PHOTOS[Math.floor(Math.random() * PRESET_PHOTOS.length)];
    onImageSelected(randomPreset.url, {
      category: randomPreset.category,
      description: `[Camera Capture] Simulated live camera photograph containing signs of ${randomPreset.category.toLowerCase()}.`
    });
  };

  const resetCamera = () => {
    setCameraState('idle');
    onClear();
  };

  return (
    <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden flex flex-col h-full shadow-xl">
      
      {/* Upload Modes Tab Header */}
      <div className="flex bg-slate-900/60 border-b border-white/5 p-1 gap-1">
        <button
          onClick={() => { setActiveTab('upload'); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
            activeTab === 'upload'
              ? 'bg-slate-800 text-white border border-white/5 shadow-inner'
              : 'text-muted-text hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Upload className="w-4 h-4 text-primary" />
          <span>Upload File</span>
        </button>

        <button
          onClick={() => { setActiveTab('presets'); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
            activeTab === 'presets'
              ? 'bg-slate-800 text-white border border-white/5 shadow-inner'
              : 'text-muted-text hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <ImageIcon className="w-4 h-4 text-secondary" />
          <span>Demo Presets</span>
        </button>

        <button
          onClick={() => { setActiveTab('camera'); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
            activeTab === 'camera'
              ? 'bg-slate-800 text-white border border-white/5 shadow-inner'
              : 'text-muted-text hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Camera className="w-4 h-4 text-rose-500" />
          <span>Live Camera</span>
        </button>
      </div>

      {/* Main Upload / View Panel */}
      <div className="p-6 flex-1 flex flex-col justify-center min-h-[320px]">
        
        {/* If Image is Selected, show Beautiful Preview */}
        {selectedImage ? (
          <div className="relative group w-full h-64 rounded-xl overflow-hidden border border-white/10 bg-slate-950/80">
            <img
              src={selectedImage}
              alt="Uploaded Pollution"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {/* Dark Hover overlay with Delete controls */}
            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  onClear();
                  if (activeTab === 'camera') setCameraState('idle');
                }}
                className="p-3 rounded-full bg-danger hover:bg-red-600 text-white hover:scale-110 shadow-lg transition-all"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            {/* Small Sparkle Badge */}
            <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-white/10 text-success text-[10px] px-2.5 py-1 rounded-lg font-mono flex items-center gap-1.5 backdrop-blur-md">
              <Sparkles className="w-3 h-3 text-success animate-pulse" />
              Image Loaded
            </div>
          </div>
        ) : (
          /* TAB CONTENT FOR NO IMAGE CHOSEN */
          <div className="h-full">
            <AnimatePresence mode="wait">
              {activeTab === 'upload' && (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={triggerFileSelect}
                  className={`w-full h-64 border-2 border-dashed rounded-xl cursor-pointer flex flex-col items-center justify-center text-center p-6 transition-all duration-300 ${
                    isDragging
                      ? 'border-secondary bg-secondary/5 scale-98 shadow-lg shadow-secondary/5'
                      : 'border-white/10 hover:border-primary/50 hover:bg-slate-800/40'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  
                  <div className="p-4 bg-slate-900 rounded-2xl border border-white/5 text-primary mb-4 transition-transform duration-300 group-hover:scale-110">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  
                  <p className="text-white text-sm font-semibold mb-1">
                    Drag and drop your pollution photo
                  </p>
                  <p className="text-muted-text text-xs max-w-xs leading-normal">
                    Supports PNG, JPEG, or WEBP. Up to 10MB local file size.
                  </p>
                  
                  <button
                    type="button"
                    className="mt-4 px-4 py-1.5 bg-slate-800 border border-white/5 text-xs font-semibold text-white rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    Select Local File
                  </button>
                </motion.div>
              )}

              {activeTab === 'presets' && (
                <motion.div
                  key="presets"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="text-left mb-3">
                    <span className="text-xs font-bold text-white block">Environmental Preset Library</span>
                    <span className="text-[11px] text-muted-text">Select a high-resolution scenario to trigger the simulated AI model evaluation.</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[190px] overflow-y-auto pr-1">
                    {PRESET_PHOTOS.map((photo) => (
                      <div
                        key={photo.id}
                        onClick={() => onImageSelected(photo.url, { category: photo.category, description: photo.description })}
                        className="flex items-center gap-3 p-2 bg-slate-900 border border-white/5 rounded-xl cursor-pointer hover:border-secondary/30 hover:bg-slate-800/55 transition-all text-left"
                      >
                        <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                          <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-white block truncate">{photo.name}</span>
                          <span className="text-[9px] text-secondary font-semibold block truncate">{photo.category}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-slate-900/50 rounded-xl border border-white/5 flex gap-2 items-center">
                    <AlertCircle className="w-4 h-4 text-secondary shrink-0" />
                    <span className="text-[10px] text-muted-text">Preset selection fills Category & Description automatically for convenient testing.</span>
                  </div>
                </motion.div>
              )}

              {activeTab === 'camera' && (
                <motion.div
                  key="camera"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="w-full h-64 border border-white/10 rounded-xl bg-slate-950 flex flex-col items-center justify-center text-center p-4 overflow-hidden relative"
                >
                  {cameraState === 'idle' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-rose-500/10 rounded-full text-rose-500 inline-block">
                        <Camera className="w-7 h-7" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">Simulate Local Camera Module</span>
                        <span className="text-[10px] text-muted-text block max-w-xs mt-1">Simulate snaps utilizing device permissions in AI Studio preview.</span>
                      </div>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-rose-600/10 transition-colors"
                      >
                        Activate Camera Node
                      </button>
                    </div>
                  )}

                  {cameraState === 'loading' && (
                    <div className="space-y-3">
                      <div className="w-10 h-10 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin inline-block" />
                      <span className="text-xs text-rose-500 font-bold block animate-pulse">Initializing CMOS lens...</span>
                    </div>
                  )}

                  {cameraState === 'active' && (
                    <div className="absolute inset-0 flex flex-col justify-between p-4 bg-slate-900">
                      {/* Lens Scan HUD */}
                      <div className="flex items-center justify-between text-rose-500 text-[10px] font-mono">
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> CAMERA_STREAMING</span>
                        <span>RES: 1080P_SENS</span>
                      </div>

                      {/* Mock Lens crosshair */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 border border-white/20 rounded-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                      </div>

                      {/* Camera Capture buttons */}
                      <div className="flex justify-center gap-3 z-10">
                        <button
                          type="button"
                          onClick={resetCamera}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-semibold border border-white/5"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={captureSnapshot}
                          className="flex items-center gap-1 px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-semibold shadow-lg shadow-rose-600/25"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" /> Capture Snap
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

      </div>
    </div>
  );
};
