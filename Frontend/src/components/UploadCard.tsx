import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Camera, Trash2, Sparkles } from 'lucide-react';

interface UploadCardProps {
  onImageSelected: (
    imageUrl: string,
    options?: { file?: File; category?: string; description?: string }
  ) => void;
  selectedImage: string | null;
  onClear: () => void;
}

export const UploadCard: React.FC<UploadCardProps> = ({
  onImageSelected,
  selectedImage,
  onClear,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'camera'>('upload');
  const [cameraState, setCameraState] = useState<'idle' | 'loading' | 'active'>('idle');
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

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
        onImageSelected(event.target.result as string, { file });
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraState('idle');
  }, [stream]);

  const startCamera = async () => {
    setCameraState('loading');
    try {
      let mediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      } catch {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      setStream(mediaStream);
      setCameraState('active');

      requestAnimationFrame(() => {
        const video = videoRef.current;
        if (video) {
          video.srcObject = mediaStream;
          video.play().catch(() => {});
        }
      });
    } catch (err) {
      setCameraState('idle');
      const msg = err instanceof DOMException && err.name === 'NotAllowedError'
        ? 'Camera permission was denied. Please allow camera access in your browser settings and try again.'
        : err instanceof DOMException && err.name === 'NotFoundError'
          ? 'No camera found on this device.'
          : 'Could not access camera: ' + err.message;
      alert(msg);
    }
  };

  const captureSnapshot = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg');

    const byteString = atob(dataUrl.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: 'image/jpeg' });
    const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });

    onImageSelected(dataUrl, { file, description: '[Camera Capture] Live photograph taken from device camera.' });
    stopCamera();
  };

  return (
    <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden flex flex-col h-full shadow-xl">
      
      <div className="flex bg-slate-900/60 border-b border-white/5 p-1 gap-1">
        <button
          onClick={() => { setActiveTab('upload'); if (cameraState !== 'idle') stopCamera(); }}
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

      <div className="p-6 flex-1 flex flex-col justify-center min-h-[320px]">
        
        {selectedImage ? (
          <div className="relative group w-full h-64 rounded-xl overflow-hidden border border-white/10 bg-slate-950/80">
            <img
              src={selectedImage}
              alt="Uploaded Pollution"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  onClear();
                  if (cameraState !== 'idle') stopCamera();
                }}
                className="p-3 rounded-full bg-danger hover:bg-red-600 text-white hover:scale-110 shadow-lg transition-all"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-white/10 text-success text-[10px] px-2.5 py-1 rounded-lg font-mono flex items-center gap-1.5 backdrop-blur-md">
              <Sparkles className="w-3 h-3 text-success animate-pulse" />
              Image Loaded
            </div>
          </div>
        ) : (
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

              {activeTab === 'camera' && (
                <motion.div
                  key="camera"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="w-full h-64 border border-white/10 rounded-xl bg-slate-950 flex flex-col items-center justify-center text-center p-0 overflow-hidden relative"
                >
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${cameraState === 'active' ? '' : 'hidden'}`}
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {cameraState === 'idle' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 p-4">
                      <div className="p-4 bg-rose-500/10 rounded-full text-rose-500 inline-block">
                        <Camera className="w-7 h-7" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">Use Device Camera</span>
                        <span className="text-[10px] text-muted-text block max-w-xs mt-1">Take a photo of the pollution using your device camera.</span>
                      </div>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-rose-600/10 transition-colors"
                      >
                        Open Camera
                      </button>
                    </div>
                  )}

                  {cameraState === 'loading' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3">
                      <div className="w-10 h-10 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
                      <span className="text-xs text-rose-500 font-bold block animate-pulse">Requesting camera access...</span>
                    </div>
                  )}

                  {cameraState === 'active' && (
                    <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
                      <div className="flex items-center justify-between text-rose-500 text-[10px] font-mono">
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> CAMERA_LIVE</span>
                      </div>
                      <div className="flex justify-center gap-3 pointer-events-auto">
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold border border-white/5"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={captureSnapshot}
                          className="flex items-center gap-1 px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-rose-600/25"
                        >
                          <Camera className="w-4 h-4" /> Capture
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