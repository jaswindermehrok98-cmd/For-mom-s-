import React, { useState, useEffect, useMemo } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { Wind, Sun, Volume2, Heart, Activity, CheckCircle, ChevronUp, Shield, AlertTriangle, BarChart3, Moon, Mic, EyeOff, Zap, Coffee } from 'lucide-react';
import { EnvironmentData, UserMood, VitalStats } from '../types';

export const TheSanctuary: React.FC = () => {
  const [envData, setEnvData] = useState<EnvironmentData>({ light: 45, noise: 32, airQuality: 92 });
  const [mood, setMood] = useState<UserMood>({ harmony: 85, stress: 15 });
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [isDetoxActive, setIsDetoxActive] = useState(false);
  const [ventText, setVentText] = useState('');
  const [napTime, setNapTime] = useState(0);
  const [isNapping, setIsNapping] = useState(false);
  const [sleepFrequency, setSleepFrequency] = useState(432);

  // Circadian UI Sync
  const [timeOfDay, setTimeOfDay] = useState(new Date().getHours());
  const circadianColor = useMemo(() => {
    if (timeOfDay >= 6 && timeOfDay < 12) return 'rgba(255, 165, 0, 0.1)'; // Morning
    if (timeOfDay >= 12 && timeOfDay < 18) return 'rgba(59, 130, 246, 0.1)'; // Afternoon
    if (timeOfDay >= 18 && timeOfDay < 22) return 'rgba(128, 0, 128, 0.1)'; // Evening
    return 'rgba(0, 0, 139, 0.1)'; // Night
  }, [timeOfDay]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isNapping) {
      interval = setInterval(() => setNapTime(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isNapping]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Breathing background color calculation
  const bgColor = mood.stress > 50 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)';

  return (
    <div className="relative min-h-screen w-full bg-black text-white pb-32">
      {/* Upper 40%: Fixed Visual Canvas */}
      <div className="relative w-full h-[40vh] overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.05, 1],
            opacity: [0.8, 1, 0.8]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <img 
            src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=1920" 
            alt="Sanctuary Landscape"
            className="w-full h-full object-cover opacity-60"
            referrerPolicy="no-referrer"
          />
        </motion.div>
        
        {/* Environment Scan Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black" />
        <div className="absolute top-8 left-8 right-8 flex justify-between items-start">
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full">
              <Sun size={16} className="text-yellow-400" />
              <span className="text-xs font-mono tracking-widest uppercase opacity-70">Light: {envData.light}%</span>
            </div>
            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full">
              <Volume2 size={16} className="text-blue-400" />
              <span className="text-xs font-mono tracking-widest uppercase opacity-70">Noise: {envData.noise}dB</span>
            </div>
            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full">
              <Wind size={16} className="text-green-400" />
              <span className="text-xs font-mono tracking-widest uppercase opacity-70">Air: {envData.airQuality} AQI</span>
            </div>
          </div>
          
          <div className="text-right">
            <h1 className="text-4xl font-light tracking-tighter mb-1">THE SANCTUARY</h1>
            <p className="text-xs font-mono tracking-widest opacity-50 uppercase">Rest & Mood Harmony</p>
          </div>
        </div>
      </div>

      {/* Breathing Background Overlay */}
      <motion.div 
        animate={{ 
          backgroundColor: isDetoxActive ? 'rgba(0,0,0,0.9)' : [circadianColor, 'rgba(0,0,0,0)', circadianColor]
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className={`fixed inset-0 pointer-events-none z-0 transition-all duration-1000 ${isDetoxActive ? 'backdrop-blur-3xl' : ''}`}
      />

      {/* Lower 30%: Dynamic Feed (Now scrollable) */}
      <div className="relative z-10 p-8 pt-12 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            icon={<Heart className="text-red-400" />}
            title="Vital Vibe"
            value="72"
            unit="BPM"
            trend="+2%"
            color="red"
          />
          <StatCard 
            icon={<Activity className="text-blue-400" />}
            title="Glucose Guard"
            value="98"
            unit="mg/dL"
            trend="Stable"
            color="blue"
          />
          <StatCard 
            icon={<CheckCircle className="text-green-400" />}
            title="Habit Hub"
            value="85"
            unit="%"
            trend="+5%"
            color="green"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Stress Vent Journal */}
          <div className="bg-white/5 border border-white/10 p-8 rounded-[40px]">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-light mb-1">Stress "Vent" Journal</h3>
                <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Voice & Sentiment Analysis</p>
              </div>
              <Mic size={20} className="text-red-400" />
            </div>
            <textarea 
              value={ventText}
              onChange={(e) => setVentText(e.target.value)}
              placeholder="Speak or type your thoughts... Neo is listening."
              className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-light outline-none focus:border-red-500/50 transition-all resize-none"
            />
            <div className="mt-4 flex justify-between items-center">
              <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Tone: {ventText ? 'Analyzing...' : 'Silent'}</span>
              <button className="text-xs font-mono text-red-400 uppercase tracking-widest">Purge Thoughts</button>
            </div>
          </div>

          {/* Binaural Sleep Architect */}
          <div className="bg-white/5 border border-white/10 p-8 rounded-[40px]">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-light mb-1">Sleep Architect</h3>
                <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Binaural Beat Synthesis</p>
              </div>
              <Volume2 size={20} className="text-blue-400" />
            </div>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono text-white/60 uppercase">Frequency</span>
                <span className="text-lg font-light text-blue-400">{sleepFrequency}Hz</span>
              </div>
              <input 
                type="range" 
                min="100" 
                max="1000" 
                value={sleepFrequency}
                onChange={(e) => setSleepFrequency(parseInt(e.target.value))}
                className="w-full accent-blue-500"
              />
              <div className="flex gap-4">
                <button className="flex-1 py-3 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400 font-mono text-[10px] uppercase tracking-widest">Delta Wave</button>
                <button className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-white/40 font-mono text-[10px] uppercase tracking-widest">Theta Wave</button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Digital Detox Blur */}
          <div className="bg-white/5 border border-white/10 p-8 rounded-[40px] flex items-center justify-between group cursor-pointer" onClick={() => setIsDetoxActive(!isDetoxActive)}>
            <div className="flex items-center gap-6">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${isDetoxActive ? 'bg-white text-black' : 'bg-white/5 text-white/40'}`}>
                <EyeOff size={32} />
              </div>
              <div>
                <h3 className="text-xl font-light">Digital Detox "Blur"</h3>
                <p className="text-xs font-mono text-white/40 uppercase tracking-widest mt-1">{isDetoxActive ? 'Focus Mode Active' : 'Unrestricted Interface'}</p>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full transition-all relative ${isDetoxActive ? 'bg-white' : 'bg-white/10'}`}>
              <motion.div 
                animate={{ x: isDetoxActive ? 24 : 4 }}
                className={`absolute top-1 w-4 h-4 rounded-full ${isDetoxActive ? 'bg-black' : 'bg-white/40'}`}
              />
            </div>
          </div>

          {/* Guided Micro-Naps */}
          <div className="bg-white/5 border border-white/10 p-8 rounded-[40px] flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${isNapping ? 'bg-yellow-500 text-black' : 'bg-white/5 text-white/40'}`}>
                <Coffee size={32} />
              </div>
              <div>
                <h3 className="text-xl font-light">Micro-Nap</h3>
                <p className="text-xs font-mono text-white/40 uppercase tracking-widest mt-1">{isNapping ? 'Resting...' : 'Ready for Recharge'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-mono mb-2">{formatTime(napTime)}</p>
              <button 
                onClick={() => setIsNapping(!isNapping)}
                className={`px-6 py-2 rounded-full text-[10px] font-mono uppercase tracking-widest transition-all ${isNapping ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500 text-black'}`}
              >
                {isNapping ? 'Wake Up' : 'Rest'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* The Vault (Hidden Layer) */}
      <motion.div 
        drag="y"
        dragConstraints={{ top: -500, bottom: 0 }}
        onDragEnd={(_, info) => {
          if (info.offset.y < -100) setIsVaultOpen(true);
        }}
        className="fixed bottom-0 left-0 w-full h-12 flex items-center justify-center cursor-pointer group z-20 bg-gradient-to-t from-black to-transparent"
      >
        <div className="flex flex-col items-center gap-1 opacity-50 group-hover:opacity-100 transition-all">
          <ChevronUp size={20} className="animate-bounce" />
          <span className="text-[10px] font-mono tracking-[0.3em] uppercase">Swipe up for The Vault</span>
        </div>
      </motion.div>

      <AnimatePresence>
        {isVaultOpen && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl p-8 flex flex-col"
          >
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-4xl font-light tracking-tighter">THE VAULT</h2>
              <button 
                onClick={() => setIsVaultOpen(false)}
                className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
              >
                <ChevronUp size={24} className="rotate-180" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 flex-1">
              <VaultItem 
                icon={<Shield className="text-blue-400" />}
                title="Longevity Blueprint"
                description="Deep cellular analysis and biological age estimation based on current metabolic trends."
              />
              <VaultItem 
                icon={<AlertTriangle className="text-yellow-400" />}
                title="Symptom Sentinel"
                description="Real-time anomaly detection and predictive health risk assessment."
              />
              <VaultItem 
                icon={<BarChart3 className="text-purple-400" />}
                title="Stress Audit"
                description="Comprehensive cortisol rhythm mapping and neurological recovery reports."
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatCard: React.FC<{ icon: any, title: string, value: string, unit: string, trend: string, color: string }> = ({ icon, title, value, unit, trend, color }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl group transition-all hover:bg-white/10"
  >
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-white/5 rounded-2xl group-hover:scale-110 transition-all">{icon}</div>
      <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">{trend}</span>
    </div>
    <h3 className="text-white/60 text-xs font-mono uppercase tracking-widest mb-1">{title}</h3>
    <div className="flex items-baseline gap-2">
      <span className="text-3xl font-light">{value}</span>
      <span className="text-xs opacity-40 font-mono">{unit}</span>
    </div>
  </motion.div>
);

const VaultItem: React.FC<{ icon: any, title: string, description: string }> = ({ icon, title, description }) => (
  <div className="bg-white/5 border border-white/10 p-8 rounded-[40px] hover:bg-white/10 transition-all group">
    <div className="mb-6">{icon}</div>
    <h3 className="text-2xl font-light mb-4">{title}</h3>
    <p className="text-white/50 leading-relaxed text-sm">{description}</p>
    <button className="mt-8 text-xs font-mono tracking-widest uppercase text-blue-400 group-hover:text-blue-300 transition-all flex items-center gap-2">
      View Deep Report <ChevronUp size={14} className="rotate-90" />
    </button>
  </div>
);
