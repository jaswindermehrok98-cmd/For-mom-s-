import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart3, TrendingUp, Heart, Brain, Baby, Calendar, CheckCircle, ChevronRight, Filter, Download, Plus, Info, Users, Shield, Thermometer, Wind, Bell, Settings, FileText } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const data = [
  { name: 'Mon', weight: 72.5, pressure: 120, focus: 85 },
  { name: 'Tue', weight: 72.3, pressure: 118, focus: 82 },
  { name: 'Wed', weight: 72.4, pressure: 122, focus: 88 },
  { name: 'Thu', weight: 72.1, pressure: 115, focus: 90 },
  { name: 'Fri', weight: 72.2, pressure: 119, focus: 84 },
  { name: 'Sat', weight: 72.0, pressure: 117, focus: 86 },
  { name: 'Sun', weight: 71.9, pressure: 116, focus: 92 },
];

export const TheLedger: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'blueprint' | 'maternal' | 'roadmap' | 'tribe'>('blueprint');
  const [isExporting, setIsExporting] = useState(false);
  const [bioAge, setBioAge] = useState(28.4);
  const [actualAge, setActualAge] = useState(32);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => setIsExporting(false), 2000);
  };

  return (
    <div className="min-h-screen w-full bg-[#050505] text-white p-8 pb-32">
      {/* Header */}
      <div className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-6xl font-light tracking-tighter mb-2">THE LEDGER</h1>
          <p className="text-xs font-mono tracking-[0.4em] uppercase opacity-40">Universal Health Monitoring</p>
        </div>
        <div className="flex gap-4">
          <button className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
            <Filter size={20} />
          </button>
          <button className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center hover:bg-blue-500 transition-all shadow-[0_0_20px_rgba(59,130,246,0.5)]">
            <Download size={20} />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-8 mb-12 border-b border-white/5">
        <TabButton 
          active={activeTab === 'blueprint'} 
          onClick={() => setActiveTab('blueprint')}
          label="The Blueprint"
          icon={<BarChart3 size={18} />}
        />
        <TabButton 
          active={activeTab === 'maternal'} 
          onClick={() => setActiveTab('maternal')}
          label="Maternal Suite"
          icon={<Baby size={18} />}
        />
        <TabButton 
          active={activeTab === 'roadmap'} 
          onClick={() => setActiveTab('roadmap')}
          label="Longevity Roadmap"
          icon={<Calendar size={18} />}
        />
        <TabButton 
          active={activeTab === 'tribe'} 
          onClick={() => setActiveTab('tribe')}
          label="Tribe Ledger"
          icon={<Users size={18} />}
        />
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'blueprint' && (
          <motion.div 
            key="blueprint"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <MetricCard title="Weight Wisdom" value="71.9" unit="kg" trend="-0.6kg" icon={<TrendingUp className="text-blue-400" />} />
              <MetricCard title="Pressure Point" value="116/78" unit="mmHg" trend="Stable" icon={<Heart className="text-red-400" />} />
              <MetricCard title="Focus Flow" value="92" unit="%" trend="+4%" icon={<Brain className="text-purple-400" />} />
              <MetricCard title="Biological Age" value={bioAge.toFixed(1)} unit="Years" trend={`-${(actualAge - bioAge).toFixed(1)}`} icon={<Shield className="text-green-400" />} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 bg-white/5 border border-white/10 p-10 rounded-[50px] h-[400px]">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-light">Metabolic Stability Index</h3>
                  <div className="flex gap-4">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-blue-400 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-400" /> Weight
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-400" /> Focus
                    </span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="name" stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111', border: '1px solid #ffffff20', borderRadius: '12px' }}
                      itemStyle={{ fontSize: '12px', color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="weight" stroke="#3b82f6" fillOpacity={1} fill="url(#colorWeight)" strokeWidth={2} />
                    <Area type="monotone" dataKey="focus" stroke="#a855f7" fill="transparent" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-col gap-8">
                {/* Environmental Sensor Link */}
                <div className="bg-white/5 border border-white/10 p-8 rounded-[40px]">
                  <h3 className="text-xs font-mono uppercase tracking-widest opacity-40 mb-6">Env Sensor Link</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <Thermometer size={16} className="text-orange-400" />
                        <span className="text-sm font-light">Ambient Temp</span>
                      </div>
                      <span className="text-sm font-mono">24°C</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <Wind size={16} className="text-blue-400" />
                        <span className="text-sm font-light">Air Quality</span>
                      </div>
                      <span className="text-sm font-mono text-green-400">Good</span>
                    </div>
                  </div>
                </div>

                {/* Neo Memory Core */}
                <div className="bg-white/5 border border-white/10 p-8 rounded-[40px] flex-1">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-xs font-mono uppercase tracking-widest opacity-40">Neo Memory Core</h3>
                    <Bell size={16} className="text-yellow-400 animate-pulse" />
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-[10px] font-mono leading-relaxed">
                      Neo noticed your sleep was 12% shorter last night. Adjusting morning protocol...
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-[10px] font-mono leading-relaxed opacity-40">
                      Preference Updated: Low-carb breakfast prioritized.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Doctor Export */}
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-white/10 p-8 rounded-[40px] flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <FileText size={32} className="text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-light">"The Vault" Doctor Export</h3>
                  <p className="text-xs font-mono text-white/40 uppercase tracking-widest mt-1">Generate Encrypted PDF Health Report</p>
                </div>
              </div>
              <button 
                onClick={handleExport}
                disabled={isExporting}
                className="px-8 py-4 bg-blue-600 rounded-2xl font-mono text-xs uppercase tracking-widest hover:bg-blue-500 transition-all disabled:opacity-50"
              >
                {isExporting ? 'Encrypting...' : 'Export Report'}
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'maternal' && (
          <motion.div 
            key="maternal"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            <div className="bg-white/5 border border-white/10 p-10 rounded-[50px]">
              <div className="flex justify-between items-start mb-8">
                <div className="p-4 bg-pink-500/20 rounded-2xl text-pink-400">
                  <Baby size={24} />
                </div>
                <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all">
                  <Plus size={20} />
                </button>
              </div>
              <h3 className="text-2xl font-light mb-4">Baby Kick Log</h3>
              <p className="text-white/50 text-sm leading-relaxed mb-8">Monitor fetal activity patterns and response to maternal nutrition.</p>
              <div className="space-y-4">
                <LogItem time="09:15" activity="High Intensity" duration="4m" />
                <LogItem time="14:30" activity="Moderate" duration="2m" />
                <LogItem time="21:00" activity="High Intensity" duration="6m" />
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 p-10 rounded-[50px]">
              <div className="flex justify-between items-start mb-8">
                <div className="p-4 bg-purple-500/20 rounded-2xl text-purple-400">
                  <Brain size={24} />
                </div>
                <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all">
                  <Plus size={20} />
                </button>
              </div>
              <h3 className="text-2xl font-light mb-4">MoodMom</h3>
              <p className="text-white/50 text-sm leading-relaxed mb-8">Emotional health tracking and hormonal stability analysis.</p>
              <div className="h-48 flex items-end gap-3 px-4">
                {[40, 60, 45, 80, 55, 70, 90].map((h, i) => (
                  <motion.div 
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    className="flex-1 bg-purple-500/30 rounded-t-lg border-t border-purple-400/50"
                  />
                ))}
              </div>
              <div className="flex justify-between mt-4 text-[10px] font-mono uppercase tracking-widest text-white/30">
                <span>Mon</span>
                <span>Sun</span>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'roadmap' && (
          <motion.div 
            key="roadmap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-3xl mx-auto space-y-6"
          >
            <div className="bg-blue-600/20 border border-blue-500/30 p-8 rounded-[40px] mb-12 flex items-center gap-8">
              <div className="w-24 h-24 rounded-full border-4 border-blue-500/30 flex items-center justify-center">
                <span className="text-3xl font-light">84%</span>
              </div>
              <div>
                <h3 className="text-2xl font-light mb-1">Longevity Roadmap</h3>
                <p className="text-blue-400/60 text-sm">You are on track for a 12% healthspan increase this quarter.</p>
              </div>
            </div>

            <RoadmapItem title="Metabolic Reset Protocol" status="Completed" date="Mar 12" />
            <RoadmapItem title="Bone Density Optimization" status="In Progress" date="Ongoing" />
            <RoadmapItem title="Neuro-Stability Audit" status="Upcoming" date="Apr 05" />
            <RoadmapItem title="Cellular Hydration Phase" status="Upcoming" date="Apr 18" />
          </motion.div>
        )}
        {activeTab === 'tribe' && (
          <motion.div 
            key="tribe"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="bg-white/5 border border-white/10 p-10 rounded-[50px]">
              <div className="flex justify-between items-center mb-12">
                <div>
                  <h3 className="text-3xl font-light mb-2">Tribe Ledger</h3>
                  <p className="text-white/40 text-sm">Privacy-first health data sharing with your inner circle.</p>
                </div>
                <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-full text-[10px] font-mono uppercase tracking-widest hover:bg-white/10 transition-all">Invite Member</button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <TribeMember name="Sarah (Partner)" status="Synced" score={92} />
                <TribeMember name="Dr. Kapoor" status="Access: Read-Only" score={88} />
                <TribeMember name="Fitness Coach" status="Access: Training Data" score={95} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TribeMember: React.FC<{ name: string, status: string, score: number }> = ({ name, status, score }) => (
  <div className="flex items-center justify-between p-6 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
        <Users size={20} />
      </div>
      <div>
        <h4 className="text-lg font-light">{name}</h4>
        <p className="text-[10px] font-mono uppercase tracking-widest text-white/30">{status}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="text-xl font-light text-blue-400">{score}%</p>
      <p className="text-[8px] font-mono uppercase opacity-40">Harmony</p>
    </div>
  </div>
);

const TabButton: React.FC<{ active: boolean, onClick: () => void, label: string, icon: any }> = ({ active, onClick, label, icon }) => (
  <button 
    onClick={onClick}
    className={`pb-4 flex items-center gap-3 transition-all relative ${active ? 'text-white' : 'text-white/30 hover:text-white/60'}`}
  >
    {icon}
    <span className="text-sm font-medium tracking-widest uppercase">{label}</span>
    {active && (
      <motion.div 
        layoutId="tab-underline-ledger"
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
      />
    )}
  </button>
);

const MetricCard: React.FC<{ title: string, value: string, unit: string, trend: string, icon: any }> = ({ title, value, unit, trend, icon }) => (
  <div className="bg-white/5 border border-white/10 p-8 rounded-[40px] hover:bg-white/10 transition-all group">
    <div className="flex justify-between items-start mb-6">
      <div className="p-4 bg-white/5 rounded-2xl group-hover:scale-110 transition-all">{icon}</div>
      <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">{trend}</span>
    </div>
    <h3 className="text-white/40 text-xs font-mono uppercase tracking-widest mb-2">{title}</h3>
    <div className="flex items-baseline gap-2">
      <span className="text-4xl font-light">{value}</span>
      <span className="text-xs opacity-40 font-mono">{unit}</span>
    </div>
  </div>
);

const LogItem: React.FC<{ time: string, activity: string, duration: string }> = ({ time, activity, duration }) => (
  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all">
    <div className="flex items-center gap-6">
      <span className="text-xs font-mono text-white/30">{time}</span>
      <span className="text-sm font-light">{activity}</span>
    </div>
    <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">{duration}</span>
  </div>
);

const RoadmapItem: React.FC<{ title: string, status: string, date: string }> = ({ title, status, date }) => (
  <div className="flex items-center justify-between p-6 rounded-[30px] bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
    <div className="flex items-center gap-6">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${status === 'Completed' ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-white/20'}`}>
        <CheckCircle size={24} />
      </div>
      <div>
        <h4 className="text-lg font-light">{title}</h4>
        <p className="text-[10px] font-mono uppercase tracking-widest text-white/30">{date}</p>
      </div>
    </div>
    <div className="flex items-center gap-4">
      <span className={`text-[10px] font-mono uppercase tracking-widest ${status === 'Completed' ? 'text-green-400' : status === 'In Progress' ? 'text-blue-400' : 'text-white/20'}`}>{status}</span>
      <ChevronRight size={18} className="text-white/20 group-hover:text-white/50 transition-all" />
    </div>
  </div>
);
