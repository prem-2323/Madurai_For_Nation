import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Camera, Trash2, ImageIcon, MapPin, Clock, FileText, HardDrive } from 'lucide-react';

interface UploadCardProps {
  onImageSelected: (imageUrl: string, options?: { file?: File; category?: string; description?: string }) => void;
  selectedImage: string | null;
  onClear: () => void;
}

export const UploadCard: React.FC<UploadCardProps> = ({ onImageSelected, selectedImage, onClear }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'camera'>('upload');
  const [cameraState, setCameraState] = useState<'idle' | 'loading' | 'active'>('idle');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [fileMeta, setFileMeta] = useState<{ name: string; size: string; timestamp: string; gps: string } | null>(null);

  useEffect(() => {
    return () => { if (stream) { stream.getTracks().forEach((t) => t.stop()); } };
  }, [stream]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) { alert('Please upload an image file (PNG, JPG, WEBP).'); return; }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFileMeta({
          name: file.name,
          size: formatSize(file.size),
          timestamp: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          gps: 'Pending',
        });
        onImageSelected(event.target.result as string, { file });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => { setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]); };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) processFile(e.target.files[0]); };
  const triggerFileSelect = () => fileInputRef.current?.click();

  const stopCamera = useCallback(() => {
    if (stream) { stream.getTracks().forEach((t) => t.stop()); setStream(null); }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraState('idle');
  }, [stream]);

  const startCamera = async () => {
    setCameraState('loading');
    try {
      let ms;
      try { ms = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }); }
      catch { ms = await navigator.mediaDevices.getUserMedia({ video: true }); }
      setStream(ms); setCameraState('active');
      requestAnimationFrame(() => { const v = videoRef.current; if (v) { v.srcObject = ms; v.play().catch(() => {}); } });
    } catch (err: any) {
      setCameraState('idle');
      alert(err instanceof DOMException && err.name === 'NotAllowedError'
        ? 'Camera permission denied.' : 'Could not access camera: ' + err.message);
    }
  };

  const captureSnapshot = () => {
    const v = videoRef.current; const c = canvasRef.current;
    if (!v || !c) return;
    c.width = v.videoWidth || 640; c.height = v.videoHeight || 480;
    const ctx = c.getContext('2d'); if (!ctx) return;
    ctx.drawImage(v, 0, 0);
    const dataUrl = c.toDataURL('image/jpeg');
    const bs = atob(dataUrl.split(',')[1]);
    const ab = new ArrayBuffer(bs.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < bs.length; i++) ia[i] = bs.charCodeAt(i);
    const blob = new Blob([ab], { type: 'image/jpeg' });
    const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
    setFileMeta({ name: 'camera-capture.jpg', size: formatSize(blob.size), timestamp: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }), gps: 'Pending' });
    onImageSelected(dataUrl, { file, description: '[Camera Capture]' });
    stopCamera();
  };

  const handleClear = () => { setFileMeta(null); onClear(); if (cameraState !== 'idle') stopCamera(); };

  const handleLocationDetected = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => setFileMeta(prev => prev ? { ...prev, gps: 'Acquired' } : null),
        () => setFileMeta(prev => prev ? { ...prev, gps: 'Failed' } : null)
      );
    }
  };

  return (
    <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden flex flex-col h-full shadow-xl">
      {/* Tab bar */}
      <div className="flex bg-slate-900/60 border-b border-white/5 p-1 gap-1">
        {[
          { id: 'upload' as const, label: 'Upload File', icon: <Upload className="w-3.5 h-3.5" />, accent: 'text-primary' },
          { id: 'camera' as const, label: 'Live Camera', icon: <Camera className="w-3.5 h-3.5" />, accent: 'text-rose-500' },
        ].map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); if (cameraState !== 'idle') stopCamera(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === tab.id ? 'bg-slate-800 text-white border border-white/5 shadow-inner' : 'text-muted-text hover:text-white hover:bg-slate-800/40'
            }`}
          >{tab.icon}<span className="hidden sm:inline">{tab.label}</span></button>
        ))}
      </div>

      <div className="p-5 flex-1 flex flex-col">
        {selectedImage ? (
          <div className="space-y-3">
            {/* Image preview */}
            <div className="relative group w-full h-48 rounded-xl overflow-hidden border border-white/10 bg-slate-950/80">
              <img src={selectedImage} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button onClick={handleClear} className="p-2.5 rounded-full bg-danger hover:bg-red-600 text-white hover:scale-110 shadow-lg transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="absolute top-2 left-2 bg-slate-900/90 border border-white/10 text-success text-[9px] px-2 py-1 rounded-lg font-mono flex items-center gap-1.5 backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Image Loaded
              </div>
            </div>

            {/* File metadata */}
            {fileMeta && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-2">
                {[
                  { icon: <FileText className="w-3 h-3" />, label: 'File', value: fileMeta.name },
                  { icon: <HardDrive className="w-3 h-3" />, label: 'Size', value: fileMeta.size },
                  { icon: <Clock className="w-3 h-3" />, label: 'Captured', value: fileMeta.timestamp },
                  { icon: <MapPin className="w-3 h-3" />, label: 'GPS', value: fileMeta.gps, action: fileMeta.gps === 'Pending' ? handleLocationDetected : undefined },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-slate-900/60 rounded-lg border border-white/5 cursor-default" onClick={item.action}>
                    <span className="text-muted-text shrink-0">{item.icon}</span>
                    <div className="min-w-0">
                      <span className="text-[8px] uppercase font-bold text-muted-text block">{item.label}</span>
                      <span className={`text-[10px] font-medium truncate block ${item.action ? 'text-secondary cursor-pointer hover:underline' : 'text-white'}`}>{item.value}</span>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        ) : (
          <div className="h-full">
            <AnimatePresence mode="wait">
              {activeTab === 'upload' ? (
                <motion.div key="upload" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={triggerFileSelect}
                  className={`w-full h-48 border-2 border-dashed rounded-xl cursor-pointer flex flex-col items-center justify-center text-center p-5 transition-all duration-300 relative overflow-hidden group ${
                    isDragging ? 'border-secondary bg-secondary/5 shadow-[0_0_40px_rgba(14,165,233,0.15)]' : 'border-white/10 hover:border-primary/50 hover:bg-slate-800/40'
                  }`}
                >
                  {isDragging && <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: [0.8, 1.2, 0.8], opacity: [0, 0.5, 0] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-0 bg-gradient-to-t from-secondary/20 to-transparent pointer-events-none rounded-xl" />}
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                  <div className="p-3 bg-slate-900 rounded-2xl border border-white/5 text-primary mb-3 transition-transform group-hover:scale-110"><Upload className="w-6 h-6" /></div>
                  <p className="text-white text-sm font-semibold mb-0.5">Drop your photo here</p>
                  <p className="text-muted-text text-[11px] max-w-xs">PNG, JPG, or WEBP · Up to 10MB</p>
                  <button type="button" className="mt-3 px-4 py-1.5 bg-slate-800 border border-white/5 text-[11px] font-semibold text-white rounded-lg hover:bg-slate-700 transition-colors">Browse Files</button>
                </motion.div>
              ) : (
                <motion.div key="camera" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="w-full h-48 border border-white/10 rounded-xl bg-slate-950 flex flex-col items-center justify-center text-center overflow-hidden relative"
                >
                  <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${cameraState === 'active' ? '' : 'hidden'}`} />
                  <canvas ref={canvasRef} className="hidden" />

                  {cameraState === 'idle' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                      <div className="p-3 bg-rose-500/10 rounded-full text-rose-500 mb-3"><Camera className="w-6 h-6" /></div>
                      <span className="text-xs font-bold text-white block">Use Device Camera</span>
                      <span className="text-[10px] text-muted-text mt-1 mb-3">Take a photo of the pollution site.</span>
                      <button type="button" onClick={startCamera} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors">Open Camera</button>
                    </div>
                  )}
                  {cameraState === 'loading' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
                      <span className="text-xs text-rose-500 font-bold animate-pulse">Requesting camera...</span>
                    </div>
                  )}
                  {cameraState === 'active' && (
                    <div className="absolute inset-0 flex flex-col justify-between p-3 pointer-events-none">
                      <div className="flex items-center text-rose-500 text-[9px] font-mono"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse mr-1" /> CAMERA_LIVE</div>
                      <div className="flex justify-center gap-2 pointer-events-auto">
                        <button type="button" onClick={stopCamera} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[11px] font-semibold border border-white/5">Cancel</button>
                        <button type="button" onClick={captureSnapshot} className="flex items-center gap-1 px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[11px] font-semibold shadow-lg"><Camera className="w-3.5 h-3.5" /> Capture</button>
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
