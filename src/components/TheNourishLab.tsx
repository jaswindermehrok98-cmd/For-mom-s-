import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChefHat, Droplets, Pill, Baby, ChevronRight, Search, Plus, Filter, Heart, Zap, Info, X, Clock, Flame, Scale, Camera, Scan, Activity, Thermometer, Wind, Beaker, RefreshCw, Youtube, Globe, MapPin } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

interface Recipe {
  id: string;
  title: string;
  tag: string;
  calories: string;
  protein: string;
  carbs: string;
  fats: string;
  image: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  spectralData?: {
    freshness: number;
    pesticides: 'None' | 'Trace' | 'High';
    nutrientDensity: number;
  };
}

const RECIPES: Recipe[] = [
  {
    id: '1',
    title: "Chapati Tacos",
    tag: "Desi-Fusion",
    calories: "340",
    protein: "18g",
    carbs: "42g",
    fats: "12g",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=800",
    description: "A perfect blend of traditional Indian flatbread and Mexican street food. High in fiber and lean protein.",
    ingredients: ["2 Whole Wheat Chapatis", "150g Grilled Chicken/Paneer", "Pickled Onions", "Cilantro-Mint Chutney", "Shredded Cabbage"],
    instructions: ["Warm the chapatis on a tawa.", "Layer with protein and cabbage.", "Drizzle with chutney and top with pickled onions.", "Serve with a lime wedge."],
    spectralData: { freshness: 98, pesticides: 'None', nutrientDensity: 85 }
  },
  {
    id: '2',
    title: "Quinoa Biryani",
    tag: "Metabolic Peak",
    calories: "420",
    protein: "12g",
    carbs: "65g",
    fats: "8g",
    image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&q=80&w=800",
    description: "A low-GI alternative to traditional rice biryani. Packed with complete plant-based protein.",
    ingredients: ["1 cup Quinoa", "Mixed Vegetables (Carrots, Peas, Beans)", "Biryani Spices", "Saffron Strands", "Greek Yogurt (for garnish)"],
    instructions: ["Rinse quinoa thoroughly.", "Sauté vegetables with spices.", "Cook quinoa with veggies and saffron.", "Fluff and serve with yogurt."],
    spectralData: { freshness: 92, pesticides: 'None', nutrientDensity: 94 }
  },
  {
    id: '3',
    title: "Tandoori Salmon",
    tag: "Omega-3 Boost",
    calories: "380",
    protein: "32g",
    carbs: "5g",
    fats: "24g",
    image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=800",
    description: "Heart-healthy salmon marinated in traditional tandoori spices and grilled to perfection.",
    ingredients: ["200g Salmon Fillet", "Tandoori Masala", "Lemon Juice", "Ginger-Garlic Paste", "Asparagus Spears"],
    instructions: ["Marinate salmon for 30 mins.", "Preheat oven or tandoor.", "Grill for 12-15 mins.", "Serve with steamed asparagus."],
    spectralData: { freshness: 95, pesticides: 'None', nutrientDensity: 88 }
  },
  {
    id: '4',
    title: "Lentil & Kale Bowl",
    tag: "Iron Shield",
    calories: "310",
    protein: "16g",
    carbs: "48g",
    fats: "6g",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800",
    description: "A nutrient-dense bowl designed to boost iron levels and support immune function.",
    ingredients: ["1 cup Cooked Lentils", "2 cups Chopped Kale", "Cherry Tomatoes", "Lemon-Tahini Dressing", "Sunflower Seeds"],
    instructions: ["Massage kale with a bit of lemon juice.", "Toss with lentils and tomatoes.", "Drizzle with dressing.", "Top with seeds for crunch."],
    spectralData: { freshness: 99, pesticides: 'Trace', nutrientDensity: 91 }
  }
];

