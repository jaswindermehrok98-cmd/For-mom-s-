import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'motion/react';
import { Play, Pause, MapPin, Activity, Accessibility, ChevronRight, Zap, Target, Heart, Wind, Layers, Plus, Info, ShieldCheck, Cpu, Thermometer, AlertCircle, Volume2 } from 'lucide-react';

export const TheKineticStudio: React.FC = () => {
  const [activeStudio, setActiveStudio] = useState<'yoga' | 'prenatal' | 'movement'>('movement');
  const [isInstructorPlaying, setIsInstructorPlaying] = useState(false);
  const [isYogaActive, setIsYogaActive] = useState(false);
  const [isPrenatalActive, setIsPrenatalActive] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isRecoveryActive, setIsRecoveryActive] = useState(false);
  const [activeRecovery, setActiveRecovery] = useState<string | null>(null);
  const [activeProtocol, setActiveProtocol] = useState<string | null>(null);
  
  // Advanced Engine States
  const [symmetryScore, setSymmetryScore] = useState(94);
  const [loadDistribution, setLoadDistribution] = useState({ spine: 12, hips: 8 });
  const [ambientLight, setAmbientLight] = useState(65); // 0-100
  const [npuLatency, setNpuLatency] = useState(0.4); // ms
  const [isGrounded, setIsGrounded] = useState(true);
  const [coachingMessage, setCoachingMessage] = useState("Ready for session. NPU Linked.");
  const [showRecoveryRoadmap, setShowRecoveryRoadmap] = useState(false);

  useEffect(() => {
    if (isInstructorPlaying) {
      const interval = setInterval(() => {
        const newSymmetry = Math.max(40, Math.min(100, symmetryScore + (Math.random() * 10 - 5)));
        setSymmetryScore(Math.round(newSymmetry));
        setNpuLatency(parseFloat((Math.random() * 0.2 + 0.3).toFixed(2)));
        
        if (newSymmetry < 70) {
          setCoachingMessage("Symmetry alert! Apne hips ko thoda lift kijiye.");
          // Simulated haptic feedback visual
        } else {
          setCoachingMessage("Great form! Keep holding.");
        }

        if (newSymmetry < 60) {
          setIsInstructorPlaying(false);
          setShowRecoveryRoadmap(true);
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isInstructorPlaying, symmetryScore]);

  useEffect(() => {
    if (isRecoveryActive && !activeRecovery) {
      setActiveRecovery('pelvic');
    } else if (!isRecoveryActive) {
      setActiveRecovery(null);
    }
  }, [isRecoveryActive]);

  const isAnySessionActive = isYogaActive || isPrenatalActive || isInstructorPlaying || isRecoveryActive || activeRecovery !== null || activeProtocol !== null;

  return (
    <div className="min-h-screen w-full bg-[#080808] text-white p-8 pb-32">
      {/* Session Overlay */}
      <AnimatePresence>
        {isAnySessionActive && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-white/10 backdrop-blur-2xl border border-white/20 px-8 py-4 rounded-full flex items-center gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-mono uppercase tracking-widest">Active Session</span>
            </div>
            <div className="h-4 w-[1px] bg-white/20" />
            <div className="flex items-center gap-4">
              <p className="text-sm font-light">
                {isYogaActive && "Yoga: Core & Bone Density"}
                {isPrenatalActive && "Prenatal: Maternal Mobility"}
                {isInstructorPlaying && "Movement: 3D Instructor"}
                {isRecoveryActive && "Movement: Core Power Recovery"}
                {activeRecovery && `Recovery: ${activeRecovery === 'pelvic' ? 'Pelvic Stability' : activeRecovery === 'lumbar' ? 'Lumbar Release' : 'Diaphragmatic Flow'}`}
                {activeProtocol && `Protocol: ${activeProtocol === 'trimester2' ? 'Pelvic Alignment' : 'Gentle Lumbar'}`}
              </p>
            </div>
            <button 
              onClick={() => {
                setIsYogaActive(false);
                setIsPrenatalActive(false);
                setIsInstructorPlaying(false);
                setIsRecoveryActive(false);
                setActiveRecovery(null);
                setActiveProtocol(null);
              }}
              className="bg-white text-black px-4 py-2 rounded-full text-[10px] font-mono uppercase tracking-widest hover:bg-white/80 transition-all"
            >
              Stop All
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-6xl font-light tracking-tighter mb-2">THE KINETIC STUDIO</h1>
          <p className="text-xs font-mono tracking-[0.4em] uppercase opacity-40">Movement & 3D Recovery</p>
        </div>
        <div className="flex gap-4">
          <button className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
            <Layers size={20} />
          </button>
          <button className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center hover:bg-blue-500 transition-all">
            <Plus size={24} />
          </button>
        </div>
      </div>

      {/* Studio Toggle */}
      <div className="grid grid-cols-3 gap-4 mb-12">
        <StudioButton 
          active={activeStudio === 'yoga'} 
          onClick={() => setActiveStudio('yoga')}
          label="Yoga Studio"
          desc="Core & Bone Density"
        />
        <StudioButton 
          active={activeStudio === 'prenatal'} 
          onClick={() => setActiveStudio('prenatal')}
          label="Prenatal Yoga"
          desc="Maternal Mobility"
        />
        <StudioButton 
          active={activeStudio === 'movement'} 
          onClick={() => setActiveStudio('movement')}
          label="Movement Studio"
          desc="High Intensity Flow"
        />
      </div>

      <AnimatePresence mode="wait">
        {activeStudio === 'yoga' && (
          <motion.div 
            key="yoga"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
          >
            <div className="relative h-[40vh] rounded-[60px] overflow-hidden bg-gradient-to-br from-orange-900/20 to-black border border-white/10 p-12 flex flex-col justify-end">
              <div className="absolute top-12 right-12">
                <div className="w-32 h-32 border border-orange-500/20 rounded-full flex items-center justify-center">
                  <motion.div 
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="w-24 h-24 bg-orange-500/10 rounded-full blur-xl"
                  />
                  <Target size={40} className="text-orange-400 absolute" />
                </div>
              </div>
              <h2 className="text-4xl font-light mb-4">Core & Bone Density</h2>
              <p className="text-white/50 text-sm max-w-md leading-relaxed mb-8">Precision yoga flows designed to stimulate osteoblast activity and reinforce core structural integrity.</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setIsYogaActive(!isYogaActive)}
                  className={`px-8 py-4 rounded-2xl text-xs font-mono uppercase tracking-widest transition-all flex items-center gap-3 ${
                    isYogaActive ? 'bg-orange-500 text-white' : 'bg-orange-600 text-white hover:bg-orange-500'
                  }`}
                >
                  {isYogaActive ? 'End Session' : 'Start Session'} 
                  {isYogaActive ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <YogaMetric icon={<Activity size={18} />} label="Bone Load" value="4.2g" color="text-orange-400" />
              <YogaMetric icon={<Heart size={18} />} label="HR Variability" value="High" color="text-green-400" />
              <YogaMetric icon={<Wind size={18} />} label="Breath Depth" value="85%" color="text-blue-400" />
            </div>
          </motion.div>
        )}

        {activeStudio === 'prenatal' && (
          <motion.div 
            key="prenatal"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
          >
            <div className="relative h-[40vh] rounded-[60px] overflow-hidden bg-gradient-to-br from-teal-900/20 to-black border border-white/10 p-12 flex flex-col justify-end">
              <div className="absolute top-12 right-12">
                <div className="w-32 h-32 border border-teal-500/20 rounded-full flex items-center justify-center">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="w-24 h-24 border-t-2 border-teal-500/40 rounded-full"
                  />
                  <Heart size={40} className="text-teal-400 absolute" />
                </div>
              </div>
              <h2 className="text-4xl font-light mb-4">Maternal Mobility</h2>
              <p className="text-white/50 text-sm max-w-md leading-relaxed mb-8">Adaptive movement protocols focusing on pelvic floor health and ergonomic support during pregnancy.</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setIsPrenatalActive(!isPrenatalActive)}
                  className={`px-8 py-4 rounded-2xl text-xs font-mono uppercase tracking-widest transition-all flex items-center gap-3 ${
                    isPrenatalActive ? 'bg-teal-500 text-white' : 'bg-teal-600 text-white hover:bg-teal-500'
                  }`}
                >
                  {isPrenatalActive ? 'End Flow' : 'Begin Flow'}
                  {isPrenatalActive ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                </button>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 p-8 rounded-[40px]">
              <h3 className="text-xl font-light mb-6">Recommended Protocols</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ProtocolItem 
                  trimester="Trimester 2"
                  title="Pelvic Alignment Flow"
                  isActive={activeProtocol === 'trimester2'}
                  onToggle={() => setActiveProtocol(activeProtocol === 'trimester2' ? null : 'trimester2')}
                />
                <ProtocolItem 
                  trimester="Trimester 3"
                  title="Gentle Lumbar Release"
                  isActive={activeProtocol === 'trimester3'}
                  onToggle={() => setActiveProtocol(activeProtocol === 'trimester3' ? null : 'trimester3')}
                />
              </div>
            </div>
          </motion.div>
        )}

        {activeStudio === 'movement' && (
          <motion.div 
            key="movement"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-12"
          >
            {/* 3D Instructor Hero with Anatomical Engine */}
            <div className={`relative h-[65vh] rounded-[60px] overflow-hidden transition-all duration-1000 border border-white/10 group ${
              ambientLight < 30 ? 'bg-black' : 'bg-gradient-to-br from-blue-900/40 to-black'
            }`}>
              {/* Lighting Sync Effect */}
              <div className="absolute inset-0 pointer-events-none">
                <div className={`absolute inset-0 transition-opacity duration-1000 ${ambientLight < 30 ? 'opacity-100' : 'opacity-0'}`}>
                  <div className="absolute inset-0 bg-blue-500/5 animate-pulse" />
                </div>
              </div>

              <div className="absolute inset-0 flex items-center justify-center">
                {/* 33-Point Kinematic Mapping Visualization */}
                <div className="relative w-full h-full flex items-center justify-center">
                  {/* Ghost Shadow (Correct Shadow) */}
                  <AnimatePresence>
                    {isInstructorPlaying && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 0.15, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute"
                      >
                        <Accessibility size={320} className="text-white" strokeWidth={0.2} />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Main Instructor Model */}
                  <motion.div
                    animate={isInstructorPlaying ? {
                      scale: [1, 1.02, 1],
                      rotateY: symmetryScore < 70 ? [0, 15, 0] : [0, 5, -5, 0],
                      x: symmetryScore < 70 ? [0, -20, 0] : 0
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="relative"
                  >
                    {/* Biomechanical Overlay (Heatmap) */}
                    <div className="relative">
                      <Accessibility 
                        size={300} 
                        className={`transition-colors duration-500 ${
                          !isInstructorPlaying ? 'text-blue-400 opacity-20' :
                          symmetryScore > 85 ? 'text-green-400 opacity-60' :
                          symmetryScore > 70 ? 'text-yellow-400 opacity-60' : 'text-red-500 opacity-80'
                        }`} 
                        strokeWidth={0.5} 
                      />
                      
                      {/* 33-Point Joint Mapping (Skeleton Structure) */}
                      {isInstructorPlaying && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="relative w-48 h-72">
                            {/* Spine & Head */}
                            <Joint x="50%" y="10%" /> {/* Head */}
                            <Joint x="50%" y="25%" /> {/* Neck */}
                            <Joint x="50%" y="45%" /> {/* Mid Spine */}
                            <Joint x="50%" y="60%" /> {/* Lower Spine */}
                            
                            {/* Shoulders & Arms */}
                            <Joint x="35%" y="25%" /> <Joint x="65%" y="25%" /> {/* Shoulders */}
                            <Joint x="25%" y="40%" /> <Joint x="75%" y="40%" /> {/* Elbows */}
                            <Joint x="20%" y="55%" /> <Joint x="80%" y="55%" /> {/* Wrists */}
                            
                            {/* Hips & Legs */}
                            <Joint x="40%" y="60%" /> <Joint x="60%" y="60%" /> {/* Hips */}
                            <Joint x="38%" y="75%" /> <Joint x="62%" y="75%" /> {/* Knees */}
                            <Joint x="35%" y="90%" /> <Joint x="65%" y="90%" /> {/* Ankles */}

                            {/* Additional 33 points scattered for detail */}
                            {[...Array(15)].map((_, i) => (
                              <Joint 
                                key={i} 
                                x={`${20 + Math.random() * 60}%`} 
                                y={`${10 + Math.random() * 80}%`} 
                                size="w-1 h-1"
                                opacity="opacity-40"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>

                  <div className="absolute inset-0 flex items-center justify-center">
                    <button 
                      onClick={() => setIsInstructorPlaying(!isInstructorPlaying)}
                      className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-black hover:scale-110 transition-all shadow-[0_0_50px_rgba(255,255,255,0.3)] relative z-20"
                    >
                      {isInstructorPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Posture Guard HUD */}
              <div className="absolute top-12 left-12 space-y-4">
                <div className="flex items-center gap-3">
                  <AnimatePresence>
                    {isInstructorPlaying && (
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex items-center gap-2 bg-blue-500 px-3 py-1.5 rounded-full border border-white/20"
                      >
                        <Cpu size={12} className="text-white animate-spin-slow" />
                        <span className="text-[10px] font-mono uppercase tracking-widest text-white">NPU Active: {npuLatency}ms</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-2">
                    <ShieldCheck size={12} className="text-green-400" />
                    <span className="text-[10px] font-mono uppercase tracking-widest text-white/60">Anatomical Engine v4.2</span>
                  </div>
                  <div className={`bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-2 transition-colors ${isGrounded ? 'text-blue-400' : 'text-red-400'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${isGrounded ? 'bg-blue-400' : 'bg-red-400 animate-pulse'}`} />
                    <span className="text-[10px] font-mono uppercase tracking-widest">Grounded</span>
                  </div>
                </div>

                {/* Symmetry Score HUD */}
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-4 rounded-3xl w-48">
                  <div className="flex justify-between items-end mb-2">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-white/40">Symmetry Score</p>
                    <p className={`text-xl font-light ${symmetryScore < 70 ? 'text-red-400' : 'text-white'}`}>{symmetryScore}%</p>
                  </div>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      animate={{ width: `${symmetryScore}%` }}
                      className={`h-full transition-colors ${symmetryScore < 70 ? 'bg-red-500' : 'bg-blue-500'}`}
                    />
                  </div>
                </div>
              </div>

              {/* Nexus Voice & Haptic HUD */}
              <div className="absolute top-12 right-12 text-right">
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-4 rounded-3xl flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-1">Nexus Coaching</p>
                    <p className="text-sm font-light italic text-blue-300">"{coachingMessage}"</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400">
                    <Volume2 size={20} className={isInstructorPlaying ? 'animate-pulse' : ''} />
                  </div>
                </div>
              </div>

              {/* Haptic Directional Taps Visualizer */}
              <AnimatePresence>
                {symmetryScore < 70 && isInstructorPlaying && (
                  <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-32 bg-red-500/50 blur-md"
                  />
                )}
              </AnimatePresence>
              
              <div className="absolute bottom-12 left-12 right-12 flex justify-between items-end">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-4xl font-light mb-2">3D Instructor</h2>
                    <p className="text-white/50 text-sm max-w-xs leading-relaxed">Redmi Depth Sensor mapping 33 key joints with 0ms NPU latency.</p>
                  </div>
                  
                  {/* Bone Density HUD (Yoga Specific) */}
                  <div className="flex gap-4">
                    <div className="bg-black/40 backdrop-blur-xl border border-white/10 px-6 py-4 rounded-3xl">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-1">Spine Load</p>
                      <p className="text-xl font-light">{loadDistribution.spine}kg</p>
                    </div>
                    <div className="bg-black/40 backdrop-blur-xl border border-white/10 px-6 py-4 rounded-3xl">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-1">Hip Load</p>
                      <p className="text-xl font-light">{loadDistribution.hips}kg</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-4">
                  <div className="bg-black/40 backdrop-blur-xl border border-white/10 px-6 py-4 rounded-3xl">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-1">Ambient Light</p>
                    <div className="flex items-center gap-2">
                      <Thermometer size={14} className="text-yellow-400" />
                      <p className="text-xl font-light">{ambientLight} Lux</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recovery Roadmap Alert */}
            <AnimatePresence>
              {showRecoveryRoadmap && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="bg-red-500/10 border border-red-500/30 p-8 rounded-[40px] flex items-center justify-between"
                >
                  <div className="flex items-center gap-6">
                    <div className="p-4 bg-red-500/20 rounded-2xl text-red-400">
                      <AlertCircle size={32} />
                    </div>
                    <div>
                      <h3 className="text-xl font-light mb-1">Symmetry Critical: Session Halted</h3>
                      <p className="text-white/50 text-sm">Your alignment dropped below 60%. Launching Recovery Roadmap.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setShowRecoveryRoadmap(false);
                      setActiveStudio('movement');
                      setIsRecoveryActive(true);
                    }}
                    className="px-8 py-4 bg-red-600 rounded-2xl text-xs font-mono uppercase tracking-widest hover:bg-red-500 transition-all"
                  >
                    Start Recovery
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Metabolic Walk & Core Power */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white/5 border border-white/10 p-10 rounded-[50px] group hover:bg-white/10 transition-all">
                <div className="flex justify-between items-start mb-8">
                  <div className="p-4 bg-blue-500/20 rounded-2xl text-blue-400">
                    <MapPin size={24} />
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full">GPS Active</span>
                </div>
                <h3 className="text-2xl font-light mb-4">Metabolic Walk</h3>
                <p className="text-white/50 text-sm leading-relaxed mb-8">Integrated map showing "Hot Zones" for peak metabolic burn in your current location.</p>
                <div className="relative h-48 bg-white/5 rounded-3xl overflow-hidden mb-8 border border-white/5">
                  <div className="absolute inset-0 opacity-30 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800')] bg-cover bg-center" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 bg-blue-500 rounded-full animate-ping" />
                  </div>
                </div>
                <button 
                  onClick={() => setIsMapOpen(!isMapOpen)}
                  className={`w-full py-4 rounded-2xl text-xs font-mono uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${
                    isMapOpen ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'
                  }`}
                >
                  {isMapOpen ? 'Close Map' : 'Open Map'} <ChevronRight size={14} className={isMapOpen ? 'rotate-90 transition-all' : 'transition-all'} />
                </button>
              </div>

              <div className="bg-white/5 border border-white/10 p-10 rounded-[50px] group hover:bg-white/10 transition-all">
                <div className="flex justify-between items-start mb-8">
                  <div className="p-4 bg-purple-500/20 rounded-2xl text-purple-400">
                    <Zap size={24} />
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 bg-purple-400/10 px-3 py-1 rounded-full">Recovery Mode</span>
                </div>
                <h3 className="text-2xl font-light mb-4">Core Power</h3>
                <p className="text-white/50 text-sm leading-relaxed mb-8">Guided 3D recovery routines for core stability and musculoskeletal longevity.</p>
                <div className="space-y-4 mb-8">
                  <RecoveryItem 
                    title="Pelvic Floor Stability" 
                    duration="12m" 
                    intensity="Low" 
                    isActive={activeRecovery === 'pelvic'}
                    onToggle={() => setActiveRecovery(activeRecovery === 'pelvic' ? null : 'pelvic')}
                  />
                  <RecoveryItem 
                    title="Lumbar Decompression" 
                    duration="8m" 
                    intensity="Med" 
                    isActive={activeRecovery === 'lumbar'}
                    onToggle={() => setActiveRecovery(activeRecovery === 'lumbar' ? null : 'lumbar')}
                  />
                  <RecoveryItem 
                    title="Diaphragmatic Flow" 
                    duration="15m" 
                    intensity="Low" 
                    isActive={activeRecovery === 'diaphragm'}
                    onToggle={() => setActiveRecovery(activeRecovery === 'diaphragm' ? null : 'diaphragm')}
                  />
                </div>
                <button 
                  onClick={() => setIsRecoveryActive(!isRecoveryActive)}
                  className={`w-full py-4 rounded-2xl text-xs font-mono uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(147,51,234,0.3)] ${
                    isRecoveryActive ? 'bg-purple-500 text-white' : 'bg-purple-600 text-white hover:bg-purple-500'
                  }`}
                >
                  {isRecoveryActive ? 'Stop Recovery' : 'Start Recovery'} 
                  {isRecoveryActive ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const YogaMetric: React.FC<{ icon: any, label: string, value: string, color: string }> = ({ icon, label, value, color }) => (
  <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-center gap-4">
    <div className={`p-3 bg-white/5 rounded-xl ${color}`}>{icon}</div>
    <div>
      <p className="text-[10px] font-mono uppercase tracking-widest opacity-40">{label}</p>
      <p className="text-xl font-light">{value}</p>
    </div>
  </div>
);

const StudioButton: React.FC<{ active: boolean, onClick: () => void, label: string, desc: string }> = ({ active, onClick, label, desc }) => (
  <button 
    onClick={onClick}
    className={`p-8 rounded-[40px] text-left transition-all border ${
      active 
        ? 'bg-white text-black border-white shadow-[0_0_40px_rgba(255,255,255,0.1)]' 
        : 'bg-white/5 text-white border-white/10 hover:bg-white/10'
    }`}
  >
    <h3 className="text-xl font-light mb-2">{label}</h3>
    <p className={`text-[10px] font-mono uppercase tracking-widest ${active ? 'text-black/50' : 'text-white/30'}`}>{desc}</p>
  </button>
);

const RecoveryItem: React.FC<{ 
  title: string, 
  duration: string, 
  intensity: string,
  isActive?: boolean,
  onToggle?: () => void
}> = ({ title, duration, intensity, isActive, onToggle }) => (
  <div 
    onClick={(e) => {
      e.stopPropagation();
      onToggle?.();
    }}
    className={`flex items-center justify-between p-4 rounded-2xl transition-all cursor-pointer ${
      isActive ? 'bg-purple-500/20 border border-purple-500/30' : 'bg-white/5 hover:bg-white/10 border border-transparent'
    }`}
  >
    <div className="flex items-center gap-4">
      <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-purple-400 animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-purple-400/30'}`} />
      <span className={`text-sm font-light ${isActive ? 'text-white' : 'text-white/70'}`}>{title}</span>
    </div>
    <div className="flex items-center gap-6">
      <div className="flex gap-4 text-[10px] font-mono uppercase tracking-widest text-white/30">
        <span>{duration}</span>
        <span>{intensity}</span>
      </div>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
        isActive ? 'bg-purple-500 text-white' : 'bg-white/5 text-white/20'
      }`}>
        {isActive ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
      </div>
    </div>
  </div>
);

const Joint: React.FC<{ x: string, y: string, size?: string, opacity?: string }> = ({ x, y, size = "w-1.5 h-1.5", opacity = "opacity-100" }) => (
  <motion.div
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    className={`absolute ${size} bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)] ${opacity}`}
    style={{ top: y, left: x, transform: 'translate(-50%, -50%)' }}
  />
);

const ProtocolItem: React.FC<{ 
  trimester: string, 
  title: string, 
  isActive: boolean, 
  onToggle: () => void 
}> = ({ trimester, title, isActive, onToggle }) => (
  <div 
    onClick={onToggle}
    className={`p-6 rounded-3xl border transition-all cursor-pointer flex justify-between items-center ${
      isActive ? 'bg-teal-500/10 border-teal-500/30' : 'bg-white/5 border-white/5 hover:bg-white/10'
    }`}
  >
    <div>
      <p className="text-[10px] font-mono uppercase tracking-widest text-teal-400 mb-2">{trimester}</p>
      <h4 className={`text-lg font-light ${isActive ? 'text-white' : 'text-white/80'}`}>{title}</h4>
    </div>
    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
      isActive ? 'bg-teal-500 text-white' : 'bg-white/5 text-white/20'
    }`}>
      {isActive ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
    </div>
  </div>
);
