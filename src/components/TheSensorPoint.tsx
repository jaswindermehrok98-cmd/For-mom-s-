import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Eye, Ear, Activity, Thermometer, Shield, 
  Zap, Mic, Volume2, Box, Compass, 
  Wifi, Fingerprint, Info, ChevronRight,
  Cpu, AlertCircle, Radio, Scan, Apple,
  Wind, Battery, Moon, Sun, Anchor,
  ZapOff, Waves
} from 'lucide-react';

export const TheSensorPoint: React.FC = () => {
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  const [lux, setLux] = useState(450);
  const [npuBitrate, setNpuBitrate] = useState(12.4);
  const [isGulping, setIsGulping] = useState(false);
  const [isStrained, setIsStrained] = useState(false);
  const [ancActive, setAncActive] = useState(true);
  const [irActive, setIrActive] = useState(false);
  const [nfcActive, setNfcActive] = useState(false);

  // New Experimental States
  const [feverLevel, setFeverLevel] = useState(36.6);
  const [ethyleneLevel, setEthyleneLevel] = useState(0.2);
  const [staticStress, setStaticStress] = useState(15);
  const [hapticFreq, setHapticFreq] = useState(432);
  const [airQuality, setAirQuality] = useState(85);
  const [batteryLevel, setBatteryLevel] = useState(82);
  const [isMagneticDeadZone, setIsMagneticDeadZone] = useState(false);
  const [isGreyScale, setIsGreyScale] = useState(false);

  const hasGyro = useRef(false);

  // Real-time Gyroscope Tracking
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.beta !== null && event.gamma !== null) {
        hasGyro.current = true;
        setRotation({
          x: event.beta,
          y: event.gamma,
          z: event.alpha || 0
        });
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  // Simulate sensor data updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (!hasGyro.current) {
        setRotation(prev => ({
          x: (prev.x + 0.5) % 360,
          y: (prev.y + 0.8) % 360,
          z: (prev.z + 0.3) % 360
        }));
      }
      setLux(prev => Math.max(0, Math.min(1000, prev + (Math.random() - 0.5) * 20)));
      setNpuBitrate(prev => Math.max(5, Math.min(25, prev + (Math.random() - 0.5) * 2)));
      
      // Experimental Simulations
      setFeverLevel(prev => Math.max(36.0, Math.min(39.5, prev + (Math.random() - 0.5) * 0.1)));
      setEthyleneLevel(prev => Math.max(0, Math.min(5, prev + (Math.random() - 0.5) * 0.05)));
      setStaticStress(prev => Math.max(0, Math.min(100, prev + (Math.random() - 0.5) * 5)));
      setAirQuality(prev => Math.max(0, Math.min(100, prev + (Math.random() - 0.5) * 2)));
      setBatteryLevel(prev => Math.max(1, prev - 0.01)); // Slow drain
      
      // Random magnetic dead zone detection
      if (Math.random() > 0.99) {
        setIsMagneticDeadZone(true);
        setTimeout(() => setIsMagneticDeadZone(false), 3000);
      }

      // Circadian Battery Sync Logic
      if (batteryLevel < 20 && lux < 50) {
        setIsGreyScale(true);
      } else {
        setIsGreyScale(false);
      }
      
      // Random gulp detection
      if (Math.random() > 0.95) {
        setIsGulping(true);
        setTimeout(() => setIsGulping(false), 500);
      }

      // Random gaze strain
      if (Math.random() > 0.98) {
        setIsStrained(true);
        setTimeout(() => setIsStrained(false), 2000);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [batteryLevel, lux]);

  const handleHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([20, 10, 20]);
    }
  };

  return (
    <div className={`min-h-screen w-full bg-[#050505] text-white p-8 pb-32 overflow-y-auto scrollbar-hide transition-all duration-1000 ${isGreyScale ? 'grayscale brightness-50' : ''}`}>
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-light tracking-tighter mb-1">THE SENSOR POINT</h1>
          <p className="text-[10px] font-mono tracking-[0.3em] uppercase opacity-40">Hardware Vitality</p>
        </div>
        <div className="flex gap-3">
          {isGreyScale && (
            <div className="px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full flex items-center gap-2">
              <Moon size={10} className="text-yellow-400" />
              <span className="text-[8px] font-mono uppercase tracking-widest text-yellow-400">Energy Mirror Active</span>
            </div>
          )}
          <div className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[8px] font-mono uppercase tracking-widest text-green-400">Systems Green</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* --- EXPERIMENTAL HARDWARE HACKS --- */}
        <div className="col-span-full mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-light tracking-widest text-blue-400 uppercase">Experimental Hardware Hacks</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-blue-500/40 to-transparent" />
          </div>
          <p className="text-[8px] font-mono uppercase tracking-[0.2em] opacity-30 mt-1">Redmi Exclusive • NPU Accelerated • Spectral Analysis</p>
        </div>

        {/* 1. Sub-Dermal Fever Map */}
        <SensorCard 
          title="Viral Pre-Detect" 
          icon={<Thermometer size={16} />} 
          onTap={handleHaptic}
          details="Uses Main Camera + AI Vision to detect 'Micro-Flushing' in blood flow. Warns of potential fever 12 hours before symptoms manifest."
        >
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden flex items-center justify-center">
              <div className={`absolute inset-0 transition-colors duration-1000 ${feverLevel > 38 ? 'bg-red-500/20' : feverLevel > 37.5 ? 'bg-orange-500/20' : 'bg-blue-500/10'}`} />
              <Scan size={32} className={feverLevel > 38 ? 'text-red-400' : 'text-blue-400'} />
              <motion.div 
                animate={{ y: [-20, 20, -20] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute w-full h-0.5 bg-blue-400/50 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
              />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-[8px] font-mono uppercase opacity-40">Sub-Dermal Temp</span>
                <span className={`text-lg font-light ${feverLevel > 38 ? 'text-red-400' : 'text-white'}`}>{feverLevel.toFixed(1)}°C</span>
              </div>
              <div className="p-2 bg-white/5 rounded-xl border border-white/5">
                <p className="text-[8px] font-mono uppercase opacity-40 leading-none mb-1">Status</p>
                <p className="text-[10px] font-light">{feverLevel > 38 ? 'Fever Detected' : feverLevel > 37.5 ? 'Micro-Flushing High' : 'Viral Load Stable'}</p>
              </div>
            </div>
          </div>
        </SensorCard>

        {/* 2. Ethylene Gas Sniffer */}
        <SensorCard 
          title="Ripeness Predictor" 
          icon={<Apple size={16} />} 
          onTap={handleHaptic}
          details="Macro Lens + Spectral AI analyzes air pixels for Ethylene gas. Predicts fruit ripening hours and spoilage risk."
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <Apple size={20} className={ethyleneLevel > 3 ? 'text-orange-400' : 'text-green-400'} />
                </div>
                <div>
                  <p className="text-[8px] font-mono uppercase opacity-40 leading-none mb-1">Ethylene Level</p>
                  <p className="text-sm font-light">{ethyleneLevel.toFixed(2)} ppm</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-mono uppercase opacity-40 leading-none mb-1">Perfect In</p>
                <p className="text-sm font-light text-blue-400">~{Math.max(0, Math.round(24 - ethyleneLevel * 4))} Hours</p>
              </div>
            </div>
            <div className="h-8 flex items-center gap-1">
              {[...Array(20)].map((_, i) => (
                <div 
                  key={i} 
                  className={`flex-1 h-full rounded-sm transition-colors ${i < ethyleneLevel * 4 ? 'bg-blue-500' : 'bg-white/5'}`} 
                />
              ))}
            </div>
          </div>
        </SensorCard>

        {/* 3. Static Charge Stress Monitor */}
        <SensorCard 
          title="Electric Anxiety" 
          icon={<Zap size={16} />} 
          onTap={handleHaptic}
          details="Measures Delta in touch-response electricity via Digitizer + Magnetometer. Correlates static buildup with physical tension."
        >
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-xl text-yellow-400">
                  <Zap size={18} />
                </div>
                <span className="text-sm font-light">Static Charge</span>
              </div>
              <span className={`text-lg font-light ${staticStress > 70 ? 'text-yellow-400' : 'text-white'}`}>{staticStress.toFixed(0)}%</span>
            </div>
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-[8px] font-mono uppercase opacity-40 mb-2">Stress Correlation</p>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${staticStress > 70 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                <p className="text-[10px] font-light">{staticStress > 70 ? 'High Tension Detected' : 'Physically Relaxed'}</p>
              </div>
            </div>
          </div>
        </SensorCard>

        {/* 4. Bone-Conduction Haptic Coach */}
        <SensorCard 
          title="Silent Bio-Guide" 
          icon={<Volume2 size={16} />} 
          onTap={handleHaptic}
          details="Uses X-Axis Haptic Motor to deliver Solfeggio frequencies (432Hz/528Hz) directly to the skeletal system for heart-rate sync."
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400">
                  <Waves size={18} />
                </div>
                <span className="text-sm font-light">Solfeggio Sync</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); setHapticFreq(432); handleHaptic(); }}
                  className={`px-2 py-1 rounded-md text-[8px] font-mono ${hapticFreq === 432 ? 'bg-purple-500 text-white' : 'bg-white/5 text-white/40'}`}
                >
                  432Hz
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setHapticFreq(528); handleHaptic(); }}
                  className={`px-2 py-1 rounded-md text-[8px] font-mono ${hapticFreq === 528 ? 'bg-purple-500 text-white' : 'bg-white/5 text-white/40'}`}
                >
                  528Hz
                </button>
              </div>
            </div>
            <div className="h-10 flex items-center justify-center gap-1">
              {[...Array(30)].map((_, i) => (
                <motion.div 
                  key={i}
                  animate={{ height: [10, 30, 10] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.05 }}
                  className="w-0.5 bg-purple-500/40 rounded-full"
                />
              ))}
            </div>
          </div>
        </SensorCard>

        {/* 5. Ionized Air Quality Alert */}
        <SensorCard 
          title="Breath-Easy Score" 
          icon={<Wind size={16} />} 
          onTap={handleHaptic}
          details="Dual Mics measure Acoustic Impedance to estimate room humidity and dust density. Links to IR Blaster for humidifier control."
        >
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-500/10 rounded-xl text-teal-400">
                  <Wind size={18} />
                </div>
                <span className="text-sm font-light">Air Density</span>
              </div>
              <span className="text-lg font-light text-teal-400">{airQuality}%</span>
            </div>
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-[8px] font-mono uppercase opacity-40 mb-1">AI Recommendation</p>
              <p className="text-[10px] font-light leading-relaxed">
                {airQuality < 40 ? 'Air is heavy (Dry). Turn on Humidifier via IR.' : 'Air quality optimal for deep breathing.'}
              </p>
            </div>
          </div>
        </SensorCard>

        {/* 6. Circadian Battery Sync */}
        <SensorCard 
          title="Energy Mirror" 
          icon={<Battery size={16} />} 
          onTap={handleHaptic}
          details="Links Battery Thermistor + Light Sensor to user circadian rhythm. UI slows and dims to Grey-Scale when energy is low."
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
                  <Battery size={18} />
                </div>
                <span className="text-sm font-light">System Energy</span>
              </div>
              <span className="text-lg font-light">{batteryLevel.toFixed(0)}%</span>
            </div>
            <div className="flex gap-2 h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                animate={{ width: `${batteryLevel}%` }}
                className={`h-full ${batteryLevel < 20 ? 'bg-red-500' : 'bg-blue-500'}`}
              />
            </div>
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2 opacity-40">
                <Sun size={10} />
                <span className="text-[8px] font-mono uppercase">Day</span>
              </div>
              <div className={`flex items-center gap-2 ${isGreyScale ? 'text-yellow-400' : 'opacity-40'}`}>
                <Moon size={10} />
                <span className="text-[8px] font-mono uppercase">Night</span>
              </div>
            </div>
          </div>
        </SensorCard>

        {/* 7. Magnetic Earth-Anchor */}
        <SensorCard 
          title="Directional Re-Center" 
          icon={<Anchor size={16} />} 
          onTap={handleHaptic}
          details="Magnetometer + GPS detects 'Magnetic Dead Zones' from electronics. Cues user to walk toward Natural North to reset focus."
        >
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <motion.div 
                animate={{ rotate: rotation.z }}
                className="relative z-10"
              >
                <Compass size={40} className={isMagneticDeadZone ? 'text-red-400' : 'text-blue-400'} />
              </motion.div>
              <AnimatePresence>
                {isMagneticDeadZone && (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1.2, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="absolute inset-0 border-2 border-red-500/30 rounded-full animate-ping"
                  />
                )}
              </AnimatePresence>
            </div>
            <div className={`w-full p-3 rounded-2xl border transition-all text-center ${isMagneticDeadZone ? 'bg-red-500/10 border-red-500/20' : 'bg-white/5 border-white/10'}`}>
              <p className="text-[8px] font-mono uppercase opacity-40 mb-1">Magnetic Status</p>
              <p className="text-[10px] font-light">
                {isMagneticDeadZone ? 'Dead Zone! Walk 10ft North.' : 'Natural North Aligned'}
              </p>
            </div>
          </div>
        </SensorCard>

        {/* --- CORE HARDWARE --- */}
        <div className="col-span-full mt-8 mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-light tracking-widest text-white/20 uppercase">Core Hardware</h2>
            <div className="h-px flex-1 bg-white/5" />
          </div>
        </div>

        {/* 1. The Vision Matrix */}
        <SensorCard 
          title="Vision Matrix" 
          icon={<Eye size={16} />} 
          onTap={handleHaptic}
          className="lg:col-span-2"
          details="Dual-lens depth sensing with 120fps NPU processing. Tracks 24 musculoskeletal points for posture correction and gaze strain detection."
        >
          <div className="flex gap-4 h-full">
            <div className="w-1/2 bg-white/5 rounded-2xl border border-white/10 relative overflow-hidden flex items-center justify-center min-h-[120px]">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/40 via-transparent to-transparent" />
              <div className="w-20 h-20 border border-blue-500/30 rounded-lg rotate-45 flex items-center justify-center">
                <div className="w-16 h-16 border border-blue-400/20 rounded-lg -rotate-12" />
              </div>
              <span className="absolute bottom-2 left-2 text-[6px] font-mono opacity-40 uppercase">Depth Active</span>
            </div>
            <div className="flex-1 flex flex-col justify-between py-1">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[8px] font-mono uppercase opacity-40">NPU Bit-rate</span>
                  <span className="text-sm font-light text-blue-400">{npuBitrate.toFixed(1)} Gbps</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ width: `${(npuBitrate / 25) * 100}%` }}
                    transition={{ type: 'spring', stiffness: 50, damping: 20 }}
                    className="h-full bg-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 bg-white/5 rounded-xl border border-white/5">
                <motion.div 
                  animate={{ 
                    scale: isStrained ? [1, 1.2, 1] : 1,
                    color: isStrained ? '#ef4444' : '#3b82f6'
                  }}
                  className="text-blue-400"
                >
                  <Eye size={16} />
                </motion.div>
                <div>
                  <p className="text-[8px] font-mono uppercase opacity-40 leading-none mb-1">Gaze Monitor</p>
                  <p className="text-[10px] font-light leading-none">{isStrained ? 'Strain Detected' : 'Pupils Stable'}</p>
                </div>
              </div>
            </div>
          </div>
        </SensorCard>

        {/* 2. The Sonic Radar */}
        <SensorCard 
          title="Sonic Radar" 
          icon={<Ear size={16} />} 
          onTap={handleHaptic}
          details="Multi-mic array with active noise cancellation (ANC). Detects high-frequency acoustic signatures like swallowing (gulp detection) and respiratory rhythm."
        >
          <div className="space-y-4">
            <div className="h-16 bg-white/5 rounded-xl border border-white/10 flex items-end gap-0.5 p-1.5 overflow-hidden">
              {[...Array(15)].map((_, i) => (
                <motion.div 
                  key={i}
                  animate={{ height: `${Math.random() * 80 + 20}%` }}
                  transition={{ duration: 0.1, repeat: Infinity }}
                  className="flex-1 bg-blue-500/40 rounded-t-[1px]"
                />
              ))}
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <motion.div 
                  animate={{ scale: isGulping ? 1.5 : 1, opacity: isGulping ? 1 : 0.4 }}
                  className="w-2 h-2 bg-blue-400 rounded-full"
                />
                <span className="text-[8px] font-mono uppercase opacity-40">Gulp Detection</span>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setAncActive(!ancActive);
                }}
                className={`px-3 py-1 rounded-full text-[8px] font-mono uppercase tracking-widest transition-all ${
                  ancActive ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/40 border border-white/10'
                }`}
              >
                ANC: {ancActive ? 'Shield' : 'Off'}
              </button>
            </div>
          </div>
        </SensorCard>

        {/* 3. The Kinetic Core */}
        <SensorCard 
          title="Kinetic Core" 
          icon={<Activity size={16} />} 
          onTap={handleHaptic}
          details="6-axis IMU (Inertial Measurement Unit) tracking pitch, roll, and yaw. Monitors physical symmetry and pressure distribution across the frame."
        >
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <motion.div 
                animate={{ 
                  rotateX: rotation.x,
                  rotateY: rotation.y,
                  rotateZ: rotation.z
                }}
                className="w-12 h-12 border-2 border-blue-500/50 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="w-8 h-8 border border-blue-400/30 rounded-sm" />
              </motion.div>
              <div className="absolute inset-0 bg-blue-500/5 blur-2xl rounded-full" />
            </div>
            <div className="w-full grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-1.5 bg-white/5 rounded-full relative overflow-hidden border border-white/5">
                  <motion.div 
                    animate={{ left: `${45 + Math.random() * 10}%` }}
                    className="absolute top-0 bottom-0 w-1 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"
                  />
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20" />
                </div>
                <p className="text-[7px] font-mono opacity-40 text-center uppercase">Symmetry</p>
              </div>
              <div className="flex gap-2 items-end h-12">
                <div className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex-1 bg-white/5 rounded-md relative overflow-hidden border border-white/5">
                    <motion.div 
                      animate={{ height: '65%' }}
                      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-600 to-blue-400"
                    />
                  </div>
                  <span className="text-[6px] font-mono opacity-40 uppercase">Alt</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex-1 bg-white/5 rounded-md relative overflow-hidden border border-white/5">
                    <motion.div 
                      animate={{ height: '40%' }}
                      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-600 to-blue-400"
                    />
                  </div>
                  <span className="text-[6px] font-mono opacity-40 uppercase">Pres</span>
                </div>
              </div>
            </div>
          </div>
        </SensorCard>

        {/* 4. The Atmospheric Deck */}
        <SensorCard 
          title="Atmospheric Deck" 
          icon={<Thermometer size={16} />} 
          onTap={handleHaptic}
          details="High-precision ambient light sensor (Lux) and digital compass. Includes IR beam projection for low-light environment mapping."
        >
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 overflow-visible">
                  <circle cx="48" cy="48" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                  {/* Glow Effect */}
                  <motion.circle 
                    cx="48" cy="48" r="42" 
                    fill="none" 
                    stroke="#3b82f6" 
                    strokeWidth="8" 
                    strokeDasharray="263.8"
                    animate={{ 
                      strokeDashoffset: 263.8 * (1 - lux / 1000),
                      opacity: [0.2, 0.4, 0.2]
                    }}
                    transition={{ 
                      strokeDashoffset: { type: 'spring', stiffness: 60, damping: 15 },
                      opacity: { duration: 2, repeat: Infinity }
                    }}
                    strokeLinecap="round"
                    className="blur-md"
                  />
                  {/* Main Dial */}
                  <motion.circle 
                    cx="48" cy="48" r="42" 
                    fill="none" 
                    stroke="#3b82f6" 
                    strokeWidth="6" 
                    strokeDasharray="263.8"
                    animate={{ strokeDashoffset: 263.8 * (1 - lux / 1000) }}
                    transition={{ type: 'spring', stiffness: 60, damping: 15 }}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-lg font-light">{lux.toFixed(0)}</span>
                  <span className="text-[7px] font-mono uppercase opacity-40">Lux</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/5 p-2 rounded-2xl border border-white/5 flex flex-col items-center gap-1">
                <Compass size={14} className="text-blue-400" />
                <span className="text-[8px] font-mono uppercase opacity-40">North</span>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIrActive(!irActive);
                }}
                className={`p-2 rounded-2xl border transition-all flex flex-col items-center gap-1 ${
                  irActive ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-white/5 border-white/5 text-white/40'
                }`}
              >
                <Zap size={14} className={irActive ? 'animate-pulse' : ''} />
                <span className="text-[8px] font-mono uppercase opacity-40">IR Beam</span>
              </button>
            </div>
          </div>
        </SensorCard>

        {/* 5. The Bio-Link */}
        <SensorCard 
          title="Bio-Link" 
          icon={<Shield size={16} />} 
          onTap={handleHaptic}
          details="Integrated NFC and SpO2 pulse oximetry. Secure biometric handshake for encrypted health data transmission."
        >
          <div className="space-y-4">
            <div className="relative h-20 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden">
              <AnimatePresence>
                {nfcActive && (
                  <motion.div 
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 3, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute w-12 h-12 border border-blue-500/50 rounded-full"
                  />
                )}
              </AnimatePresence>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setNfcActive(!nfcActive);
                }}
                className="relative z-10 flex flex-col items-center gap-1"
              >
                <Radio size={20} className={nfcActive ? 'text-blue-400' : 'text-white/20'} />
                <span className="text-[8px] font-mono uppercase opacity-40">NFC Scan</span>
              </button>
            </div>
            <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <Fingerprint size={18} className="text-blue-400" />
                <div>
                  <p className="text-[8px] font-mono uppercase opacity-40 leading-none mb-1">SpO2</p>
                  <p className="text-sm font-light leading-none">98%</p>
                </div>
              </div>
              <div className="h-6 flex items-end gap-0.5">
                {[...Array(20)].map((_, i) => (
                  <div key={i} className="flex-1 bg-blue-500/20 h-[40%] rounded-full" />
                ))}
              </div>
            </div>
          </div>
        </SensorCard>
      </div>
    </div>
  );
};

