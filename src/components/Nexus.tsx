import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Send, X, MessageSquare, Navigation } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';

interface NexusProps {
  onNavigate: (page: any) => void;
  currentPage: string;
}

export const Nexus: React.FC<NexusProps> = ({ onNavigate, currentPage }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLiveOpen, setIsLiveOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'neo', content: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

  useEffect(() => {
    if (currentPage === 'sensor') {
      const introMessage = "Sensors check ho rahe hain. Sab systems Green hain. Aapka environment 22% shant hai, focusing on Deep Work.";
      setMessages(prev => [...prev, { role: 'neo', content: introMessage }]);
      // Optionally open chat to show the message
      setIsChatOpen(true);
    }
  }, [currentPage]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userMessage,
        config: {
          systemInstruction: `You are NEO, a high-precision health architect. 
          You can navigate the app. If the user wants to go to a specific section, include a command like [NAVIGATE:page_name] in your response.
          Available pages: sanctuary, vision, nourish, kinetic, ledger, sensor, fitness.
          Current page: ${currentPage}.

          EXPERIMENTAL HARDWARE HACKS (REDMI EXCLUSIVE):
          - Sub-Dermal Fever Map: Detects micro-flushing via camera to warn of fever 12h early.
          - Ethylene Gas Sniffer: Spectral analysis of air pixels to predict fruit ripeness.
          - Static Charge Stress Monitor: Correlates touch-screen static buildup with physical tension.
          - Bone-Conduction Haptic Coach: Delivers Solfeggio frequencies (432Hz/528Hz) via haptic motor.
          - Ionized Air Quality Alert: Uses mics to assess humidity/dust via acoustic impedance.
          - Circadian Battery Sync: Dims UI to Grey-Scale when battery is low and room is dark.
          - Magnetic Earth-Anchor: Detects magnetic dead zones and prompts re-centering.
          - Neo Fitness: AR-linked Agile Humanoid instructor with glass-shell anatomy, muscle heatmaps (Acid Green for engagement, Crimson Red for strain), and 33-point kinematic skeletal mapping.

          Keep responses concise and professional.`,
        },
      });

      const text = response.text || "I'm sorry, I couldn't process that.";
      
      // Check for navigation command
      const navMatch = text.match(/\[NAVIGATE:(\w+)\]/);
      if (navMatch) {
        const targetPage = navMatch[1];
        onNavigate(targetPage);
      }

      setMessages(prev => [...prev, { role: 'neo', content: text.replace(/\[NAVIGATE:\w+\]/, '') }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'neo', content: "Connection to Neo lost. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed top-6 right-6 pointer-events-none z-50">
      <div className="pointer-events-auto flex flex-col items-end gap-4">
        {/* The Nexus Core */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse group-hover:bg-blue-400/30 transition-all duration-500" />
          <div className="relative flex gap-2">
            <button 
              onClick={() => setIsChatOpen(true)}
              className="p-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full text-white hover:bg-white/20 transition-all shadow-lg"
              title="Chat with Neo"
            >
              <MessageSquare size={20} />
            </button>
            <button 
              onClick={() => setIsLiveOpen(true)}
              className="p-3 bg-blue-500/20 backdrop-blur-xl border border-blue-400/30 rounded-full text-white hover:bg-blue-500/30 transition-all shadow-lg"
              title="Talk to Neo"
            >
              <Mic size={20} />
            </button>
          </div>
        </motion.div>

        {/* Chat Interface */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.div 
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              className="absolute top-16 right-0 w-[90vw] max-w-md h-[60vh] bg-black/80 backdrop-blur-2xl border border-white/10 rounded-3xl flex flex-col overflow-hidden shadow-2xl"
            >
              <div className="p-4 border-bottom border-white/10 flex justify-between items-center bg-white/5">
                <span className="text-white font-semibold flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  Neo Architect
                </span>
                <button onClick={() => setIsChatOpen(false)} className="text-white/50 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white/10 text-white/90'}`}>
                      <div className="prose prose-invert text-sm">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white/10 p-3 rounded-2xl flex gap-1">
                      <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-white/5 border-t border-white/10 flex gap-2">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask Neo anything..."
                  className="flex-1 bg-white/10 border border-white/10 rounded-full px-4 py-2 text-white outline-none focus:border-blue-500/50 transition-all"
                />
                <button 
                  onClick={handleSend}
                  className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-500 transition-all"
                >
                  <Send size={18} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live Interface (Talk to Neo) */}
        <AnimatePresence>
          {isLiveOpen && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-3xl z-[60] flex flex-col items-center justify-center p-8"
            >
              <button 
                onClick={() => setIsLiveOpen(false)}
                className="absolute top-8 right-8 text-white/50 hover:text-white"
              >
                <X size={32} />
              </button>

              <div className="relative">
                <motion.div 
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-48 h-48 bg-blue-500/20 rounded-full blur-3xl"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(59,130,246,0.5)]">
                    <Mic size={40} className="text-white" />
                  </div>
                </div>
              </div>

              <div className="mt-12 text-center">
                <h2 className="text-3xl font-bold text-white mb-2">Neo is Listening</h2>
                <p className="text-white/50">Speak naturally to navigate or ask for insights</p>
              </div>

              <div className="mt-24 flex gap-8">
                {[1, 2, 3, 4, 5].map((i) => (
                  <motion.div 
                    key={i}
                    animate={{ height: [20, 60, 20] }}
                    transition={{ duration: 0.5 + Math.random(), repeat: Infinity }}
                    className="w-1 bg-blue-400/50 rounded-full"
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
