import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, RefreshCw, Info, Scan, Box, Utensils, Accessibility, Zap, ChevronRight, Activity } from 'lucide-react';

type ScannerType = 'fridge' | 'plate' | 'posture' | 'ingredient' | 'volume' | 'barcode' | 'skin';

export const TheVision: React.FC = () => {
  const [activeScanner, setActiveScanner] = useState<ScannerType>('fridge');
  const [isScanning, setIsScanning] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shutterEffect, setShutterEffect] = useState(false);

  // AR Scanner Advanced State
  const [scanState, setScanState] = useState<'searching' | 'locked' | 'analyzing' | 'success' | 'non-food'>('searching');
  const scanStateRef = useRef(scanState);
  useEffect(() => { scanStateRef.current = scanState; }, [scanState]);

  const [neoLog, setNeoLog] = useState<string>('');
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const scanTimerRef = useRef<NodeJS.Timeout | null>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Camera access denied:", err);
      }
    };
    startCamera();
  }, []);

  const handleScannerChange = (type: ScannerType) => {
    setShutterEffect(true);
    setTimeout(() => {
      setActiveScanner(type);
      setShutterEffect(false);
      // Reset scanning state when scanner changes
      setScanState('searching');
      setNeoLog('');
      setScanProgress(0);
      setIsFlashOn(false);
    }, 300);
  };

  // AR Scanner Logic
  const typeNeoLog = (text: string, tag: '[NEO_LOG]: ' | '[SENS_ADVICE]: ' = '[NEO_LOG]: ') => {
    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    setNeoLog('');
    let i = 0;
    const fullText = tag + text;
    typingIntervalRef.current = setInterval(() => {
      setNeoLog(fullText.slice(0, i + 1));
      i++;
      if (i >= fullText.length) {
        if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
      }
    }, 30);
  };

  useEffect(() => {
    if (isScanning) {
      setScanState('searching');
      setNeoLog('');
      setScanProgress(0);
      setIsFlashOn(false);
      
      const startAnalysis = () => {
        let p = 0;
        const pInterval = setInterval(() => {
          p += 2; // Slower, more realistic analysis
          setScanProgress(p);
          if (p >= 100) {
            clearInterval(pInterval);
            setScanState('success');
            setTimeout(() => {
              setShowResults(true);
              setIsScanning(false);
            }, 800);
          }
        }, 50);
      };

      // 5-second Neo Intervention Timer
      scanTimerRef.current = setTimeout(() => {
        if (scanStateRef.current === 'searching') {
          const scenarios = [
            { msg: "Halki light ki kami hai, can you move closer?", flash: true },
            { msg: "Object clear nahi hai, please hold steady.", haptic: true },
            { msg: "Light kam hai, turning on the flash.", flash: true },
            { msg: "Focus thoda off hai. Camera steady rakhiye, let me lock-on to the pixels.", haptic: true }
          ];
          const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
          typeNeoLog(scenario.msg, '[SENS_ADVICE]: ');
          if (scenario.flash) setIsFlashOn(true);
          if (window.navigator.vibrate && scenario.haptic) window.navigator.vibrate([10, 30, 10]);
          
          // After intervention, force a lock-on
          setTimeout(() => {
            if (scanStateRef.current === 'searching') {
              setScanState('locked');
              if (window.navigator.vibrate) window.navigator.vibrate(50);
              typeNeoLog("Target Acquired via Enhanced Sensors. Analyzing...");
              startAnalysis();
            }
          }, 2500);
        }
      }, 5000);

      // Simulation: Randomly find something between 2s and 8s
      const detectionDelay = Math.random() * 6000 + 2000;
      const detectionTimer = setTimeout(() => {
        if (scanStateRef.current !== 'searching') return;
        
        const roll = Math.random();
        if (roll > 0.9) {
          // Non-food detection
          setScanState('non-food');
          const nonFoodLines = [
            "Ye kafi colorful hai, but nutrition zero. Isse workout nahi, sirf playtime ho sakta hai. Please scan actual food.",
            "Netflix binging is fun, par isme protein nahi milega. Try scanning your dinner plate instead.",
            "Cute distraction! But your pet is a friend, not a snack. Looking for something for your mother's diet plan?"
          ];
          typeNeoLog(nonFoodLines[Math.floor(Math.random() * nonFoodLines.length)]);
          // Allow retry after 3s
          setTimeout(() => {
            if (scanStateRef.current === 'non-food') {
              setScanState('searching');
              typeNeoLog("Recalibrating... Please align a valid target.");
            }
          }, 4000);
        } else {
          // Success Lock-on
          setScanState('locked');
          if (window.navigator.vibrate) window.navigator.vibrate(50); // Haptic Click
          typeNeoLog("Target Locked. Running Freshness Index & Bio-Liveness Scan...");
          startAnalysis();
        }
      }, detectionDelay);

      return () => {
        if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
        clearTimeout(detectionTimer);
        if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
      };
    }
  }, [isScanning, activeScanner]);

  const scannerInfo = {
    fridge: { icon: <Box />, label: 'Fridge Scan', desc: 'Detects ingredients & suggests synergy-based snacks' },
    plate: { icon: <Utensils />, label: 'Plate Scan', desc: 'Instant nutrient absorption & metabolic impact' },
    volume: { icon: <Scan />, label: '3D Portion Estimator', desc: 'Calculates exact volume (grams) via depth-sensing' },
    barcode: { icon: <Zap />, label: 'Barcode Truth Filter', desc: 'Strips marketing buzzwords to show raw metabolic impact' },
    skin: { icon: <Activity />, label: 'Skin Hydration', desc: 'Analyzes texture to estimate cellular hydration levels' },
    posture: { icon: <Accessibility />, label: 'Posture Stress Map', desc: '3D skeletal overlay with real-time stress heatmaps' },
    ingredient: { icon: <Zap />, label: 'Ingredient Spotlight', desc: 'Deep-dive metabolic breakdown of physical items' }
  };

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden">
      {/* Viewfinder */}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        className="absolute inset-0 w-full h-full object-cover opacity-80"
      />
      
      {/* Shutter Blur Effect */}
      <AnimatePresence>
        {shutterEffect && (
          <motion.div 
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(40px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center"
          >
            <div className="w-24 h-24 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* AR Overlays */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[60vh] border transition-all duration-500 rounded-[40px] ${
          scanState === 'locked' ? 'border-blue-500 shadow-[0_0_50px_rgba(59,130,246,0.4)]' : 
          scanState === 'non-food' ? 'border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.4)]' :
          'border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.05)]'
        }`}>
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white rounded-tl-2xl" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white rounded-tr-2xl" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white rounded-bl-2xl" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white rounded-br-2xl" />
          
          {/* Scanning Animation */}
          <motion.div 
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className={`absolute left-0 right-0 h-px shadow-[0_0_15px_currentColor] transition-colors duration-500 ${
              scanState === 'locked' ? 'text-blue-400' : 
              scanState === 'non-food' ? 'text-red-400' : 'text-blue-400/50'
            }`}
          />

          {/* Lock-on Bounding Box */}
          <AnimatePresence>
            {scanState === 'locked' && (
              <motion.div 
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-blue-400 rounded-3xl flex items-center justify-center"
              >
                {/* Progress Ring */}
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="96" cy="96" r="80"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeDasharray="502.4"
                    strokeDashoffset={502.4 - (502.4 * scanProgress) / 100}
                    className={`transition-colors duration-300 ${scanProgress < 100 ? 'text-amber-400' : 'text-green-400'}`}
                  />
                </svg>
                <div className="absolute text-center">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-blue-400">Lock-On</p>
                  <p className="text-xl font-light text-white">{scanProgress}%</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Flash Overlay */}
      <AnimatePresence>
        {isFlashOn && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white pointer-events-none z-10"
          />
        )}
      </AnimatePresence>

      {/* Neo Guidance Overlay */}
      <AnimatePresence>
        {isScanning && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="absolute bottom-40 left-8 right-8 z-20"
          >
            <div className="bg-black/80 backdrop-blur-md border border-white/10 p-6 rounded-3xl min-h-[100px] flex flex-col justify-center relative overflow-hidden">
              {/* Audio Waveform Simulation */}
              <div className="absolute top-0 left-0 right-0 h-1 flex items-end gap-1 px-6 opacity-30">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: [2, Math.random() * 15 + 5, 2] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.05 }}
                    className="flex-1 bg-green-400 rounded-t-full"
                  />
                ))}
              </div>
              
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Neo Voice Module [Active]</span>
              </div>
              <p className="font-mono text-sm tracking-tight text-green-400 leading-relaxed">
                {neoLog || "[SYSTEM_SCAN_FAILED]: Recalibrating sensors... Please align object within the Matrix."}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Bleed Transition */}
      <AnimatePresence>
        {showResults && (
          <motion.div 
            initial={{ opacity: 0, scale: 1.1, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, scale: 1, backdropFilter: 'blur(40px)' }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-8 text-center"
          >
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-6 max-w-md"
            >
              <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
                <Zap size={48} className="text-blue-400" />
              </div>
              <h2 className="text-4xl font-light tracking-tighter uppercase">
                {activeScanner === 'skin' ? 'Hydration Profile Ready' : 
                 activeScanner === 'barcode' ? 'Metabolic Truth Decoded' : 
                 activeScanner === 'volume' ? 'Volume Calculation Complete' : 
                 'Spectral Analysis Complete'}
              </h2>
              <p className="text-white/60 font-light leading-relaxed">
                {activeScanner === 'skin' ? (
                  <>Cellular Hydration: <span className="text-blue-400 font-mono">82% [Optimal]</span><br/>Elasticity Index: <span className="text-green-400 font-mono">High</span></>
                ) : activeScanner === 'barcode' ? (
                  <>Raw Impact Score: <span className="text-red-400 font-mono">D- [High Fructose]</span><br/>Hidden Additives: <span className="text-white font-mono">12 Detected</span></>
                ) : activeScanner === 'volume' ? (
                  <>Estimated Weight: <span className="text-blue-400 font-mono">245g</span><br/>Density Check: <span className="text-white font-mono">Solid/Fibrous</span></>
                ) : (
                  <>Freshness Index: <span className="text-green-400 font-mono">98.4%</span><br/>Bio-Liveness: <span className="text-blue-400 font-mono">Verified</span><br/>Nutri-Breakdown: <span className="text-white font-mono">350 kcal | 12g Protein</span></>
                )}
              </p>
              <button 
                onClick={() => setShowResults(false)}
                className="mt-8 px-12 py-4 bg-blue-600 rounded-full font-mono text-xs uppercase tracking-widest hover:bg-blue-500 transition-all shadow-[0_0_30px_rgba(59,130,246,0.4)]"
              >
                Log to Ledger
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Controls */}
      <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-30">
        <div className="flex items-center gap-3 bg-black/40 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full text-white">
          <Scan size={16} className="text-blue-400" />
          <span className="text-xs font-mono tracking-widest uppercase">{scannerInfo[activeScanner].label}</span>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsScanning(!isScanning)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              isScanning ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)]' : 'bg-black/40 backdrop-blur-xl border border-white/10 text-white'
            }`}
          >
            <Camera size={18} />
          </button>
          <button className="w-10 h-10 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-white">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Scanner Selection Carousel */}
      <div className="absolute bottom-44 left-0 w-full overflow-x-auto scrollbar-hide px-8">
        <div className="flex gap-4 min-w-max">
          {(Object.keys(scannerInfo) as ScannerType[]).map((type) => (
            <button
              key={type}
              onClick={() => handleScannerChange(type)}
              className={`flex items-center gap-3 px-6 py-4 rounded-3xl transition-all ${
                activeScanner === type 
                  ? 'bg-white text-black scale-105 shadow-[0_0_30px_rgba(255,255,255,0.3)]' 
                  : 'bg-black/40 backdrop-blur-xl text-white border border-white/10 hover:bg-white/10'
              }`}
            >
              <div className={activeScanner === type ? 'text-black' : 'text-blue-400'}>
                {scannerInfo[type].icon}
              </div>
              <span className="text-sm font-medium whitespace-nowrap">{scannerInfo[type].label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active Scanner Info */}
      <motion.div 
        key={activeScanner}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute bottom-24 left-8 right-8 bg-black/60 backdrop-blur-2xl border border-white/10 p-4 rounded-3xl flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400">
            <Info size={20} />
          </div>
          <div>
            <p className="text-white/40 text-[10px] font-mono uppercase tracking-widest">Active Protocol</p>
            <p className="text-white text-sm font-light">{scannerInfo[activeScanner].desc}</p>
          </div>
        </div>
        <button className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all">
          <ChevronRight size={20} />
        </button>
      </motion.div>
    </div>
  );
};