const SensorCard: React.FC<{ 
  title: string, 
  icon: any, 
  children: React.ReactNode, 
  onTap: () => void,
  details: string,
  className?: string 
}> = ({ title, icon, children, onTap, details, className }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isHoveringInfo, setIsHoveringInfo] = useState(false);

  return (
    <motion.div 
      whileHover={{ y: -2 }}
      onClick={onTap}
      className={`bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-3xl flex flex-col group transition-all hover:bg-white/10 cursor-pointer relative overflow-hidden ${className}`}
    >
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-white/5 rounded-lg group-hover:scale-110 transition-all text-blue-400">{icon}</div>
          <h3 className="text-xs font-light tracking-tight">{title}</h3>
        </div>
        <div className="relative">
          <button 
            onMouseEnter={() => setIsHoveringInfo(true)}
            onMouseLeave={() => setIsHoveringInfo(false)}
            onClick={(e) => {
              e.stopPropagation();
              setShowDetails(!showDetails);
            }}
            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all z-20 ${
              showDetails ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/20 hover:text-white'
            }`}
          >
            <Info size={12} />
          </button>
          
          <AnimatePresence>
            {isHoveringInfo && !showDetails && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, x: -10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: -10 }}
                className="absolute right-8 top-0 w-48 bg-black/80 backdrop-blur-md border border-white/10 p-3 rounded-xl z-30 pointer-events-none"
              >
                <p className="text-[10px] font-mono uppercase tracking-widest text-blue-400 mb-1">Technical Specs</p>
                <p className="text-[10px] font-light leading-relaxed text-white/80">{details}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      <div className="flex-1">
        {children}
      </div>

      <AnimatePresence>
        {showDetails && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-xl p-6 z-10 flex flex-col justify-center"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400">{icon}</div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-blue-400">Technical Specs</p>
            </div>
            <p className="text-xs font-light leading-relaxed text-white/80">{details}</p>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowDetails(false);
              }}
              className="mt-6 text-[8px] font-mono uppercase tracking-widest text-white/40 hover:text-white transition-all flex items-center gap-2"
            >
              <div className="w-1 h-1 bg-white/20 rounded-full" />
              Close Details
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
