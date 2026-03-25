import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Zap, Shield, Target, Info, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';

// --- TYPES ---
type FitnessState = 'rest' | 'active' | 'correction' | 'training';

interface Exercise {
  id: string;
  name: string;
  type: 'yoga' | 'fitness';
  steps: string[];
  animation: {
    arms?: { left: number | number[]; right: number | number[] };
    legs?: { left: number | number[]; right: number | number[] };
    torso?: number | number[];
    head?: number | number[];
  };
}

const EXERCISES: Exercise[] = [
  // YOGA (10) - Static Poses
  { id: 'y1', name: 'Mountain Pose', type: 'yoga', steps: ['Stand tall with feet together.', 'Relax shoulders.', 'Distribute weight evenly.'], animation: { arms: { left: 0, right: 0 }, torso: 0 } },
  { id: 'y2', name: 'Tree Pose', type: 'yoga', steps: ['Shift weight to one leg.', 'Place other foot on inner thigh.', 'Bring hands to heart center.'], animation: { legs: { left: -20, right: 0 }, arms: { left: 45, right: -45 } } },
  { id: 'y3', name: 'Downward Dog', type: 'yoga', steps: ['Form an inverted V-shape.', 'Press palms into the floor.', 'Lift hips high.'], animation: { torso: 45, arms: { left: 160, right: -160 }, legs: { left: 20, right: -20 } } },
  { id: 'y4', name: 'Triangle Pose', type: 'yoga', steps: ['Spread legs wide.', 'Reach one hand to the floor.', 'Extend other hand to the sky.'], animation: { legs: { left: 30, right: -30 }, arms: { left: 90, right: -90 }, torso: 30 } },
  { id: 'y5', name: 'Warrior I', type: 'yoga', steps: ['Step one foot forward into a lunge.', 'Raise arms overhead.', 'Square hips forward.'], animation: { legs: { left: 40, right: -10 }, arms: { left: 180, right: -180 } } },
  { id: 'y6', name: 'Warrior II', type: 'yoga', steps: ['Step legs wide.', 'Extend arms parallel to floor.', 'Bend front knee.'], animation: { legs: { left: 45, right: -10 }, arms: { left: 90, right: -90 } } },
  { id: 'y7', name: 'Cobra Pose', type: 'yoga', steps: ['Lie on stomach.', 'Press hands into floor.', 'Lift chest up.'], animation: { torso: -30, arms: { left: 20, right: -20 }, legs: { left: 0, right: 0 } } },
  { id: 'y8', name: 'Child\'s Pose', type: 'yoga', steps: ['Kneel on floor.', 'Sit on heels.', 'Fold forward and rest forehead.'], animation: { torso: 90, legs: { left: 90, right: -90 }, arms: { left: 180, right: -180 } } },
  { id: 'y9', name: 'Bridge Pose', type: 'yoga', steps: ['Lie on back.', 'Bend knees.', 'Lift hips toward ceiling.'], animation: { torso: -45, legs: { left: 45, right: -45 } } },
  { id: 'y10', name: 'Corpse Pose', type: 'yoga', steps: ['Lie flat on back.', 'Arms at sides.', 'Relax completely.'], animation: { torso: 0, arms: { left: 10, right: -10 }, legs: { left: 10, right: -10 } } },
  // FITNESS (10) - Dynamic Movements
  { id: 'f1', name: 'Squats', type: 'fitness', steps: ['Feet shoulder-width apart.', 'Lower hips as if sitting.', 'Keep chest up.'], animation: { legs: { left: [0, 70, 0], right: [0, -70, 0] }, torso: [0, 20, 0] } },
  { id: 'f2', name: 'Push-ups', type: 'fitness', steps: ['Plank position.', 'Lower chest to floor.', 'Push back up.'], animation: { torso: [0, 10, 0], arms: { left: [0, 45, 0], right: [0, -45, 0] } } },
  { id: 'f3', name: 'Lunges', type: 'fitness', steps: ['Step forward.', 'Lower back knee toward floor.', 'Keep torso upright.'], animation: { legs: { left: [0, 80, 0], right: [0, -10, 0] } } },
  { id: 'f4', name: 'Plank', type: 'fitness', steps: ['Forearms on floor.', 'Body in straight line.', 'Engage core.'], animation: { torso: [0, 2, 0], legs: { left: [0, 5, 0], right: [0, -5, 0] } } },
  { id: 'f5', name: 'Jumping Jacks', type: 'fitness', steps: ['Jump feet wide.', 'Clap hands overhead.', 'Jump back.'], animation: { legs: { left: [0, 30, 0], right: [0, -30, 0] }, arms: { left: [0, 160, 0], right: [0, -160, 0] } } },
  { id: 'f6', name: 'Burpees', type: 'fitness', steps: ['Squat down.', 'Jump to plank.', 'Jump back and leap up.'], animation: { legs: { left: [0, 60, 0], right: [0, -60, 0] }, arms: { left: [0, 180, 0], right: [0, -180, 0] }, torso: [0, 45, 0] } },
  { id: 'f7', name: 'Mountain Climbers', type: 'fitness', steps: ['Plank position.', 'Drive knees to chest.', 'Alternate quickly.'], animation: { legs: { left: [0, 90, 0], right: [0, -20, 0] }, arms: { left: [0, 10, 0], right: [0, -10, 0] } } },
  { id: 'f8', name: 'Crunches', type: 'fitness', steps: ['Lie on back.', 'Knees bent.', 'Lift shoulders off floor.'], animation: { torso: [0, 30, 0], legs: { left: [45, 45, 45], right: [-45, -45, -45] } } },
  { id: 'f9', name: 'High Knees', type: 'fitness', steps: ['Run in place.', 'Lift knees to hip height.', 'Pump arms.'], animation: { legs: { left: [0, 90, 0], right: [0, 0, 0] }, arms: { left: [0, -45, 0], right: [0, 45, 0] } } },
  { id: 'f10', name: 'Glute Bridges', type: 'fitness', steps: ['Lie on back.', 'Feet flat.', 'Squeeze glutes and lift hips.'], animation: { torso: [0, -40, 0], legs: { left: [45, 45, 45], right: [-45, -45, -45] } } },
];

