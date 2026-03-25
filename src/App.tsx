import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Eye, Utensils, Activity, BarChart3, Bell, Cpu } from 'lucide-react';
import { TheSanctuary } from './components/TheSanctuary';
import { TheVision } from './components/TheVision';
import { TheNourishLab } from './components/TheNourishLab';
import { TheKineticStudio } from './components/TheKineticStudio';
import { TheLedger } from './components/TheLedger';
import { TheSensorPoint } from './components/TheSensorPoint';
import { NeoFitness } from './components/NeoFitness';
import { Nexus } from './components/Nexus';
import { Page } from './types';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('sanctuary');
  const [notification, setNotification] = useState<string | null>(null);

  // Contextual Intelligence: Environment Check
  useEffect(() => {
    const checkEnvironment = () => {
      const hour = new Date().getHours();
      // Simulate bright light detection at night
      if (hour >= 20 || hour <= 5) {
        setNotification("Light bahut bright hai, Sleep Architect protocol ke liye lights dim karein.");
        setTimeout(() => setNotification(null), 5000);
      }
    };
    
    const timer = setTimeout(checkEnvironment, 3000);
    return () => clearTimeout(timer);
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'sanctuary': return <TheSanctuary />;
      case 'vision': return <TheVision />;
      case 'nourish': return <TheNourishLab />;
      case 'kinetic': return <TheKineticStudio />;
      case 'ledger': return <TheLedger />;
      case 'sensor': return <TheSensorPoint />;
      case 'fitness': return <NeoFitness />;
      default: return <TheSanctuary />;
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-black font-sans">
      {/* Page Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 0.9, filter: 'blur(20px)' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="w-full"
        >
          {renderPage()}
        </motion.div>
      </AnimatePresence>

      {/* The Nexus (Global Navigator) */}
      <Nexus onNavigate={(page) => setCurrentPage(page)} currentPage={currentPage} />

      {/* Contextual Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] w-[90vw] max-w-md"
          >
            <div className="bg-blue-600/20 backdrop-blur-2xl border border-blue-500/30 p-4 rounded-2xl flex items-center gap-4 shadow-2xl">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white shrink-0">
                <Bell size={20} className="animate-bounce" />
              </div>
              <p className="text-white text-sm font-medium leading-tight">{notification}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[95vw] max-w-xl">
        <div className="bg-[#0A0A0A]/80 backdrop-blur-3xl border border-white/5 p-1.5 rounded-full flex justify-around items-center shadow-2xl">
          <NavButton 
            active={currentPage === 'sanctuary'} 
            onClick={() => setCurrentPage('sanctuary')} 
            icon={<Home size={18} />} 
            label="Sanctuary"
          />
          <NavButton 
            active={currentPage === 'vision'} 
            onClick={() => setCurrentPage('vision')} 
            icon={<Eye size={18} />} 
            label="Vision"
          />
          <NavButton 
            active={currentPage === 'nourish'} 
            onClick={() => setCurrentPage('nourish')} 
            icon={<Utensils size={18} />} 
            label="Nourish"
          />
          
          <NavButton 
            active={currentPage === 'fitness'} 
            onClick={() => setCurrentPage('fitness')} 
            icon={<Activity size={20} className="text-blue-400" />} 
            label="Neo Fit"
          />

          <NavButton 
            active={currentPage === 'kinetic'} 
            onClick={() => setCurrentPage('kinetic')} 
            icon={<Activity size={18} />} 
            label="Kinetic"
          />
          <NavButton 
            active={currentPage === 'ledger'} 
            onClick={() => setCurrentPage('ledger')} 
            icon={<BarChart3 size={18} />} 
            label="Ledger"
          />
          <NavButton 
            active={currentPage === 'sensor'} 
            onClick={() => setCurrentPage('sensor')} 
            icon={<Cpu size={18} />} 
            label="Sensor"
          />
        </div>
      </nav>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean, onClick: () => void, icon: any, label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-full transition-all relative flex-1 min-w-0 ${active ? 'text-white' : 'text-white/20 hover:text-white/40'}`}
  >
    <div className={`transition-all ${active ? 'scale-110' : 'scale-100'}`}>
      {icon}
    </div>
    <span className={`text-[7px] font-mono uppercase tracking-[0.15em] transition-all ${active ? 'opacity-100' : 'opacity-40'}`}>{label}</span>
    {active && (
      <motion.div 
        layoutId="nav-glow"
        className="absolute inset-0 bg-white/10 rounded-full -z-10 border border-white/5"
        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
      />
    )}
  </button>
);

export default App;