export const TheNourishLab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'architect' | 'logging' | 'maternal' | 'metabolic'>('architect');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  // Logging State
  const [water, setWater] = useState(1.8);
  const [calories, setCalories] = useState(1240);
  const [supplements, setSupplements] = useState(4);
  const [isScanning, setIsScanning] = useState(false);
  
  // Fasting State
  const [fastingTime, setFastingTime] = useState(0);
  const [isFasting, setIsFasting] = useState(false);
  
  // Metabolic State
  const [glucoseLevel, setGlucoseLevel] = useState(95);
  const [predictedSpike, setPredictedSpike] = useState(115);

  // AI Pairing State
  const [aiPairing, setAiPairing] = useState<{
    meal: string;
    drink: string;
    sweet: string;
    recipe: string;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSearch = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setIsGenerating(true);
      setAiPairing(null);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `For the meal "${searchQuery}", suggest a matching drink and a matching sweet. Also provide a concise recipe for "${searchQuery}".`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                meal: { type: Type.STRING },
                drink: { type: Type.STRING },
                sweet: { type: Type.STRING },
                recipe: { type: Type.STRING }
              },
              required: ["meal", "drink", "sweet", "recipe"]
            }
          }
        });
        
        if (response.text) {
          const data = JSON.parse(response.text);
          setAiPairing(data);
        }
      } catch (error) {
        console.error("Search generation failed:", error);
      } finally {
        setIsGenerating(false);
      }
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isFasting) {
      interval = setInterval(() => setFastingTime(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isFasting]);

  const formatFastingTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };
  
  // AR Scanner Advanced State
  const [scanState, setScanState] = useState<'searching' | 'locked' | 'analyzing' | 'success' | 'non-food'>('searching');
  const scanStateRef = useRef(scanState);
  useEffect(() => { scanStateRef.current = scanState; }, [scanState]);

  const [neoLog, setNeoLog] = useState<string>('');
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [detectedType, setDetectedType] = useState<string | null>(null);
  const scanTimerRef = useRef<NodeJS.Timeout | null>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Maternal State
  const [kicks, setKicks] = useState(0);
  const [contractions, setContractions] = useState<{ start: Date, duration: number }[]>([]);
  const [isTimingContraction, setIsTimingContraction] = useState(false);
  const [contractionStartTime, setContractionStartTime] = useState<Date | null>(null);

  const filteredRecipes = useMemo(() => {
    return RECIPES.filter(recipe => 
      recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.tag.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleAddWater = () => setWater(prev => Math.min(prev + 0.25, 5));
  const handleAddCalories = () => setCalories(prev => prev + 100);
  const handleAddSupplement = () => setSupplements(prev => Math.min(prev + 1, 10));

  // AR Scanner Logic
  const typeNeoLog = (text: string, tag: '[NEO_LOG]: ' | '[SENS_ADVICE]: ' = '[NEO_LOG]: ') => {
    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    setNeoLog('');
    let i = 0;
    const fullText = tag + text;
    typingIntervalRef.current = setInterval(() => {
      setNeoLog(fullText.slice(0, i + 1));
      i++;
      if (i >= fullText.length) clearInterval(typingIntervalRef.current!);
    }, 30);
  };

  useEffect(() => {
    if (isScanning) {
      setScanState('searching');
      setNeoLog('');
      setScanProgress(0);
      setIsFlashOn(false);
      
      // 5-second Neo Intervention Timer
      scanTimerRef.current = setTimeout(() => {
        if (scanStateRef.current === 'searching') {
          const scenarios = [
            { msg: "Andhera thoda zyada hai. Turning on the light so I can see what you're eating.", flash: true },
            { msg: "Focus thoda off hai. Camera steady rakhiye, let me lock-on to the pixels.", haptic: true },
            { msg: "Thoda peeche... I need the full picture to calculate the volume.", haptic: false },
            { msg: "Close aaiye. I need to see the texture for the Freshness Index.", haptic: false }
          ];
          const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
          typeNeoLog(scenario.msg, '[SENS_ADVICE]: ');
          if (scenario.flash) setIsFlashOn(true);
          if (scenario.haptic && window.navigator.vibrate) window.navigator.vibrate([10, 30, 10]);
        }
      }, 5000);

      // Simulation: Randomly find something after some time
      const detectionTimer = setTimeout(() => {
        if (scanStateRef.current !== 'searching') return;

        const roll = Math.random();
        if (roll > 0.7) {
          // Non-food detection
          setScanState('non-food');
          const nonFoodLines = [
            "Ye kafi colorful hai, but nutrition zero. Isse workout nahi, sirf playtime ho sakta hai. Please scan actual food.",
            "Netflix binging is fun, par isme protein nahi milega. Try scanning your dinner plate instead.",
            "Cute distraction! But your pet is a friend, not a snack. Looking for something for your mother's diet plan?"
          ];
          typeNeoLog(nonFoodLines[Math.floor(Math.random() * nonFoodLines.length)]);
        } else {
          // Success Lock-on
          setScanState('locked');
          if (window.navigator.vibrate) window.navigator.vibrate(50); // Haptic Click
          typeNeoLog("Target Locked. Analyzing molecular density...");
          
          // Progress Ring Animation
          let p = 0;
          const pInterval = setInterval(() => {
            p += 10; // Faster progress
            setScanProgress(p);
            if (p >= 100) {
              clearInterval(pInterval);
              setScanState('success');
              setTimeout(() => {
                setCalories(prev => prev + 350);
                setIsScanning(false);
              }, 500);
            }
          }, 20);
        }
      }, 1500); // Shorter detection time

      return () => {
        clearTimeout(scanTimerRef.current!);
        clearTimeout(detectionTimer);
        if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
      };
    }
  }, [isScanning]);

  const handleKick = () => {
    setKicks(prev => prev + 1);
    // Haptic feedback simulation
    if (window.navigator.vibrate) window.navigator.vibrate(50);
  };

  const toggleContraction = () => {
    if (isTimingContraction && contractionStartTime) {
      const duration = Math.floor((new Date().getTime() - contractionStartTime.getTime()) / 1000);
      setContractions(prev => [{ start: contractionStartTime, duration }, ...prev].slice(0, 5));
      setIsTimingContraction(false);
    } else {
      setContractionStartTime(new Date());
      setIsTimingContraction(true);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#050505] text-white p-8 pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
        <div>
          <h1 className="text-6xl font-light tracking-tighter mb-2">THE NOURISH LAB</h1>
          <p className="text-xs font-mono tracking-[0.4em] uppercase opacity-40">Gastronomy & Specialized Fueling</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className={`relative flex-1 md:flex-none transition-all duration-500 ${isSearching ? 'md:w-64' : 'md:w-12'}`}>
            <input 
              type="text"
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              onFocus={() => setIsSearching(true)}
              onBlur={() => !searchQuery && setIsSearching(false)}
              className={`w-full h-12 rounded-full bg-white/5 border border-white/10 pl-12 pr-4 outline-none focus:border-blue-500/50 transition-all ${isSearching ? 'opacity-100' : 'opacity-0 md:opacity-100 cursor-pointer'}`}
            />
            <button 
              onClick={() => setIsSearching(!isSearching)}
              className="absolute left-0 top-0 w-12 h-12 flex items-center justify-center text-white/40 hover:text-white transition-all"
            >
              <Search size={20} />
            </button>
          </div>
          <button className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center hover:bg-blue-500 transition-all shadow-[0_0_20px_rgba(59,130,246,0.5)] shrink-0">
            <Plus size={24} />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-8 mb-12 border-b border-white/5 overflow-x-auto no-scrollbar">
        <TabButton 
          active={activeTab === 'architect'} 
          onClick={() => setActiveTab('architect')}
          label="Diet Architect"
          icon={<ChefHat size={18} />}
        />
        <TabButton 
          active={activeTab === 'logging'} 
          onClick={() => setActiveTab('logging')}
          label="Logging Suite"
          icon={<Droplets size={18} />}
        />
        <TabButton 
          active={activeTab === 'maternal'} 
          onClick={() => setActiveTab('maternal')}
          label="Maternal Hub"
          icon={<Baby size={18} />}
        />
        <TabButton 
          active={activeTab === 'metabolic'} 
          onClick={() => setActiveTab('metabolic')}
          label="Metabolic Lab"
          icon={<Activity size={18} />}
        />
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'architect' && (
          <motion.div 
            key="architect"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {isGenerating && (
              <div className="mb-8 p-8 bg-white/5 border border-white/10 rounded-[40px] animate-pulse">
                <div className="flex items-center gap-4">
                  <RefreshCw className="animate-spin text-blue-400" />
                  <p className="font-mono text-xs uppercase tracking-widest">Neo is architecting your meal pairing...</p>
                </div>
              </div>
            )}

            {aiPairing && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-12 p-8 bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/30 rounded-[40px] relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8">
                  <button onClick={() => setAiPairing(null)} className="text-white/20 hover:text-white transition-all">
                    <X size={24} />
                  </button>
                </div>

                <div className="relative z-10">
                  <div className="mb-8">
                    <h3 className="text-4xl font-light tracking-tighter mb-2">Neo's Pairing: {aiPairing.meal}</h3>
                    <p className="text-[10px] font-mono text-blue-400 uppercase tracking-[0.4em]">AI-Generated Gastronomy</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <PairingBox title="Main Meal" name={aiPairing.meal} icon={<ChefHat size={20} />} />
                    <PairingBox title="Matching Drink" name={aiPairing.drink} icon={<Droplets size={20} />} />
                    <PairingBox title="Matching Sweet" name={aiPairing.sweet} icon={<Zap size={20} className="text-yellow-400" />} />
                  </div>

                  <div className="bg-black/40 p-8 rounded-3xl border border-white/5 mb-8">
                    <h4 className="text-xs font-mono uppercase tracking-widest text-white/40 mb-4">The Recipe</h4>
                    <p className="text-sm text-white/80 leading-relaxed font-light">{aiPairing.recipe}</p>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-xs font-mono uppercase tracking-widest text-white/40">External Intelligence</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <SearchLinksGroup title={aiPairing.meal} label="Meal" />
                      <SearchLinksGroup title={aiPairing.drink} label="Drink" />
                      <SearchLinksGroup title={aiPairing.sweet} label="Sweet" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {filteredRecipes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredRecipes.map(recipe => (
                  <RecipeCard 
                    key={recipe.id}
                    recipe={recipe}
                    onClick={() => setSelectedRecipe(recipe)}
                  />
                ))}
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-white/20 border border-dashed border-white/10 rounded-[40px]">
                <Search size={48} className="mb-4 opacity-10" />
                <p className="font-mono text-xs uppercase tracking-widest">No recipes found matching "{searchQuery}"</p>
              </div>
            )}
            
            <div className="bg-white/5 border border-white/10 p-8 rounded-[40px]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-light">Metabolic Meal Plan</h3>
                <button className="text-xs font-mono tracking-widest uppercase text-blue-400">View Full Plan</button>
              </div>
              <div className="space-y-4">
                <MealItem time="08:00" meal="Spiced Avocado Toast" status="Completed" />
                <MealItem time="13:00" meal="Lentil & Kale Bowl" status="Up Next" />
                <MealItem time="19:00" meal="Tandoori Salmon" status="Planned" />
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'logging' && (
          <motion.div 
            key="logging"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Spectral Scanner Trigger */}
            <div 
              className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-white/10 p-8 rounded-[40px] flex items-center justify-between cursor-pointer hover:border-blue-500/50 transition-all group"
              onClick={() => setIsScanning(true)}
            >
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-blue-500 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.4)] group-hover:scale-110 transition-all">
                  <Camera size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-light">Spectral Food Scanner</h3>
                  <p className="text-xs font-mono text-white/40 uppercase tracking-widest mt-1">NPU-Powered Nutrient Analysis</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-blue-400">
                <span className="text-[10px] font-mono uppercase tracking-widest">Launch Lens</span>
                <ChevronRight size={16} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Fasting Architect */}
              <div className="bg-white/5 border border-white/10 p-8 rounded-[40px] relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="text-xl font-light mb-1">Fasting Architect</h3>
                      <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Current Protocol: 16:8</p>
                    </div>
                    <Clock size={24} className={isFasting ? 'text-blue-400 animate-spin-slow' : 'text-white/20'} />
                  </div>
                  <div className="text-5xl font-light mb-8 font-mono tracking-tighter">
                    {formatFastingTime(fastingTime)}
                  </div>
                  <button 
                    onClick={() => setIsFasting(!isFasting)}
                    className={`w-full py-4 rounded-2xl font-mono text-xs uppercase tracking-widest transition-all ${
                      isFasting ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-blue-600 text-white'
                    }`}
                  >
                    {isFasting ? 'End Fast' : 'Start Fast'}
                  </button>
                </div>
              </div>

              {/* Metabolic Recipe Alchemy */}
              <div className="bg-white/5 border border-white/10 p-8 rounded-[40px]">
                <h3 className="text-xl font-light mb-6 flex items-center gap-3">
                  <Beaker size={20} className="text-purple-400" />
                  Recipe Alchemy
                </h3>
                <p className="text-sm text-white/50 mb-6">Generate a 3-ingredient metabolic booster based on current biometrics.</p>
                <div className="flex flex-wrap gap-2 mb-8">
                  <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-mono text-white/60">Turmeric</span>
                  <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-mono text-white/60">Ginger</span>
                  <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-mono text-white/60">Black Pepper</span>
                </div>
                <button className="w-full py-4 bg-purple-600/20 border border-purple-500/30 rounded-2xl text-purple-400 font-mono text-xs uppercase tracking-widest hover:bg-purple-600/30 transition-all">
                  Transmute Ingredients
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <LogCard 
                title="Hydration Fuel Cell"
                icon={<Droplets className="text-blue-400" />}
                value={water.toFixed(1)}
                unit="Liters"
                goal="3.0"
                color="blue"
                onAdd={handleAddWater}
              />
              <LogCard 
                title="Vitality Vault"
                icon={<Pill className="text-purple-400" />}
                value={`${supplements}/6`}
                unit="Supplements"
                goal="6"
                color="purple"
                onAdd={handleAddSupplement}
              />
              <LogCard 
                title="Nourishment"
                icon={<ChefHat className="text-orange-400" />}
                value={calories.toLocaleString()}
                unit="Calories"
                goal="2,100"
                color="orange"
                onAdd={handleAddCalories}
              />
            </div>
          </motion.div>
        )}

        {activeTab === 'metabolic' && (
          <motion.div 
            key="metabolic"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Glucose Spike Predictor */}
              <div className="bg-white/5 border border-white/10 p-8 rounded-[40px]">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-xl font-light mb-1">Glucose Spike Predictor</h3>
                    <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">AI-Modeled Glycemic Response</p>
                  </div>
                  <Activity size={20} className="text-red-400" />
                </div>
                <div className="h-48 flex items-end gap-2 mb-6">
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.sin(i * 0.3) * 40 + 60}%` }}
                      className={`flex-1 rounded-t-sm ${i > 12 ? 'bg-red-500/40' : 'bg-green-500/40'}`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest text-white/40">
                  <span>Current: {glucoseLevel} mg/dL</span>
                  <span className="text-red-400">Predicted Peak: {predictedSpike} mg/dL</span>
                </div>
              </div>

              {/* Micronutrient Periodic Table */}
              <div className="bg-white/5 border border-white/10 p-8 rounded-[40px]">
                <h3 className="text-xl font-light mb-6 flex items-center gap-3">
                  <Wind size={20} className="text-blue-400" />
                  Micronutrient Periodic Table
                </h3>
                <div className="grid grid-cols-5 gap-2">
                  {['Mg', 'Zn', 'Fe', 'K', 'Ca', 'B12', 'D3', 'C', 'Se', 'Cu'].map((el, i) => (
                    <div key={i} className="aspect-square bg-white/5 border border-white/10 rounded-lg flex flex-col items-center justify-center group hover:bg-blue-500/20 hover:border-blue-500 transition-all cursor-help">
                      <span className="text-xs font-bold">{el}</span>
                      <div className="w-full h-1 bg-white/10 mt-1 rounded-full overflow-hidden px-1">
                        <div className="h-full bg-blue-400" style={{ width: `${Math.random() * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mt-6 text-center">Tap element for bioavailability data</p>
              </div>
            </div>
          </motion.div>
        )}
        {activeTab === 'maternal' && (
          <motion.div 
            key="maternal"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-white/10 p-12 rounded-[50px] relative overflow-hidden">
              <div className="relative z-10 max-w-lg">
                <h2 className="text-4xl font-light mb-4">NutriMom Protocol</h2>
                <p className="text-white/60 leading-relaxed mb-8">Specialized nutrition and hydration tracking for expectant mothers. Optimized for fetal development and maternal energy stability.</p>
                <div className="flex gap-4">
                  <button className="px-8 py-3 bg-white text-black rounded-full font-medium hover:bg-white/90 transition-all">Start Protocol</button>
                  <button className="px-8 py-3 bg-white/10 rounded-full font-medium hover:bg-white/20 transition-all">View Guide</button>
                </div>
              </div>
              <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/4 opacity-20">
                <Baby size={300} strokeWidth={0.5} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Kick Counter */}
              <div className="bg-white/5 border border-white/10 p-8 rounded-[40px] relative overflow-hidden group">
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="text-xl font-light mb-1">Fetal Kick Counter</h3>
                      <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Daily Goal: 10 Kicks</p>
                    </div>
                    <div className="text-4xl font-light text-pink-400">{kicks}</div>
                  </div>
                  <button 
                    onClick={handleKick}
                    className="w-full py-4 bg-pink-500/20 border border-pink-500/30 rounded-2xl text-pink-400 font-mono text-xs uppercase tracking-widest hover:bg-pink-500/30 transition-all active:scale-95"
                  >
                    Log Kick
                  </button>
                </div>
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -bottom-12 -right-12 text-pink-500/10 pointer-events-none"
                >
                  <Heart size={200} />
                </motion.div>
              </div>

              {/* Contraction Timer */}
              <div className="bg-white/5 border border-white/10 p-8 rounded-[40px]">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-xl font-light mb-1">Contraction Timer</h3>
                    <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Track frequency & duration</p>
                  </div>
                  <button 
                    onClick={toggleContraction}
                    className={`px-6 py-2 rounded-full text-[10px] font-mono uppercase tracking-widest transition-all ${
                      isTimingContraction ? 'bg-red-500 text-white animate-pulse' : 'bg-white/10 text-white/60'
                    }`}
                  >
                    {isTimingContraction ? 'Stop Timer' : 'Start Timer'}
                  </button>
                </div>
                
                <div className="space-y-3">
                  {contractions.length > 0 ? (
                    contractions.map((c, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                        <span className="text-[10px] font-mono text-white/40">{c.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="text-xs font-light">Duration: {c.duration}s</span>
                        <span className="text-[10px] font-mono text-blue-400 uppercase">Logged</span>
                      </div>
                    ))
                  ) : (
                    <div className="h-24 flex items-center justify-center text-white/10 border border-dashed border-white/10 rounded-2xl">
                      <p className="text-[10px] font-mono uppercase tracking-widest">No recent data</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 p-8 rounded-[40px]">
                <h3 className="text-xl font-light mb-6 flex items-center gap-3">
                  <Heart size={20} className="text-pink-400" />
                  Prenatal Essentials
                </h3>
                <div className="space-y-4">
                  <CheckItem label="Folic Acid (400mcg)" checked={true} />
                  <CheckItem label="Iron Supplement" checked={true} />
                  <CheckItem label="DHA / Omega-3" checked={false} />
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 p-8 rounded-[40px]">
                <h3 className="text-xl font-light mb-6 flex items-center gap-3">
                  <Zap size={20} className="text-yellow-400" />
                  Energy Management
                </h3>
                <p className="text-sm text-white/50 mb-4">Current energy stability: High. Blood sugar levels optimized for second trimester.</p>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="w-3/4 h-full bg-yellow-400" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spectral Scanner Modal */}
      <AnimatePresence>
        {isScanning && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center p-8 overflow-hidden"
          >
            {/* Viewfinder Matrix */}
            <div className={`relative w-full max-w-2xl aspect-square rounded-[60px] overflow-hidden border-2 transition-all duration-500 ${
              scanState === 'locked' ? 'border-blue-500 shadow-[0_0_50px_rgba(59,130,246,0.4)]' : 
              scanState === 'non-food' ? 'border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.4)]' :
              'border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.05)]'
            }`}>
              {/* Simulated Camera Feed */}
              <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center">
                <motion.div 
                  animate={{ 
                    scale: scanState === 'locked' ? 1.05 : [1, 1.1, 1],
                    opacity: scanState === 'locked' ? 0.8 : [0.3, 0.5, 0.3]
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className={`w-64 h-64 border-2 rounded-full transition-colors duration-500 ${
                    scanState === 'locked' ? 'border-blue-500/40' : 
                    scanState === 'non-food' ? 'border-red-500/40' : 'border-blue-500/20'
                  }`}
                />
                
                {/* Flash Overlay */}
                <AnimatePresence>
                  {isFlashOn && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.2 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-white"
                    />
                  )}
                </AnimatePresence>

                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_black_100%)] opacity-60" />
              </div>

              {/* Scanning UI */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {/* Scanning Line */}
                <motion.div 
                  animate={{ y: [-150, 150, -150] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className={`w-full h-px shadow-[0_0_15px_currentColor] transition-colors duration-500 ${
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
                      className="absolute w-48 h-48 border-2 border-blue-400 rounded-3xl flex items-center justify-center"
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
                        <p className="text-xl font-light">{scanProgress}%</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-12 text-center">
                  <div className="flex items-center gap-3 justify-center mb-2">
                    <Scan size={20} className={`${scanState === 'locked' ? 'text-blue-400' : 'text-white/40'} animate-pulse`} />
                    <span className={`text-xs font-mono uppercase tracking-[0.3em] ${scanState === 'locked' ? 'text-blue-400' : 'text-white/40'}`}>
                      {scanState === 'locked' ? 'Target Acquired' : 'Analyzing Molecular Spectrum'}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">
                    {scanState === 'locked' ? 'Bio-Liveness Scan Active' : 'Point lens at organic matter'}
                  </p>
                </div>
              </div>

              {/* Corner Accents */}
              <div className="absolute top-12 left-12 w-8 h-8 border-t-2 border-l-2 border-blue-500/50 rounded-tl-xl" />
              <div className="absolute top-12 right-12 w-8 h-8 border-t-2 border-r-2 border-blue-500/50 rounded-tr-xl" />
              <div className="absolute bottom-12 left-12 w-8 h-8 border-b-2 border-l-2 border-blue-500/50 rounded-bl-xl" />
              <div className="absolute bottom-12 right-12 w-8 h-8 border-b-2 border-r-2 border-blue-500/50 rounded-br-xl" />
            </div>

            {/* Neo Guidance Overlay */}
            <div className="mt-12 w-full max-w-2xl">
              <div className="bg-black/80 backdrop-blur-md border border-white/10 p-6 rounded-3xl min-h-[100px] flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Active Intelligence Feed</span>
                </div>
                <p className="font-mono text-sm tracking-tight text-green-400 leading-relaxed">
                  {neoLog || "[SYSTEM_SCAN_FAILED]: Recalibrating sensors... Please align object within the Matrix."}
                </p>
              </div>
            </div>

            <div className="mt-8 flex gap-6">
              <button 
                onClick={() => setIsScanning(false)}
                className="px-12 py-4 rounded-full bg-white/5 border border-white/10 font-mono text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                Abort Scan
              </button>
              {scanState === 'non-food' && (
                <button 
                  onClick={() => setScanState('searching')}
                  className="px-12 py-4 rounded-full bg-white/10 font-mono text-xs uppercase tracking-widest hover:bg-white/20 transition-all"
                >
                  Retry Scan
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recipe Detail Modal */}
      <AnimatePresence>
        {selectedRecipe && (
          <RecipeDetailModal 
            recipe={selectedRecipe} 
            onClose={() => setSelectedRecipe(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const RecipeDetailModal: React.FC<{ recipe: Recipe, onClose: () => void }> = ({ recipe, onClose }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-xl"
    onClick={onClose}
  >
    <motion.div 
      initial={{ scale: 0.9, y: 20, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      exit={{ scale: 0.9, y: 20, opacity: 0 }}
      className="bg-[#0a0a0a] border border-white/10 w-full max-w-4xl max-h-[90vh] rounded-[50px] overflow-hidden flex flex-col md:flex-row"
      onClick={e => e.stopPropagation()}
    >
      {/* Left: Image & Spectral Data */}
      <div className="w-full md:w-1/2 h-64 md:h-auto relative">
        <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        
        {/* Spectral Overlay */}
        <div className="absolute bottom-8 left-8 right-8">
          <div className="bg-black/40 backdrop-blur-md border border-white/10 p-6 rounded-3xl">
            <div className="flex items-center gap-3 mb-4">
              <Scan size={16} className="text-blue-400 animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-blue-400">Spectral Analysis Active</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-[8px] font-mono uppercase opacity-40 mb-1">Freshness</p>
                <p className="text-lg font-light">{recipe.spectralData?.freshness}%</p>
              </div>
              <div className="text-center">
                <p className="text-[8px] font-mono uppercase opacity-40 mb-1">Pesticides</p>
                <p className={`text-lg font-light ${recipe.spectralData?.pesticides === 'None' ? 'text-green-400' : 'text-yellow-400'}`}>{recipe.spectralData?.pesticides}</p>
              </div>
              <div className="text-center">
                <p className="text-[8px] font-mono uppercase opacity-40 mb-1">Density</p>
                <p className="text-lg font-light">{recipe.spectralData?.nutrientDensity}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Content */}
      <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-start mb-8">
          <div>
            <span className="text-[10px] font-mono tracking-widest uppercase text-blue-400 mb-2 block">{recipe.tag}</span>
            <h2 className="text-4xl font-light tracking-tight">{recipe.title}</h2>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all">
            <X size={20} />
          </button>
        </div>

        <p className="text-white/60 leading-relaxed mb-8">{recipe.description}</p>

        <div className="grid grid-cols-4 gap-4 mb-12">
          <MacroStat label="Cals" value={recipe.calories} icon={<Flame size={12} />} />
          <MacroStat label="Prot" value={recipe.protein} icon={<Scale size={12} />} />
          <MacroStat label="Carb" value={recipe.carbs} icon={<Zap size={12} />} />
          <MacroStat label="Fat" value={recipe.fats} icon={<Droplets size={12} />} />
        </div>

        <div className="space-y-8">
          <div>
            <h3 className="text-xs font-mono uppercase tracking-widest text-white/30 mb-4">Ingredients</h3>
            <ul className="space-y-2">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-light">
                  <div className="w-1 h-1 rounded-full bg-blue-500" />
                  {ing}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-mono uppercase tracking-widest text-white/30 mb-4">Instructions</h3>
            <ol className="space-y-4">
              {recipe.instructions.map((step, i) => (
                <li key={i} className="flex gap-4">
                  <span className="text-xs font-mono text-blue-400/50 mt-1">0{i+1}</span>
                  <p className="text-sm font-light leading-relaxed">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <button className="w-full mt-12 py-4 bg-blue-600 rounded-2xl font-medium hover:bg-blue-500 transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]">
          Add to Meal Plan
        </button>
      </div>
    </motion.div>
  </motion.div>
);

const MacroStat: React.FC<{ label: string, value: string, icon: any }> = ({ label, value, icon }) => (
  <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
    <div className="flex items-center gap-2 text-[8px] font-mono uppercase opacity-40 mb-1">
      {icon}
      {label}
    </div>
    <p className="text-sm font-light">{value}</p>
  </div>
);

const TabButton: React.FC<{ active: boolean, onClick: () => void, label: string, icon: any }> = ({ active, onClick, label, icon }) => (
  <button 
    onClick={onClick}
    className={`pb-4 flex items-center gap-3 transition-all relative shrink-0 ${active ? 'text-white' : 'text-white/30 hover:text-white/60'}`}
  >
    {icon}
    <span className="text-sm font-medium tracking-widest uppercase">{label}</span>
    {active && (
      <motion.div 
        layoutId="tab-underline"
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
      />
    )}
  </button>
);

const RecipeCard: React.FC<{ recipe: Recipe, onClick: () => void }> = ({ recipe, onClick }) => (
  <motion.div 
    layout
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="group cursor-pointer"
    onClick={onClick}
  >
    <div className="relative h-64 rounded-[40px] overflow-hidden mb-4">
      <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" referrerPolicy="no-referrer" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      <div className="absolute bottom-6 left-6">
        <span className="text-[10px] font-mono tracking-widest uppercase bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 mb-2 inline-block">{recipe.tag}</span>
        <h3 className="text-2xl font-light">{recipe.title}</h3>
      </div>
      <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all">
        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
          <ChevronRight size={20} />
        </div>
      </div>
    </div>
    <div className="flex gap-6 text-xs font-mono text-white/40 uppercase tracking-widest px-4">
      <div className="flex items-center gap-1">
        <Flame size={10} />
        <span>{recipe.calories} kcal</span>
      </div>
      <div className="flex items-center gap-1">
        <Scale size={10} />
        <span>{recipe.protein} protein</span>
      </div>
    </div>
  </motion.div>
);

const MealItem: React.FC<{ time: string, meal: string, status: string }> = ({ time, meal, status }) => (
  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all group">
    <div className="flex items-center gap-6">
      <span className="text-xs font-mono text-white/30">{time}</span>
      <span className="text-sm font-light">{meal}</span>
    </div>
    <div className="flex items-center gap-3">
      <span className={`text-[10px] font-mono uppercase tracking-widest ${status === 'Completed' ? 'text-green-400' : 'text-white/30'}`}>{status}</span>
      <ChevronRight size={14} className="text-white/20 group-hover:text-white/50 transition-all" />
    </div>
  </div>
);

const LogCard: React.FC<{ title: string, icon: any, value: string, unit: string, goal: string, color: string, onAdd: () => void }> = ({ title, icon, value, unit, goal, color, onAdd }) => {
  const progress = Math.min((parseFloat(value.replace(/,/g, '')) / parseFloat(goal.replace(/,/g, ''))) * 100, 100);
  
  return (
    <div className="bg-white/5 border border-white/10 p-8 rounded-[40px] hover:bg-white/10 transition-all group">
      <div className="mb-8 flex justify-between items-start">
        <div className="p-4 bg-white/5 rounded-2xl group-hover:scale-110 transition-all">{icon}</div>
        <button 
          onClick={onAdd}
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/20 transition-all active:scale-90"
        >
          <Plus size={20} />
        </button>
      </div>
      <h3 className="text-white/40 text-xs font-mono uppercase tracking-widest mb-2">{title}</h3>
      <div className="flex items-baseline gap-2 mb-6">
        <span className="text-4xl font-light">{value}</span>
        <span className="text-xs opacity-40 font-mono">{unit}</span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest text-white/30">
          <span>Progress</span>
          <span>Goal: {goal} {unit}</span>
        </div>
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className={`h-full bg-${color}-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]`}
          />
        </div>
      </div>
    </div>
  );
};

const CheckItem: React.FC<{ label: string, checked: boolean }> = ({ label, checked }) => (
  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5">
    <span className="text-sm font-light">{label}</span>
    <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${checked ? 'bg-green-500 border-green-500' : 'border-white/20'}`}>
      {checked && <Plus size={14} className="text-white rotate-45" />}
    </div>
  </div>
);

const PairingBox: React.FC<{ title: string, name: string, icon: React.ReactNode }> = ({ title, name, icon }) => (
  <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
    <div className="flex items-center gap-3 mb-3 text-white/40">
      {icon}
      <span className="text-[10px] font-mono uppercase tracking-widest">{title}</span>
    </div>
    <p className="text-lg font-light">{name}</p>
  </div>
);

const SearchLinksGroup: React.FC<{ title: string, label: string }> = ({ title, label }) => (
  <div className="space-y-3">
    <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">{label} Resources</p>
    <ul className="space-y-2">
      <li className="flex items-center gap-2">
        <Youtube size={14} className="text-red-500" />
        <a 
          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(title)}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-white/60 hover:text-white transition-all border-b border-transparent hover:border-white/20"
        >
          Search in YouTube
        </a>
      </li>
      <li className="flex items-center gap-2">
        <Globe size={14} className="text-blue-400" />
        <a 
          href={`https://www.google.com/search?q=${encodeURIComponent(title)}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-white/60 hover:text-white transition-all border-b border-transparent hover:border-white/20"
        >
          Search in Google
        </a>
      </li>
      <li className="flex items-center gap-2">
        <MapPin size={14} className="text-green-400" />
        <a 
          href={`https://www.google.com/maps/search/${encodeURIComponent(title)}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-white/60 hover:text-white transition-all border-b border-transparent hover:border-white/20"
        >
          Search in Maps
        </a>
      </li>
    </ul>
  </div>
);