// --- COMPONENT ---
export const NeoFitness: React.FC = () => {
  const [state, setState] = useState<FitnessState>('rest');
  const [alignmentScore, setAlignmentScore] = useState(85);
  const [isSlouching, setIsSlouching] = useState(false);
  const [activeMuscle, setActiveMuscle] = useState<string | null>(null);
  const [vibration, setVibration] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [repCount, setRepCount] = useState(0);
  const [isGhostMode, setIsGhostMode] = useState(true);
  const [heartRate, setHeartRate] = useState(72);
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  // Simulation logic
  useEffect(() => {
    const interval = setInterval(() => {
      if (state === 'active' || state === 'training') {
        setAlignmentScore(prev => Math.max(0, Math.min(100, prev + (Math.random() - 0.5) * 5)));
        setHeartRate(prev => Math.max(60, Math.min(160, prev + (Math.random() > 0.6 ? 2 : -1))));
        
        // Rep counting simulation for training
        if (state === 'training') {
          setRepCount(prev => prev + 1);
        }

        // Randomly trigger slouching
        if (Math.random() > 0.92) {
          setIsSlouching(true);
          setState('correction');
          setVibration(true);
          // Haptic Form Correction
          if (window.navigator.vibrate) window.navigator.vibrate([100, 50, 100]);
          setTimeout(() => setVibration(false), 500);
        }
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [state]);

  const handleStart = () => {
    setState('active');
    setIsSlouching(false);
  };

  const handleReset = () => {
    setState('rest');
    setIsSlouching(false);
    setAlignmentScore(85);
    setSelectedExercise(null);
    setRepCount(0);
    setHeartRate(72);
    window.speechSynthesis.cancel();
  };

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speak = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    // Try to find a male voice
    const maleVoice = voices.find(v => 
      v.name.toLowerCase().includes('male') || 
      v.name.toLowerCase().includes('david') || 
      v.name.toLowerCase().includes('google uk english male') ||
      v.name.toLowerCase().includes('microsoft david')
    );
    if (maleVoice) utterance.voice = maleVoice;
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const handleExerciseClick = (ex: Exercise) => {
    setSelectedExercise(ex);
    setState('training');
    const intro = `Let's do ${ex.name}. `;
    const steps = ex.steps.join(' ');
    speak(intro + steps);
  };

  return (
    <div className="min-h-screen w-full bg-[#050505] text-white overflow-hidden relative">
      {/* 1. Aura-Genesis Background (Living 4K Nature Landscape simulation) */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&q=80&w=1920')] bg-cover bg-center opacity-40 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black" />
        {/* Ambient particles */}
        <div className="absolute inset-0 opacity-20">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [-20, 20],
                x: [-10, 10],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: Math.random() * 5 + 5,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute w-1 h-1 bg-blue-400 rounded-full"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>
      </div>

      {/* 2. Header */}
      <div className="relative z-10 p-8 flex justify-between items-start">
        <div>
          <h1 className="text-6xl font-light tracking-tighter mb-2">NEO FITNESS</h1>
          <p className="text-xs font-mono tracking-[0.4em] uppercase opacity-40">Agile Humanoid Instructor • AR Link</p>
        </div>
        <div className="flex gap-4">
          {/* Biometric Sync Display */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex items-center gap-4">
            <div className="text-right">
              <p className="text-[8px] font-mono uppercase opacity-40">Biometric Sync</p>
              <p className="text-xl font-light text-blue-400">{heartRate} BPM</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 60 / heartRate, repeat: Infinity }}
              >
                <Activity size={20} className="text-blue-400" />
              </motion.div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex items-center gap-4">
            <div className="text-right">
              <p className="text-[8px] font-mono uppercase opacity-40">Form Alignment</p>
              <p className={`text-xl font-light ${alignmentScore > 80 ? 'text-green-400' : 'text-yellow-400'}`}>
                {alignmentScore.toFixed(0)}%
              </p>
            </div>
            <div className="w-12 h-12 rounded-full border-2 border-white/10 flex items-center justify-center relative">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="24" cy="24" r="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-white/5"
                />
                <motion.circle
                  cx="24" cy="24" r="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="125.6"
                  animate={{ strokeDashoffset: 125.6 - (125.6 * alignmentScore) / 100 }}
                  className={alignmentScore > 80 ? 'text-green-500' : 'text-yellow-500'}
                />
              </svg>
              <Target size={16} className="absolute text-white/40" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. The Instructor Stage */}
      <div className="relative z-10 flex-1 h-[60vh] flex items-center justify-center">
        <div className="relative w-full max-w-2xl h-full flex items-center justify-center">
          {/* Grounding Shadow */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-64 h-12 bg-black/40 blur-xl rounded-full" />
          
          <AnimatePresence mode="wait">
            {state === 'rest' ? (
              <motion.div
                key="rest-orb"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="relative">
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="w-32 h-32 bg-blue-500/20 rounded-full blur-2xl"
                  />
                  <motion.div
                    animate={{
                      y: [-10, 10, -10],
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="w-16 h-16 bg-blue-400/40 backdrop-blur-xl border border-blue-300/30 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.5)]"
                  >
                    <Activity size={24} className="text-white" />
                  </motion.div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="humanoid"
                initial={{ opacity: 0, y: 50 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  x: vibration ? [0, -2, 2, -2, 2, 0] : 0
                }}
                exit={{ opacity: 0, y: 50 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                {/* The Humanoid SVG */}
                <div className="relative w-full h-full flex items-center justify-center">
                  
                  {/* Posture Shadow (Ghost Image) */}
                  {isGhostMode && (
                    <motion.div
                      animate={{
                        opacity: state === 'active' || state === 'training' ? [0.1, 0.2, 0.1] : 0,
                        x: [0, 5, 0],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                      <HumanoidFigure color="#22d3ee" isGhost exercise={selectedExercise} heartRate={heartRate} />
                    </motion.div>
                  )}

                  {/* The Main Instructor (Ghost Shell) */}
                  <div className="relative">
                    <HumanoidFigure 
                      color={isSlouching ? '#ef4444' : '#94a3b8'} 
                      isSlouching={isSlouching}
                      alignmentScore={alignmentScore}
                      exercise={selectedExercise}
                      heartRate={heartRate}
                    />
                    
                    {/* Kinematic Skeleton Overlay */}
                    <div className="absolute inset-0">
                      <HumanoidSkeleton alignmentScore={alignmentScore} exercise={selectedExercise} heartRate={heartRate} />
                    </div>
                  </div>

                  {/* Correction Indicator */}
                  {isSlouching && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    >
                      <div className="bg-red-500/20 backdrop-blur-md border border-red-500/40 p-4 rounded-2xl flex items-center gap-3">
                        <AlertCircle className="text-red-500" />
                        <span className="text-xs font-mono uppercase tracking-widest text-red-400">Posture Correction Required</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Exercise Selection Overlay (Right Side) */}
          <div className="absolute right-[-200px] top-0 bottom-0 w-64 z-20 overflow-y-auto scrollbar-hide pr-4 hidden lg:block">
            <div className="space-y-4 py-8">
              <h3 className="text-[10px] font-mono uppercase tracking-widest opacity-40 mb-2">Yoga Library</h3>
              {EXERCISES.filter(e => e.type === 'yoga').map(ex => (
                <ExerciseCard key={ex.id} ex={ex} active={selectedExercise?.id === ex.id} onClick={() => handleExerciseClick(ex)} />
              ))}
              <h3 className="text-[10px] font-mono uppercase tracking-widest opacity-40 mt-8 mb-2">Fitness Library</h3>
              {EXERCISES.filter(e => e.type === 'fitness').map(ex => (
                <ExerciseCard key={ex.id} ex={ex} active={selectedExercise?.id === ex.id} onClick={() => handleExerciseClick(ex)} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Exercise Selection (Bottom) */}
      <div className="relative z-20 lg:hidden px-8 pb-4">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
          {EXERCISES.map(ex => (
            <button
              key={ex.id}
              onClick={() => handleExerciseClick(ex)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl border text-xs font-mono uppercase tracking-widest transition-all ${
                selectedExercise?.id === ex.id 
                ? 'bg-blue-600 border-blue-400 text-white' 
                : 'bg-white/5 border-white/10 text-white/60'
              }`}
            >
              {ex.name}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Controls & Stats */}
      <div className="relative z-10 p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[40px]">
          <h3 className="text-xs font-mono uppercase tracking-widest opacity-40 mb-4">Session Control</h3>
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              {state === 'rest' ? (
                <button 
                  onClick={handleStart}
                  className="flex-1 py-4 bg-blue-600 rounded-2xl font-medium hover:bg-blue-500 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                >
                  <Activity size={18} />
                  Start AR Link
                </button>
              ) : (
                <button 
                  onClick={handleReset}
                  className="flex-1 py-4 bg-white/10 rounded-2xl font-medium hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw size={18} />
                  Reset Instructor
                </button>
              )}
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setIsGhostMode(!isGhostMode)}
                className={`flex-1 py-2 rounded-xl text-[10px] font-mono uppercase transition-all border ${isGhostMode ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-white/5 border-white/10 text-white/40'}`}
              >
                Ghost Mode: {isGhostMode ? 'ON' : 'OFF'}
              </button>
              <button 
                onClick={() => setIsVoiceActive(!isVoiceActive)}
                className={`flex-1 py-2 rounded-xl text-[10px] font-mono uppercase transition-all border ${isVoiceActive ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-white/5 border-white/10 text-white/40'}`}
              >
                Voice Cmd: {isVoiceActive ? 'ACTIVE' : 'OFF'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[40px] flex flex-col justify-between">
          <h3 className="text-xs font-mono uppercase tracking-widest opacity-40 mb-2">AI Rep Counter</h3>
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <p className="text-5xl font-light text-blue-400">{repCount}</p>
              <p className="text-[10px] font-mono text-blue-400/60 uppercase tracking-widest">Reps Detected</p>
            </div>
            <div className="flex gap-1 h-12 items-end">
              {[...Array(8)].map((_, i) => (
                <motion.div 
                  key={i} 
                  animate={{ height: [`${Math.random() * 100}%`, `${Math.random() * 100}%`] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="w-1.5 bg-blue-500/40 rounded-full"
                />
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[40px]">
          <h3 className="text-xs font-mono uppercase tracking-widest opacity-40 mb-4">Muscle Engagement</h3>
          <div className="space-y-3">
            <MuscleBar label="Quads" value={alignmentScore > 80 ? 95 : 40} color={alignmentScore > 80 ? 'green' : 'yellow'} />
            <MuscleBar label="Core" value={isSlouching ? 20 : 88} color={isSlouching ? 'red' : 'green'} />
          </div>
        </div>
      </div>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const ExerciseCard: React.FC<{ ex: Exercise, active: boolean, onClick: () => void }> = ({ ex, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between group ${
      active ? 'bg-blue-600 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.2)]' : 'bg-white/5 border-white/10 hover:bg-white/10'
    }`}
  >
    <div className="text-left">
      <p className={`text-xs font-medium ${active ? 'text-white' : 'text-white/80'}`}>{ex.name}</p>
      <p className="text-[8px] font-mono uppercase tracking-widest opacity-40">{ex.type}</p>
    </div>
    <ChevronRight size={14} className={`transition-transform ${active ? 'translate-x-1' : 'group-hover:translate-x-1 opacity-40'}`} />
  </button>
);

const HumanoidFigure: React.FC<{ color: string, isGhost?: boolean, isSlouching?: boolean, alignmentScore?: number, exercise?: Exercise | null, heartRate?: number }> = ({ color, isGhost, isSlouching, alignmentScore = 100, exercise, heartRate = 72 }) => {
  const anim = exercise?.animation;
  const isFitness = exercise?.type === 'fitness';
  // Biometric Tempo Sync: Duration scales with heart rate
  const duration = isFitness ? Math.max(0.5, 3 - (heartRate - 60) / 40) : 0.8;
  const transition: any = isFitness ? { duration, repeat: Infinity, ease: "easeInOut" } : { duration };

  return (
    <svg width="300" height="500" viewBox="0 0 300 500" className="drop-shadow-2xl">
      <defs>
        <radialGradient id="glass-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity={isGhost ? 0.1 : 0.4} />
          <stop offset="100%" stopColor={color} stopOpacity={isGhost ? 0.05 : 0.1} />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Body Parts with Heatmap simulation */}
      <motion.g 
        animate={{ rotate: anim?.torso || 0 }}
        transition={transition}
        style={{ originX: '150px', originY: '220px' }}
        className="transition-all duration-500"
      >
        {/* Head */}
        <motion.ellipse 
          cx="150" cy="60" rx="25" ry="35" 
          fill="url(#glass-grad)" 
          stroke={color} 
          strokeWidth="1"
          animate={{
            fill: isSlouching ? '#ef444422' : 'url(#glass-grad)',
            stroke: isSlouching ? '#ef4444' : color,
            rotate: anim?.head || 0
          }}
          transition={transition}
        />
        
        {/* Torso */}
        <motion.path 
          d="M120 100 L180 100 L190 220 L110 220 Z" 
          fill="url(#glass-grad)" 
          stroke={color} 
          strokeWidth="1"
          animate={{
            fill: isSlouching ? '#ef444444' : 'url(#glass-grad)',
            stroke: isSlouching ? '#ef4444' : color
          }}
        />
        {/* Muscle Heatmap (Core) */}
        {!isGhost && (
          <motion.path 
            d="M135 120 L165 120 L170 200 L130 200 Z" 
            fill={isSlouching ? '#ef4444' : '#4ade80'} 
            animate={{ 
              opacity: [0.1, 0.4, 0.1],
              fill: isSlouching ? '#ef4444' : '#4ade80'
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}

        {/* Arms */}
        <motion.g 
          animate={{ rotate: anim?.arms?.left || 0 }} 
          transition={transition}
          style={{ originX: '120px', originY: '110px' }}
        >
          <motion.path d="M120 110 L80 180" stroke={color} strokeWidth="15" strokeLinecap="round" fill="none" />
        </motion.g>
        <motion.g 
          animate={{ rotate: anim?.arms?.right || 0 }} 
          transition={transition}
          style={{ originX: '180px', originY: '110px' }}
        >
          <motion.path d="M180 110 L220 180" stroke={color} strokeWidth="15" strokeLinecap="round" fill="none" />
        </motion.g>

        {/* Legs */}
        <motion.g 
          animate={{ rotate: anim?.legs?.left || 0 }} 
          transition={transition}
          style={{ originX: '130px', originY: '220px' }}
        >
          <motion.path d="M130 220 L110 350 L120 450" stroke={color} strokeWidth="20" strokeLinecap="round" fill="none" />
        </motion.g>
        <motion.g 
          animate={{ rotate: anim?.legs?.right || 0 }} 
          transition={transition}
          style={{ originX: '170px', originY: '220px' }}
        >
          <motion.path d="M170 220 L190 350 L180 450" stroke={color} strokeWidth="20" strokeLinecap="round" fill="none" />
        </motion.g>
        
        {/* Muscle Heatmap (Quads) */}
        {!isGhost && alignmentScore > 80 && (
          <>
            <motion.path 
              d="M130 240 L115 330" 
              stroke="#4ade80" 
              strokeWidth="10" 
              strokeLinecap="round" 
              animate={{ opacity: [0.2, 0.6, 0.2] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <motion.path 
              d="M170 240 L185 330" 
              stroke="#4ade80" 
              strokeWidth="10" 
              strokeLinecap="round" 
              animate={{ opacity: [0.2, 0.6, 0.2] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
            />
          </>
        )}
      </motion.g>
    </svg>
  );
};

const HumanoidSkeleton: React.FC<{ alignmentScore: number, exercise?: Exercise | null, heartRate?: number }> = ({ alignmentScore, exercise, heartRate = 72 }) => {
  const anim = exercise?.animation;
  const isFitness = exercise?.type === 'fitness';
  const duration = isFitness ? Math.max(0.5, 3 - (heartRate - 60) / 40) : 0.8;
  const transition: any = isFitness ? { duration, repeat: Infinity, ease: "easeInOut" } : { duration: 0.8 };

  return (
    <svg width="300" height="500" viewBox="0 0 300 500" className="pointer-events-none">
      <motion.g 
        animate={{ rotate: anim?.torso || 0 }}
        transition={transition}
        style={{ originX: '150px', originY: '220px' }}
        stroke="#60a5fa" strokeWidth="0.5" fill="#60a5fa" filter="url(#glow)"
      >
        {/* Spine */}
        <line x1="150" y1="100" x2="150" y2="220" />
        
        {/* Shoulders */}
        <line x1="120" y1="110" x2="180" y2="110" />
        
        {/* Hips */}
        <line x1="130" y1="220" x2="170" y2="220" />

        {/* Joints (Dots) */}
        <motion.circle 
          cx="150" cy="60" r="2" 
          animate={{ rotate: anim?.head || 0 }} 
          transition={transition}
          style={{ originX: '150px', originY: '110px' }} 
        /> {/* Head */}
        <circle cx="150" cy="110" r="2" /> {/* Neck */}
        
        <motion.g 
          animate={{ rotate: anim?.arms?.left || 0 }} 
          transition={transition}
          style={{ originX: '120px', originY: '110px' }}
        >
          <circle cx="120" cy="110" r="2" /> {/* L Shoulder */}
          <circle cx="80" cy="180" r="2" /> {/* L Elbow */}
        </motion.g>

        <motion.g 
          animate={{ rotate: anim?.arms?.right || 0 }} 
          transition={transition}
          style={{ originX: '180px', originY: '110px' }}
        >
          <circle cx="180" cy="110" r="2" /> {/* R Shoulder */}
          <circle cx="220" cy="180" r="2" /> {/* R Elbow */}
        </motion.g>

        <motion.g 
          animate={{ rotate: anim?.legs?.left || 0 }} 
          transition={transition}
          style={{ originX: '130px', originY: '220px' }}
        >
          <circle cx="130" cy="220" r="2" /> {/* L Hip */}
          <circle cx="110" cy="350" r="2" /> {/* L Knee */}
          <circle cx="120" cy="450" r="2" /> {/* L Ankle */}
        </motion.g>

        <motion.g 
          animate={{ rotate: anim?.legs?.right || 0 }} 
          transition={transition}
          style={{ originX: '170px', originY: '220px' }}
        >
          <circle cx="170" cy="220" r="2" /> {/* R Hip */}
          <circle cx="190" cy="350" r="2" /> {/* R Knee */}
          <circle cx="180" cy="450" r="2" /> {/* R Ankle */}
        </motion.g>
      </motion.g>
    </svg>
  );
};

const MuscleBar: React.FC<{ label: string, value: number, color: 'green' | 'red' | 'yellow' }> = ({ label, value, color }) => {
  const colorMap = {
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500'
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[8px] font-mono uppercase tracking-widest opacity-40">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          className={`h-full ${colorMap[color]}`}
        />
      </div>
    </div>
  );
};
