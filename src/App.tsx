/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Heart, 
  Activity, 
  Camera, 
  Utensils, 
  Zap, 
  AlertTriangle, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2,
  Mic,
  Scale,
  Volume2,
  VolumeX,
  Clock,
  Wind,
  Droplet,
  Brain,
  CookingPot,
  Stethoscope,
  TrendingUp,
  Plus,
  MessageSquare,
  Send,
  X,
  Search,
  Dumbbell,
  ClipboardList,
  Info,
  MapPin,
  Compass,
  Sun,
  Timer,
  Moon,
  Smile,
  Anchor,
  Pill,
  Baby,
  FileText,
  Thermometer,
  Map,
  Users,
  LayoutGrid,
  LayoutDashboard
} from 'lucide-react';
import { GoogleGenAI, Type, Modality, LiveServerMessage } from "@google/genai";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine 
} from 'recharts';
import { cn } from './lib/utils';
import { db, auth, signIn, logOut } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

// --- Types ---

type AppState = 'INITIAL' | 'QUESTIONNAIRE' | 'DASHBOARD' | 'SCAN' | 'LABEL' | 'YOGA' | 'FAST' | 'DIET_DAY' | 'MEDICAL_HALT' | 'PLATE_TO_PILL' | 'WORKOUT_LOG' | 'MEAL_LOG' | 'INGREDIENT_SEARCH' | 'POSTURE_TEST' | 'METABOLIC_WALK' | 'STRESS_AUDIT' | 'HYDRATION_HUB' | 'FEATURE_HUB' | 'SLEEP_ARCHITECT' | 'MOOD_HARMONY' | 'CORE_POWER' | 'VITALITY_VAULT' | 'SYMPTOM_SENTINEL' | 'LONGEVITY_BLUEPRINT' | 'VITAL_VIBE' | 'WEIGHT_WISDOM' | 'PRESSURE_POINT' | 'GLUCOSE_GUARD' | 'FOCUS_FLOW' | 'NUTRI_FLOW' | 'HABIT_HUB' | 'RECOVERY_ROADMAP' | 'VITALITY_CIRCLE' | 'PRENATAL_YOGA' | 'NUTRI_MOM' | 'BABY_KICK_LOG' | 'MOOD_MOM' | 'GEMINI_CHAT' | 'GEMINI_LIVE';

interface Question {
  id: number;
  text: string;
  options?: string[];
  type: 'text' | 'choice' | 'number';
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

interface DetectedItem {
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax]
  label: string;
  nutrition?: {
    calories: number;
    protein: string;
    carbs: string;
    fats: string;
    micronutrients: { name: string; amount: string }[];
  };
}

interface FoodPairing {
  item: string;
  suggestedPairing: string;
  reason: string;
}

interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

// --- Constants ---

const safeJsonParse = (text: string, fallback: any = {}) => {
  if (!text) return fallback;
  try {
    // Remove markdown code blocks if present
    const cleanText = text.replace(/```json\n?|```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("Failed to parse JSON:", e, "Original text:", text);
    return fallback;
  }
};

const getSaved = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    if (saved === null) return fallback;
    
    // If it's a data URL, it's definitely a string and not JSON
    if (saved.startsWith('data:image')) {
      return saved as unknown as T;
    }

    // Handle primitive types if they were saved as strings without JSON.stringify
    // or if fallback is null but we expect a string (common for images/blobs)
    const isLikelyJson = saved.startsWith('{') || saved.startsWith('[') || saved.startsWith('"');
    
    if (typeof fallback === 'string' && !isLikelyJson) {
      return saved as unknown as T;
    }
    if (typeof fallback === 'number' && !isNaN(Number(saved)) && !saved.startsWith('"')) {
      return Number(saved) as unknown as T;
    }
    if (typeof fallback === 'boolean' && (saved === 'true' || saved === 'false')) {
      return (saved === 'true') as unknown as T;
    }

    // If fallback is null, we need to guess if it's JSON or a raw string
    if (fallback === null && !isLikelyJson) {
      return saved as unknown as T;
    }

    return JSON.parse(saved);
  } catch (e) {
    console.error(`Failed to parse saved state for ${key}:`, e);
    return fallback;
  }
};

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // We don't throw here to avoid crashing the app, but we log it.
}

const VITALITY_FEATURES = [
  { id: 'GEMINI_CHAT', name: 'Gemini Architect', icon: <MessageSquare className="w-6 h-6" />, color: 'bg-emerald-50 text-emerald-600', category: 'AI Assistants', desc: 'Chat with your personal health architect.' },
  { id: 'GEMINI_LIVE', name: 'Gemini Live', icon: <Mic className="w-6 h-6" />, color: 'bg-rose-50 text-rose-600', category: 'AI Assistants', desc: 'Real-time voice conversations with AI.' },
  { id: 'SCAN', name: 'Fridge Vision', icon: <LayoutGrid className="w-6 h-6" />, color: 'bg-emerald-50 text-emerald-600', category: 'AR Scanners', desc: 'Scan your fridge for meal ideas.' },
  { id: 'PLATE_TO_PILL', name: 'Plate-to-Pill', icon: <Camera className="w-6 h-6" />, color: 'bg-blue-50 text-blue-600', category: 'AR Scanners', desc: 'Analyze meal nutrient absorption.' },
  { id: 'POSTURE_TEST', name: 'Posture Guard', icon: <Compass className="w-6 h-6" />, color: 'bg-indigo-50 text-indigo-600', category: 'AR Scanners', desc: 'Stability & alignment assessment.' },
  { id: 'DIET_DAY', name: 'Diet Architect', icon: <Utensils className="w-6 h-6" />, color: 'bg-emerald-50 text-emerald-700', category: 'Food & Nutrition', desc: 'Personalized metabolic meal plan.' },
  { id: 'MEAL_LOG', name: 'Nourishment Log', icon: <ClipboardList className="w-6 h-6" />, color: 'bg-emerald-50 text-emerald-600', category: 'Food & Nutrition', desc: 'Log your daily intake.' },
  { id: 'INGREDIENT_SEARCH', name: 'Ingredient Spotlight', icon: <Info className="w-6 h-6" />, color: 'bg-purple-50 text-purple-600', category: 'Food & Nutrition', desc: 'Metabolic impact analysis.' },
  { id: 'YOGA', name: 'Yoga Studio', icon: <Zap className="w-6 h-6" />, color: 'bg-purple-50 text-purple-600', category: 'Exercise & Fitness', desc: 'Bone & core health routines.' },
  { id: 'METABOLIC_WALK', name: 'Metabolic Walk', icon: <MapPin className="w-6 h-6" />, color: 'bg-emerald-50 text-emerald-600', category: 'Exercise & Fitness', desc: 'Interval GPS tracking.' },
  { id: 'WORKOUT_LOG', name: 'Movement Studio', icon: <Dumbbell className="w-6 h-6" />, color: 'bg-orange-50 text-orange-600', category: 'Exercise & Fitness', desc: 'Track strength & mobility.' },
  { id: 'HYDRATION_HUB', name: 'Hydration Hub', icon: <Droplet className="w-6 h-6" />, color: 'bg-blue-50 text-blue-600', category: 'Health Monitoring', desc: 'AI-driven hydration strategy.' },
  { id: 'STRESS_AUDIT', name: 'Stress Audit', icon: <Brain className="w-6 h-6" />, color: 'bg-orange-50 text-orange-600', category: 'Health Monitoring', desc: 'Vocal stress analysis.' },
  { id: 'SLEEP_ARCHITECT', name: 'Sleep Architect', icon: <Moon className="w-6 h-6" />, color: 'bg-indigo-50 text-indigo-600', category: 'Health Monitoring', desc: 'AI-generated sleep hygiene.' },
  { id: 'MOOD_HARMONY', name: 'Mood Harmony', icon: <Smile className="w-6 h-6" />, color: 'bg-pink-50 text-pink-600', category: 'Health Monitoring', desc: 'Sentiment-based emotional wellness.' },
  { id: 'CORE_POWER', name: 'Core Power', icon: <Anchor className="w-6 h-6" />, color: 'bg-teal-50 text-teal-600', category: 'Exercise & Fitness', desc: 'Guided core & stability recovery.' },
  { id: 'VITALITY_VAULT', name: 'Vitality Vault', icon: <Pill className="w-6 h-6" />, color: 'bg-amber-50 text-amber-600', category: 'Food & Nutrition', desc: 'Supplement & medication scheduler.' },
  { id: 'SYMPTOM_SENTINEL', name: 'Symptom Sentinel', icon: <Stethoscope className="w-6 h-6" />, color: 'bg-red-50 text-red-600', category: 'Health Monitoring', desc: 'AI symptom tracking & risk assessment.' },
  { id: 'LONGEVITY_BLUEPRINT', name: 'Longevity Blueprint', icon: <FileText className="w-6 h-6" />, color: 'bg-blue-50 text-blue-600', category: 'Health Monitoring', desc: 'Guided longevity plan architect.' },
  { id: 'VITAL_VIBE', name: 'Vital Vibe', icon: <Heart className="w-6 h-6" />, color: 'bg-purple-50 text-purple-600', category: 'Health Monitoring', desc: 'Heart rate & pulse rhythm monitor.' },
  { id: 'WEIGHT_WISDOM', name: 'Weight Wisdom', icon: <Scale className="w-6 h-6" />, color: 'bg-emerald-50 text-emerald-600', category: 'Health Monitoring', desc: 'Longevity-specific weight analytics.' },
  { id: 'PRESSURE_POINT', name: 'Pressure Point', icon: <Activity className="w-6 h-6" />, color: 'bg-rose-50 text-rose-600', category: 'Health Monitoring', desc: 'Blood pressure monitoring.' },
  { id: 'GLUCOSE_GUARD', name: 'Glucose Guard', icon: <Droplet className="w-6 h-6" />, color: 'bg-cyan-50 text-cyan-600', category: 'Health Monitoring', desc: 'Metabolic glucose tracking.' },
  { id: 'FOCUS_FLOW', name: 'Focus Flow', icon: <Timer className="w-6 h-6" />, color: 'bg-orange-50 text-orange-600', category: 'Health Monitoring', desc: 'Precision deep work timer.' },
  { id: 'NUTRI_FLOW', name: 'Nutri Flow', icon: <Utensils className="w-6 h-6" />, color: 'bg-sky-50 text-sky-600', category: 'Food & Nutrition', desc: 'Nutrient & hydration logger.' },
  { id: 'HABIT_HUB', name: 'Habit Hub', icon: <LayoutGrid className="w-6 h-6" />, color: 'bg-lime-50 text-lime-600', category: 'Health Monitoring', desc: 'Daily habit tracking.' },
  { id: 'RECOVERY_ROADMAP', name: 'Recovery Roadmap', icon: <Map className="w-6 h-6" />, color: 'bg-violet-50 text-violet-600', category: 'Health Monitoring', desc: 'Longevity healing checklist.' },
  { id: 'VITALITY_CIRCLE', name: 'Vitality Circle', icon: <Users className="w-6 h-6" />, color: 'bg-fuchsia-50 text-fuchsia-600', category: 'Health Monitoring', desc: 'Community & support network.' },
];

const MATERNAL_FEATURES = [
  { id: 'PRENATAL_YOGA', name: 'Prenatal Yoga', icon: <Dumbbell className="w-6 h-6" />, color: 'bg-emerald-50 text-emerald-600', desc: 'Safe & gentle yoga routines for each trimester.' },
  { id: 'NUTRI_MOM', name: 'NutriMom', icon: <Utensils className="w-6 h-6" />, color: 'bg-pink-50 text-pink-600', desc: 'Maternal nutrition & hydration tracking.' },
  { id: 'BABY_KICK_LOG', name: 'Baby Kick Log', icon: <Baby className="w-6 h-6" />, color: 'bg-blue-50 text-blue-600', desc: 'Track your baby\'s movement & patterns.' },
  { id: 'MOOD_MOM', name: 'MoodMom', icon: <Smile className="w-6 h-6" />, color: 'bg-purple-50 text-purple-600', desc: 'Emotional wellness & support for mothers.' },
];

const BATCH_1_QUESTIONS: Question[] = [
  { id: 1, text: "What is your current age?", type: 'number' },
  { id: 2, text: "Current height (cm)?", type: 'number' },
  { id: 3, text: "Current weight (kg)?", type: 'number' },
  { id: 4, text: "Average hours of sleep per night?", type: 'number' },
  { id: 5, text: "How would you rate your energy levels (1-10)?", type: 'number' },
  { id: 6, text: "Do you have any known food allergies?", type: 'text' },
  { id: 7, text: "Are you currently taking any medications?", type: 'text' },
  { id: 8, text: "How many glasses of water do you drink daily?", type: 'number' },
  { id: 9, text: "Do you experience joint pain frequently?", options: ["Never", "Rarely", "Sometimes", "Often", "Always"], type: 'choice' },
  { id: 10, text: "What is your primary health goal?", options: ["Weight Loss", "Energy", "Bone Health", "Heart Health", "Longevity"], type: 'choice' },
  { id: 11, text: "How often do you cook traditional heritage recipes?", options: ["Daily", "Weekly", "Monthly", "Rarely"], type: 'choice' },
  { id: 12, text: "Do you experience bloating after meals?", options: ["Never", "Rarely", "Sometimes", "Often"], type: 'choice' },
  { id: 13, text: "What time is your last meal of the day?", type: 'text' },
  { id: 14, text: "Do you take Vitamin D or Calcium supplements?", options: ["Yes", "No"], type: 'choice' },
  { id: 15, text: "How many minutes of sunlight do you get daily?", type: 'number' },
  { id: 16, text: "Rate your stress level this week (1-10).", type: 'number' },
  { id: 17, text: "Do you have a history of high blood pressure?", options: ["Yes", "No", "Not Sure"], type: 'choice' },
  { id: 18, text: "How many steps do you walk on average daily?", type: 'number' },
  { id: 19, text: "Do you experience dizziness when standing up quickly?", options: ["Yes", "No"], type: 'choice' },
  { id: 20, text: "Are you ready to commit to your health fortress?", options: ["Yes", "I need more info"], type: 'choice' },
];

// --- Components ---

const MedicalSafetyProtocol = ({ onReset }: { onReset: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="fixed inset-0 z-50 flex items-center justify-center bg-red-950/90 p-6 backdrop-blur-xl"
  >
    <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-2xl border-4 border-red-600">
      <AlertTriangle className="w-20 h-20 text-red-600 mx-auto mb-6 animate-pulse" />
      <h2 className="text-3xl font-black text-red-900 mb-4 uppercase tracking-tighter">Medical Safety Protocol Triggered</h2>
      <p className="text-gray-700 mb-8 font-medium leading-relaxed">
        You mentioned <strong>Pain</strong> or <strong>Dizziness</strong>. All wellness advice has been halted. 
        Please contact your primary healthcare provider immediately or seek emergency assistance if symptoms are severe.
      </p>
      <button 
        onClick={onReset}
        className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold hover:bg-red-700 transition-colors shadow-lg"
      >
        I AM SAFE / RESET ENGINE
      </button>
    </div>
  </motion.div>
);

const CameraPreview = ({ videoRef }: { videoRef: React.RefObject<HTMLVideoElement | null> }) => {
  const [error, setError] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const isRequestingRef = useRef(false);

  const setupCamera = async () => {
    if (isRequestingRef.current) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Your browser does not support camera access. Please try a different browser.");
      return;
    }

    setIsRequesting(true);
    isRequestingRef.current = true;
    setError(null);
    
    // Set a timeout for the camera request
    const timeoutId = setTimeout(() => {
      if (isRequestingRef.current) {
        setIsRequesting(false);
        isRequestingRef.current = false;
        setError("Camera request timed out. Please check if your browser is blocking the permission prompt and try again.");
      }
    }, 15000);

    try {
      // Try to stop any existing tracks first
      if (videoRef.current && videoRef.current.srcObject) {
        const oldStream = videoRef.current.srcObject as MediaStream;
        oldStream.getTracks().forEach(track => track.stop());
      }

      let stream: MediaStream;
      try {
        // Try with ideal constraints first
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }, 
          audio: false 
        });
      } catch (firstErr) {
        console.warn("First camera attempt failed, trying fallback:", firstErr);
        // Fallback to basic video
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: false 
        });
      }
      
      clearTimeout(timeoutId);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for metadata to load before playing
        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current?.play();
            setIsRequesting(false);
            isRequestingRef.current = false;
          } catch (playErr) {
            console.error("Video play error:", playErr);
            setError("Click to start camera preview.");
            setIsRequesting(false);
            isRequestingRef.current = false;
          }
        };
      } else {
        setIsRequesting(false);
        isRequestingRef.current = false;
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("Camera access error:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError("Camera access was denied. Please enable it in your browser settings and refresh.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError("No camera found on this device.");
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError("Camera is already in use by another application.");
      } else {
        setError(`Camera error: ${err.message || "Unknown error occurred"}`);
      }
      setIsRequesting(false);
      isRequestingRef.current = false;
    }
  };

  useEffect(() => {
    setupCamera();

    return () => {
      isRequestingRef.current = false;
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, [videoRef, retryCount]);

  if (error) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-zinc-900 z-50">
        <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
        <p className="text-white font-medium mb-6">{error}</p>
        <button 
          onClick={() => setRetryCount(prev => prev + 1)}
          className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-500 transition-all flex items-center gap-2"
        >
          <Camera className="w-5 h-5" />
          {error.includes("Click") ? "Start Camera" : "Retry Camera Access"}
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-zinc-950">
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        className="absolute inset-0 w-full h-full object-cover"
      />
      {isRequesting && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-white font-medium">Requesting Camera...</p>
            <p className="text-white/60 text-xs">Please check for a permission prompt in your browser</p>
          </div>
        </div>
      )}
    </div>
  );
};

const VoiceCommandButton = ({ onCommand }: { onCommand: (cmd: string) => void }) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
      console.error("Speech error:", event.error);
      setError(`Error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const command = event.results[0][0].transcript.toLowerCase();
      console.log("Voice Command:", command);
      onCommand(command);
    };

    recognition.start();
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={startListening}
        className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-colors",
          isListening ? "bg-rose-500 animate-pulse" : "bg-emerald-600 hover:bg-emerald-500"
        )}
      >
        {isListening ? <Mic className="w-8 h-8 text-white" /> : <Mic className="w-8 h-8 text-white" />}
      </motion.button>
      {error && (
        <div className="absolute bottom-20 right-0 bg-white p-3 rounded-xl shadow-lg border border-red-100 text-[10px] text-red-600 w-48">
          {error}
        </div>
      )}
    </div>
  );
};

// --- Components ---

const BoneDensityChart = ({ data }: { data: { date: string, tScore: number }[] }) => {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: '#6b7280' }}
            dy={10}
          />
          <YAxis 
            domain={[-4, 2]} 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: '#6b7280' }}
            dx={-5}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
            labelStyle={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px' }}
          />
          <ReferenceLine y={-1} label={{ position: 'right', value: 'Osteopenia', fill: '#f59e0b', fontSize: 10 }} stroke="#f59e0b" strokeDasharray="3 3" />
          <ReferenceLine y={-2.5} label={{ position: 'right', value: 'Osteoporosis', fill: '#ef4444', fontSize: 10 }} stroke="#ef4444" strokeDasharray="3 3" />
          <Line 
            type="monotone" 
            dataKey="tScore" 
            stroke="#059669" 
            strokeWidth={3} 
            dot={{ r: 4, fill: '#059669', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6, strokeWidth: 0 }}
            animationDuration={1500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// --- AI Initialization ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [appState, setAppState] = useState<AppState>(() => getSaved('matriarch_state', 'INITIAL'));

  const launchFeature = (id: string) => {
    setAppState(id as AppState);
    setRecentFeatures(prev => {
      const filtered = prev.filter(f => f !== id);
      const updated = [id, ...filtered].slice(0, 4);
      localStorage.setItem('matriarch_recent_features', JSON.stringify(updated));
      return updated;
    });
  };

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>(() => getSaved('matriarch_answers', {}));
  const [isStrictCoach, setIsStrictCoach] = useState(() => getSaved('matriarch_strict_coach', false));
  const [vocalStress, setVocalStress] = useState<'NORMAL' | 'STRESSED'>('NORMAL');
  const [lastInput, setLastInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [recipeInput, setRecipeInput] = useState(() => getSaved('matriarch_recipe_input', ''));
  const [isOptimizingRecipe, setIsOptimizingRecipe] = useState(false);
  const [optimizedRecipeResult, setOptimizedRecipeResult] = useState<{
    originalAnalysis: string;
    optimizedVersion: string;
    nutritionalComparison: string;
    swaps?: { original: string; replacement: string; benefit: string }[];
    stats?: {
      original: { calories: string; protein: string; fiber: string; sugar: string };
      optimized: { calories: string; protein: string; fiber: string; sugar: string };
    };
    inflammatoryTriggers?: string[];
  } | null>(() => getSaved('matriarch_optimized_recipe', null));
  const [originalRecipeImage, setOriginalRecipeImage] = useState<string | null>(() => getSaved('matriarch_original_image', null));
  const [optimizedRecipeImage, setOptimizedRecipeImage] = useState<string | null>(() => getSaved('matriarch_optimized_image', null));
  const [dietPlan, setDietPlan] = useState<{
    breakfast: string;
    lunch: string;
    dinner: string;
    snacks: string[];
    hydration: string;
    metabolicFocus: string;
  } | null>(() => getSaved('matriarch_diet_plan', null));
  const [isGeneratingDiet, setIsGeneratingDiet] = useState(false);
  const [refinementFeedback, setRefinementFeedback] = useState('');
  const [recipeSearchQuery, setRecipeSearchQuery] = useState('');
  const [recipeSearchResults, setRecipeSearchResults] = useState<{ name: string, ingredients: string, source?: string }[]>([]);
  const [isSearchingRecipes, setIsSearchingRecipes] = useState(false);
  const [hydrationCount, setHydrationCount] = useState(() => getSaved('matriarch_hydration', 0));
  const [hydrationGoal, setHydrationGoal] = useState(2500); // ml
  const [hydrationLogs, setHydrationLogs] = useState<{ amount: number; time: number }[]>([]);
  const [showHydrationReminder, setShowHydrationReminder] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [selectedSymptom, setSelectedSymptom] = useState<string | null>(null);
  const [symptomSeverity, setSymptomSeverity] = useState(5);
  const [workoutLog, setWorkoutLog] = useState<{ type: string, duration: number, intensity: string, date: string }[]>(() => getSaved('matriarch_workouts', []));
  const [mealLog, setMealLog] = useState<{ name: string, calories: number, type: string, date: string }[]>(() => getSaved('matriarch_meals', []));
  
  // 15 New Feature States
  const [kickCount, setKickCount] = useState(() => getSaved('matriarch_kick_count', 0));
  const [contractionLogs, setContractionLogs] = useState<{ start: number; end?: number; duration?: number; frequency?: number }[]>(() => getSaved('matriarch_contraction_logs', []));
  const [glucoseLogs, setGlucoseLogs] = useState<{ value: number; time: number; type: string }[]>(() => getSaved('matriarch_glucose_logs', []));
  const [pressureLogs, setPressureLogs] = useState<{ sys: number; dia: number; time: number }[]>(() => getSaved('matriarch_pressure_logs', []));
  const [weightLogs, setWeightLogs] = useState<{ value: number; time: number }[]>(() => getSaved('matriarch_weight_logs', []));
  const [moodLogs, setMoodLogs] = useState<{ mood: string; note: string; time: number }[]>(() => getSaved('matriarch_mood_logs', []));
  const [symptomLogs, setSymptomLogs] = useState<{ symptom: string; severity: number; time: number }[]>(() => getSaved('matriarch_symptom_logs', []));
  const [feedingLogs, setFeedingLogs] = useState<{ type: 'breast' | 'bottle'; side?: 'left' | 'right'; amount?: number; time: number }[]>(() => getSaved('matriarch_feeding_logs', []));
  const [nappyLogs, setNappyLogs] = useState<{ type: 'wet' | 'dirty' | 'both'; time: number }[]>(() => getSaved('matriarch_nappy_logs', []));
  const [recoveryTasks, setRecoveryTasks] = useState<{ id: string; text: string; done: boolean }[]>(() => getSaved('matriarch_recovery_tasks', [
    { id: '1', text: 'Pelvic floor check', done: false },
    { id: '2', text: 'Hydration baseline', done: true },
    { id: '3', text: 'Scar tissue massage (if applicable)', done: false },
    { id: '4', text: 'Emotional check-in', done: false },
  ]));
  const [birthPlan, setBirthPlan] = useState(() => getSaved('matriarch_birth_plan', {
    environment: 'Hospital',
    painManagement: 'Epidural',
    support: 'Partner',
    preferences: 'Delayed cord clamping',
  }));
  const [ingredientSearchQuery, setIngredientSearchQuery] = useState('');
  const [ingredientAnalysis, setIngredientAnalysis] = useState<{
    name: string;
    metabolicImpact: string;
    benefits: string[];
    precautions: string[];
    pairings: { item: string; benefit: string }[];
    absorptionTips: string[];
  } | null>(null);
  const [isAnalyzingIngredient, setIsAnalyzingIngredient] = useState(false);
  const [isScanningIngredient, setIsScanningIngredient] = useState(false);
  const [recentFeatures, setRecentFeatures] = useState<string[]>(() => getSaved('matriarch_recent_features', []));
  const [boneDensityData, setBoneDensityData] = useState<{ date: string, tScore: number }[]>([
    { date: '2025-09', tScore: -0.8 },
    { date: '2025-12', tScore: -0.9 },
    { date: '2026-03', tScore: -0.7 },
  ]);
  const [newTScore, setNewTScore] = useState('');
  const [refrigeratorItems, setRefrigeratorItems] = useState<{ name: string, status: string, color: string, detail: string }[]>([]);
  const [refrigeratorRecipes, setRefrigeratorRecipes] = useState<{ title: string, time: string, description: string }[]>([]);
  const [isAnalyzingRefrigerator, setIsAnalyzingRefrigerator] = useState(false);
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);

  // Sensor Features State
  const [isTestingPosture, setIsTestingPosture] = useState(false);
  const [postureScore, setPostureScore] = useState<number | null>(null);
  const [postureData, setPostureData] = useState<{ x: number, y: number, z: number }[]>([]);
  const [postureTimer, setPostureTimer] = useState(30);

  const [isWalking, setIsWalking] = useState(false);
  const [walkPath, setWalkPath] = useState<{ lat: number, lng: number, timestamp: number }[]>([]);
  const [walkStats, setWalkStats] = useState({ distance: 0, speed: 0, startTime: 0 });
  const walkWatchId = useRef<number | null>(null);
  const [walkIntervalMode, setWalkIntervalMode] = useState<'STEADY' | 'FAST' | 'SLOW'>('STEADY');
  const [walkIntervalTimer, setWalkIntervalTimer] = useState(0);
  const [walkMetabolicImpact, setWalkMetabolicImpact] = useState<string | null>(null);

  // AI Hydration State
  const [hydrationStrategy, setHydrationStrategy] = useState<string | null>(null);
  const [isCalculatingHydration, setIsCalculatingHydration] = useState(false);

  // Stress Tracking State
  const [isAuditingStress, setIsAuditingStress] = useState(false);
  const [stressAuditResult, setStressAuditResult] = useState<{
    score: number;
    level: 'LOW' | 'MODERATE' | 'HIGH';
    analysis: string;
    recommendation: string;
  } | null>(null);

  // Yoga State
  const [yogaRoutine, setYogaRoutine] = useState<{
    title: string;
    focus: string;
    poses: { name: string; duration: string; benefit: string; instructions: string }[];
  } | null>(null);
  const [isGeneratingYoga, setIsGeneratingYoga] = useState(false);

  const [foodPairings, setFoodPairings] = useState<FoodPairing[]>([]);
  const [allergenWarnings, setAllergenWarnings] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Sync
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, 'users', user.uid);
    
    // Initial load from Firestore
    const loadData = async () => {
      try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.answers) setAnswers(data.answers);
          if (data.appState) setAppState(data.appState as AppState);
          if (data.isStrictCoach !== undefined) setIsStrictCoach(data.isStrictCoach);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      }
    };
    loadData();

    // Real-time sync for logs (example)
    const logsQuery = collection(db, 'users', user.uid, 'logs');
    const unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
      // Handle logs if needed
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/logs`);
    });

    return () => unsubscribeLogs();
  }, [user]);

  // Save to Firestore when state changes
  useEffect(() => {
    if (!user) return;

    const saveProfile = async () => {
      try {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          answers,
          appState,
          isStrictCoach,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
      }
    };

    const timeoutId = setTimeout(saveProfile, 2000); // Debounce saves
    return () => clearTimeout(timeoutId);
  }, [user, answers, appState, isStrictCoach]);

  // Persistence
  useEffect(() => {
    localStorage.setItem('matriarch_answers', JSON.stringify(answers));
    localStorage.setItem('matriarch_state', appState);
    localStorage.setItem('matriarch_recipe_input', recipeInput);
    if (optimizedRecipeResult) {
      localStorage.setItem('matriarch_optimized_recipe', JSON.stringify(optimizedRecipeResult));
    }
    if (dietPlan) {
      localStorage.setItem('matriarch_diet_plan', JSON.stringify(dietPlan));
    }
    if (originalRecipeImage) {
      localStorage.setItem('matriarch_original_image', originalRecipeImage);
    }
    if (optimizedRecipeImage) {
      localStorage.setItem('matriarch_optimized_image', optimizedRecipeImage);
    }
    localStorage.setItem('matriarch_strict_coach', String(isStrictCoach));
    localStorage.setItem('matriarch_bone_density', JSON.stringify(boneDensityData));
    localStorage.setItem('matriarch_chat', JSON.stringify(chatMessages));
    localStorage.setItem('matriarch_hydration', String(hydrationCount));
    localStorage.setItem('matriarch_workouts', JSON.stringify(workoutLog));
    localStorage.setItem('matriarch_meals', JSON.stringify(mealLog));
    
    // New features persistence
    localStorage.setItem('matriarch_kick_count', String(kickCount));
    localStorage.setItem('matriarch_contraction_logs', JSON.stringify(contractionLogs));
    localStorage.setItem('matriarch_glucose_logs', JSON.stringify(glucoseLogs));
    localStorage.setItem('matriarch_pressure_logs', JSON.stringify(pressureLogs));
    localStorage.setItem('matriarch_weight_logs', JSON.stringify(weightLogs));
    localStorage.setItem('matriarch_mood_logs', JSON.stringify(moodLogs));
    localStorage.setItem('matriarch_symptom_logs', JSON.stringify(symptomLogs));
    localStorage.setItem('matriarch_feeding_logs', JSON.stringify(feedingLogs));
    localStorage.setItem('matriarch_nappy_logs', JSON.stringify(nappyLogs));
    localStorage.setItem('matriarch_recovery_tasks', JSON.stringify(recoveryTasks));
    localStorage.setItem('matriarch_birth_plan', JSON.stringify(birthPlan));
  }, [
    answers, appState, recipeInput, optimizedRecipeResult, isStrictCoach, 
    boneDensityData, chatMessages, hydrationCount, workoutLog, mealLog,
    kickCount, contractionLogs, glucoseLogs, pressureLogs, weightLogs,
    moodLogs, symptomLogs, feedingLogs, nappyLogs, recoveryTasks, birthPlan
  ]);

  // Hydration Reminder Logic
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const hour = now.getHours();
      // Remind between 8 AM and 8 PM if goal not met
      if (hour >= 8 && hour <= 20 && hydrationCount < hydrationGoal) {
        setShowHydrationReminder(true);
        // Auto-hide after 10 seconds
        setTimeout(() => setShowHydrationReminder(false), 10000);
      }
    }, 1000 * 60 * 60); // Check every hour

    return () => clearInterval(interval);
  }, [hydrationCount, hydrationGoal]);

  // --- Sensor Logic ---

  // Posture Test Logic
  useEffect(() => {
    let interval: any;
    if (isTestingPosture && postureTimer > 0) {
      interval = setInterval(() => {
        setPostureTimer(prev => prev - 1);
      }, 1000);

      const handleMotion = (event: DeviceMotionEvent) => {
        if (event.accelerationIncludingGravity) {
          const { x, y, z } = event.accelerationIncludingGravity;
          setPostureData(prev => [...prev, { 
            x: x || 0, 
            y: y || 0, 
            z: z || 0 
          }].slice(-100));
        }
      };

      window.addEventListener('devicemotion', handleMotion);
      return () => {
        clearInterval(interval);
        window.removeEventListener('devicemotion', handleMotion);
      };
    } else if (postureTimer === 0 && isTestingPosture) {
      setIsTestingPosture(false);
      // Calculate score based on variance in motion
      const variance = postureData.reduce((acc, val) => {
        return acc + Math.abs(val.x) + Math.abs(val.y) + Math.abs(val.z);
      }, 0) / (postureData.length || 1);
      
      const score = Math.max(0, Math.min(100, 100 - (variance * 5)));
      setPostureScore(Math.round(score));
    }
  }, [isTestingPosture, postureTimer, postureData]);

  const startPostureTest = async () => {
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        if (permission !== 'granted') {
          setCameraError("Motion sensor permission denied.");
          return;
        }
      } catch (err) {
        console.error("Motion permission error:", err);
      }
    }
    setPostureData([]);
    setPostureTimer(30);
    setIsTestingPosture(true);
  };

  // Metabolic Walk Logic
  useEffect(() => {
    let interval: any;
    if (isWalking) {
      interval = setInterval(() => {
        setWalkIntervalTimer(prev => {
          if (prev <= 1) {
            // Switch mode
            const nextMode = walkIntervalMode === 'STEADY' ? 'FAST' : 
                            walkIntervalMode === 'FAST' ? 'SLOW' : 'FAST';
            setWalkIntervalMode(nextMode);
            return nextMode === 'FAST' ? 120 : 60; // 2 min fast, 1 min slow
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isWalking, walkIntervalMode]);

  const startWalk = () => {
    if (!navigator.geolocation) {
      setCameraError("Geolocation is not supported by your browser.");
      return;
    }

    setIsWalking(true);
    setWalkPath([]);
    setWalkStats({ distance: 0, speed: 0, startTime: Date.now() });
    setWalkIntervalMode('STEADY');
    setWalkIntervalTimer(60); // 1 min warm up
    setWalkMetabolicImpact(null);

    walkWatchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed } = position.coords;
        const newPoint = { lat: latitude, lng: longitude, timestamp: Date.now() };
        
        setWalkPath(prev => {
          const lastPoint = prev[prev.length - 1];
          if (lastPoint) {
            const d = Math.sqrt(
              Math.pow(latitude - lastPoint.lat, 2) + 
              Math.pow(longitude - lastPoint.lng, 2)
            ) * 111320;
            setWalkStats(s => ({
              ...s,
              distance: s.distance + d,
              speed: speed || s.speed
            }));
          }
          return [...prev, newPoint];
        });
      },
      (err) => {
        console.error("Walk error:", err);
        setCameraError("Location access lost. Please ensure GPS is enabled.");
        stopWalk();
      },
      { enableHighAccuracy: true }
    );
  };

  const stopWalk = async () => {
    if (walkWatchId.current !== null) {
      navigator.geolocation.clearWatch(walkWatchId.current);
      walkWatchId.current = null;
    }
    setIsWalking(false);

    if (walkStats.distance > 10) {
      try {
        const prompt = `Analyze this metabolic walk:
          Distance: ${walkStats.distance.toFixed(2)} meters
          Avg Speed: ${(walkStats.speed * 3.6).toFixed(2)} km/h
          Duration: ${Math.round((Date.now() - walkStats.startTime) / 1000)} seconds
          User Data: ${JSON.stringify(answers)}
          
          Provide a concise summary of the metabolic impact on bone density and glucose disposal.`;
        
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt
        });
        setWalkMetabolicImpact(response.text);
      } catch (e) {
        console.error("Failed to generate walk impact:", e);
      }
    }
  };

  // AI Hydration Logic
  const calculateHydrationStrategy = async () => {
    setIsCalculatingHydration(true);
    try {
      const prompt = `Based on this user profile: ${JSON.stringify(answers)}, 
        current hydration: ${hydrationCount}/${hydrationGoal}ml,
        and current time: ${new Date().toLocaleTimeString()},
        provide a personalized hydration strategy. Include specific times and benefits.
        Format as a concise list.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      setHydrationStrategy(response.text);
      speakText("Your personalized hydration strategy has been calculated.");
    } catch (e) {
      console.error("Failed to calculate hydration:", e);
    } finally {
      setIsCalculatingHydration(false);
    }
  };

  // Stress Audit Logic
  const auditStress = async (input: string) => {
    setIsAuditingStress(true);
    try {
      const prompt = `Analyze this user's stress level based on their input: "${input}" 
        and their current vocal stress marker: ${vocalStress}.
        
        Return a JSON object:
        {
          "score": number (0-100),
          "level": "LOW" | "MODERATE" | "HIGH",
          "analysis": "string",
          "recommendation": "string"
        }`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      
      const result = safeJsonParse(response.text);
      setStressAuditResult(result);
    } catch (e) {
      console.error("Failed to audit stress:", e);
    } finally {
      setIsAuditingStress(false);
    }
  };

  // Yoga Logic
  const generateYogaRoutine = async () => {
    setIsGeneratingYoga(true);
    try {
      const prompt = `Generate a personalized yoga routine for a woman with these stats: ${JSON.stringify(answers)}.
        Focus on bone density, pelvic health, and stress relief.
        Current stress level: ${stressAuditResult?.level || vocalStress}.
        
        Return a JSON object:
        {
          "title": "string",
          "focus": "string",
          "poses": [
            { "name": "string", "duration": "string", "benefit": "string", "instructions": "string" }
          ]
        }`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      
      const result = safeJsonParse(response.text);
      setYogaRoutine(result);
      playSuccessSound();
      speakText(`Your ${result.title} routine is ready. Let's begin.`);
    } catch (e) {
      console.error("Failed to generate yoga:", e);
    } finally {
      setIsGeneratingYoga(false);
    }
  };
  // ai initialization moved outside
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [isSpeaking, setIsSpeaking] = useState(false);

  const playSuccessSound = () => {
    if (!isAudioEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      oscillator.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.1); // E6

      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      console.error("Audio feedback failed:", e);
    }
  };

  const speakText = (text: string) => {
    if (!window.speechSynthesis || !isAudioEnabled) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'PLATE' | 'FRIDGE') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      const base64Data = base64.split(',')[1];

      if (type === 'PLATE') {
        await analyzePlateImage(base64Data);
      } else {
        await analyzeFridgeImage(base64Data);
      }
    };
    reader.readAsDataURL(file);
  };

  const analyzePlate = async () => {
    if (!videoRef.current || videoRef.current.readyState < 2) {
      setCameraError("Camera is not ready yet. Please wait a moment.");
      setTimeout(() => setCameraError(null), 3000);
      return;
    }
    try {
      const canvas = document.createElement('canvas');
      const video = videoRef.current;
      const maxDim = 1024;
      let width = video.videoWidth;
      let height = video.videoHeight;
      if (width > maxDim || height > maxDim) {
        if (width > height) { height = (height / width) * maxDim; width = maxDim; }
        else { width = (width / height) * maxDim; height = maxDim; }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, width, height);
      const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      await analyzePlateImage(base64Image);
    } catch (e) {
      console.error("Plate capture error:", e);
    }
  };

  const analyzePlateImage = async (base64Data: string) => {
    setIsAnalyzing(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              { text: "Analyze this meal photo. Identify the food items and provide 'Optimal Food Pairings' with specific benefits for each pairing (e.g., 'Pair spinach with lemon to increase iron absorption via Vitamin C'). Return as JSON: { detectedItems: string[], analysis: string, pairings: { item: string, benefit: string }[] }" },
              { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
            ]
          }
        ],
        config: { responseMimeType: "application/json" }
      });

      const result = JSON.parse(response.text);
      setAnalysisResult(result.analysis);
      setDetectedItems(result.detectedItems.map((item: string) => ({ label: item, box_2d: [0, 0, 0, 0] })));
      setFoodPairings(result.pairings);
      playSuccessSound();
      speakText(`I've analyzed your plate. ${result.analysis}. For optimal nutrition, consider these pairings: ${result.pairings.map((p: any) => `${p.item} for ${p.benefit}`).join('. ')}`);
    } catch (error) {
      console.error("Plate analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeFridgeImage = async (base64Data: string) => {
    setIsAnalyzing(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              { text: "Analyze this refrigerator photo. Identify the ingredients and suggest 3 healthy meal ideas. Return as JSON: { ingredients: string[], suggestions: { title: string, recipe: string }[] }" },
              { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
            ]
          }
        ],
        config: { responseMimeType: "application/json" }
      });

      const result = JSON.parse(response.text);
      setAnalysisResult(`I found ${result.ingredients.join(', ')}. Here are some ideas: ${result.suggestions.map((s: any) => s.title).join(', ')}`);
      playSuccessSound();
      speakText(`I've scanned your fridge. I found ${result.ingredients.join(', ')}. I suggest making ${result.suggestions[0].title}. ${result.suggestions[0].recipe}`);
    } catch (error) {
      console.error("Fridge analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const optimizeRecipe = async () => {
    if (!recipeInput.trim()) return;
    setIsOptimizingRecipe(true);
    setOptimizedRecipeResult(null);
    setOriginalRecipeImage(null);
    setOptimizedRecipeImage(null);

    try {
      // 1. Optimize the text recipe with structured JSON
      const textResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze this traditional recipe for high-fat, high-calorie, or inflammatory ingredients. 
        Provide a heart-healthy, flavor-preserving optimization specifically for a woman's metabolic health. 
        Highlight the nutritional differences and explain why the swaps were made. 
        
        Recipe: ${recipeInput}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              originalAnalysis: { type: Type.STRING },
              optimizedVersion: { type: Type.STRING },
              nutritionalComparison: { type: Type.STRING },
              swaps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    original: { type: Type.STRING },
                    replacement: { type: Type.STRING },
                    benefit: { type: Type.STRING }
                  }
                }
              },
              stats: {
                type: Type.OBJECT,
                properties: {
                  original: {
                    type: Type.OBJECT,
                    properties: {
                      calories: { type: Type.STRING },
                      protein: { type: Type.STRING },
                      fiber: { type: Type.STRING },
                      sugar: { type: Type.STRING }
                    }
                  },
                  optimized: {
                    type: Type.OBJECT,
                    properties: {
                      calories: { type: Type.STRING },
                      protein: { type: Type.STRING },
                      fiber: { type: Type.STRING },
                      sugar: { type: Type.STRING }
                    }
                  }
                }
              },
              inflammatoryTriggers: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      });

      const data = safeJsonParse(textResponse.text, {
        originalAnalysis: 'Analysis unavailable.',
        optimizedVersion: 'Optimization unavailable.',
        nutritionalComparison: 'Comparison unavailable.',
        swaps: [],
        stats: {
          original: { calories: '-', protein: '-', fiber: '-', sugar: '-' },
          optimized: { calories: '-', protein: '-', fiber: '-', sugar: '-' }
        },
        inflammatoryTriggers: []
      });
      setOptimizedRecipeResult(data);
      playSuccessSound();
      speakText(`I've optimized your recipe. ${data.originalAnalysis}. I've replaced ${data.swaps.length} ingredients to make it metabolically friendly.`);

      // 2. Generate images for both versions in parallel
      const generateImage = async (prompt: string) => {
        try {
          const imgResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
              parts: [{ text: prompt }],
            },
            config: {
              imageConfig: {
                aspectRatio: "1:1"
              }
            }
          });
          
          for (const part of imgResponse.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
              return `data:image/png;base64,${part.inlineData.data}`;
            }
          }
        } catch (e) {
          console.error("Image generation failed for prompt:", prompt, e);
        }
        return null;
      };

      const [origImg, optImg] = await Promise.all([
        generateImage(`A high-quality, professional food photograph of the traditional version of this recipe: ${recipeInput}. Make it look like a classic, rich, heritage dish.`),
        generateImage(`A high-quality, professional food photograph of the heart-healthy, optimized version of this recipe: ${recipeInput}. Focus on fresh ingredients, vibrant colors, and a modern, healthy presentation.`)
      ]);

      setOriginalRecipeImage(origImg);
      setOptimizedRecipeImage(optImg);

    } catch (error) {
      console.error("Optimization error:", error);
      setOptimizedRecipeResult("Error optimizing recipe. Please try again.");
    } finally {
      setIsOptimizingRecipe(false);
    }
  };

  const generateDietPlan = async (feedback?: string) => {
    setIsGeneratingDiet(true);
    try {
      const prompt = `Based on the following metabolic profile, generate a personalized 1-day metabolic diet plan for a woman. 
        Focus on bone density, heart health, and energy stabilization.
        
        IMPORTANT: The meals MUST be authentic traditional Punjabi cuisine specifically from the Punjab region of India (e.g., Sarson da Saag, Makki di Roti, Missi Roti, Dal, Paneer, etc., but optimized for metabolic health).
        Provide all the text content (breakfast, lunch, dinner, snacks, hydration, and metabolicFocus) in English to match the application's interface.
        
        Include nutritional breakdown (Calories, Protein, Carbs, Fats) for each meal.
        Add "Plate-to-Pill" absorption tips (e.g., "Eat with Vitamin C for iron absorption").
        
        User Profile Context:
        - Age: ${answers[1] || 'N/A'}
        - BMI Context: Height ${answers[2]}cm, Weight ${answers[3]}kg
        - Sleep: ${answers[4]} hours (Target: 7-9h)
        - Energy: ${answers[5]}/10
        - Allergies: ${answers[6] || 'None'}
        - Medications: ${answers[7] || 'None'}
        - Joint Pain: ${answers[9] || 'N/A'} (If high, focus on anti-inflammatory Punjabi spices like turmeric/haldi and ginger/adrak)
        - Goal: ${answers[10] || 'General Wellness'}
        - Bloating: ${answers[12] || 'N/A'} (If high, suggest digestive aids like ajwain or fennel)
        - Stress: ${answers[16] || 'N/A'}/10 (If high, focus on magnesium-rich seeds and nuts)
        - Blood Pressure: ${answers[17] || 'N/A'} (If high, keep sodium low, focus on potassium-rich greens)
        
        ${feedback ? `\nUSER FEEDBACK FOR REFINEMENT: "${feedback}". Please adjust the plan accordingly while maintaining the metabolic and cultural focus.` : ''}`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              breakfast: { 
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  macros: { type: Type.STRING },
                  absorptionTip: { type: Type.STRING }
                }
              },
              lunch: { 
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  macros: { type: Type.STRING },
                  absorptionTip: { type: Type.STRING }
                }
              },
              dinner: { 
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  macros: { type: Type.STRING },
                  absorptionTip: { type: Type.STRING }
                }
              },
              snacks: { 
                type: Type.ARRAY, 
                items: { 
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    macros: { type: Type.STRING }
                  }
                } 
              },
              hydration: { type: Type.STRING },
              metabolicFocus: { type: Type.STRING }
            }
          }
        }
      });

      const data = safeJsonParse(response.text, {
        breakfast: { name: 'Breakfast plan unavailable.', macros: '', absorptionTip: '' },
        lunch: { name: 'Lunch plan unavailable.', macros: '', absorptionTip: '' },
        dinner: { name: 'Dinner plan unavailable.', macros: '', absorptionTip: '' },
        snacks: [],
        hydration: 'Hydration advice unavailable.',
        metabolicFocus: 'Focus unavailable.'
      });
      setDietPlan(data);
      if (feedback) {
        setRefinementFeedback('');
      }
      playSuccessSound();
      speakText(feedback ? "Your diet plan has been refined." : "Your refined metabolic diet plan is ready. Focus on " + data.metabolicFocus);
    } catch (error) {
      console.error("Diet generation error:", error);
    } finally {
      setIsGeneratingDiet(false);
    }
  };

  const searchRecipes = async () => {
    if (!recipeSearchQuery.trim()) return;
    setIsSearchingRecipes(true);
    setRecipeSearchResults([]);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Search for traditional or heritage recipes matching: "${recipeSearchQuery}". 
        Provide 3-4 distinct recipes. For each, give a clear name and a concise list of main ingredients.
        
        Return the results in JSON format with a 'recipes' key containing an array of objects with 'name' and 'ingredients' (as a string).`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recipes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    ingredients: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      });

      const data = safeJsonParse(response.text, { recipes: [] });
      setRecipeSearchResults(data.recipes);
    } catch (error) {
      console.error("Recipe search error:", error);
    } finally {
      setIsSearchingRecipes(false);
    }
  };

  const analyzeIngredient = async (image?: string) => {
    const query = image ? "the ingredient in this image" : ingredientSearchQuery;
    if (!image && !ingredientSearchQuery.trim()) return;
    
    setIsAnalyzingIngredient(true);
    try {
      const parts: any[] = [{ text: `Analyze the metabolic impact of ${query} for a woman's health. 
        If an image is provided, first identify the ingredient.
        Provide a structured analysis including:
        1. Common name of the ingredient.
        2. Detailed metabolic impact summary (focusing on maternal/metabolic health).
        3. Top 3 specific health benefits.
        4. Any precautions or contraindications.
        5. 3 optimal food pairings for nutrient synergy, including the specific benefit of each pairing.
        6. "Plate-to-Pill" absorption & bio-availability tips (e.g., how to prepare or what to eat it with to maximize nutrient uptake).
        
        Return the results in JSON format.` }];
      
      if (image) {
        parts.unshift({ inlineData: { data: image, mimeType: "image/jpeg" } });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              metabolicImpact: { type: Type.STRING },
              benefits: { type: Type.ARRAY, items: { type: Type.STRING } },
              precautions: { type: Type.ARRAY, items: { type: Type.STRING } },
              pairings: { 
                type: Type.ARRAY, 
                items: { 
                  type: Type.OBJECT,
                  properties: {
                    item: { type: Type.STRING },
                    benefit: { type: Type.STRING }
                  }
                } 
              },
              absorptionTips: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["name", "metabolicImpact", "benefits", "precautions", "pairings", "absorptionTips"]
          }
        }
      });

      const data = safeJsonParse(response.text, null);
      if (data) {
        setIngredientAnalysis(data);
        if (!image) setIngredientSearchQuery('');
      }
    } catch (error) {
      console.error("Ingredient analysis error:", error);
    } finally {
      setIsAnalyzingIngredient(false);
      setIsScanningIngredient(false);
    }
  };

  const analyzeRefrigerator = async () => {
    if (!videoRef.current || videoRef.current.readyState < 2) {
      setCameraError("Camera is not ready yet. Please wait a moment.");
      setTimeout(() => setCameraError(null), 3000);
      return;
    }
    setIsAnalyzingRefrigerator(true);
    try {
      const canvas = document.createElement('canvas');
      const video = videoRef.current;
      const maxDim = 1024;
      let width = video.videoWidth;
      let height = video.videoHeight;
      if (width > maxDim || height > maxDim) {
        if (width > height) { height = (height / width) * maxDim; width = maxDim; }
        else { width = (width / height) * maxDim; height = maxDim; }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, width, height);
      const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            { inlineData: { data: base64Image, mimeType: "image/jpeg" } },
            { text: "Analyze the contents of this refrigerator. Identify the items, their freshness/vitality status, and provide 3 precision recipes based ONLY on the visible items. Focus on metabolic health for women. Return the results in JSON format." }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    status: { type: Type.STRING },
                    color: { type: Type.STRING, description: "Tailwind color class for status dot, e.g., 'bg-emerald-500' for fresh, 'bg-amber-500' for warning" },
                    detail: { type: Type.STRING }
                  },
                  required: ["name", "status", "color", "detail"]
                }
              },
              recipes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    time: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ["title", "time", "description"]
                }
              }
            },
            required: ["items", "recipes"]
          }
        }
      });

      const data = safeJsonParse(response.text, null);
      if (data) {
        setRefrigeratorItems(data.items);
        setRefrigeratorRecipes(data.recipes);
      }
    } catch (error) {
      console.error("Refrigerator analysis error:", error);
    } finally {
      setIsAnalyzingRefrigerator(false);
    }
  };

  const captureIngredient = async () => {
    if (!videoRef.current || videoRef.current.readyState < 2) {
      setCameraError("Camera is not ready yet. Please wait a moment.");
      setTimeout(() => setCameraError(null), 3000);
      return;
    }
    try {
      const canvas = document.createElement('canvas');
      const video = videoRef.current;
      const maxDim = 1024;
      let width = video.videoWidth;
      let height = video.videoHeight;
      if (width > maxDim || height > maxDim) {
        if (width > height) { height = (height / width) * maxDim; width = maxDim; }
        else { width = (width / height) * maxDim; height = maxDim; }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, width, height);
      const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      analyzeIngredient(base64Image);
    } catch (e) {
      console.error("Capture error:", e);
    }
  };

  useEffect(() => {
    const input = lastInput.toUpperCase();
    if (input.includes('PAIN') || input.includes('DIZZINESS')) {
      setAppState('MEDICAL_HALT');
    }
    
    if (input === 'SCAN') setAppState('SCAN');
    if (input === 'PLATE') setAppState('PLATE_TO_PILL');
    if (input === 'HERITAGE') setAppState('DASHBOARD'); 
    if (input === 'DIET DAY') {
      setIsStrictCoach(true);
      setAppState('DIET_DAY');
    }
    if (input === 'YOGA') setAppState('YOGA');
    if (input === 'LABEL') setAppState('LABEL');
    if (input === 'FAST') setAppState('FAST');
    if (input === 'DIET PLAN') setAppState('DASHBOARD');
  }, [lastInput]);

  const handleAnswer = (value: any) => {
    const q = BATCH_1_QUESTIONS[currentQuestionIndex];
    const newAnswers = { ...answers, [q.id]: value };
    setAnswers(newAnswers);
    
    // Check for safety triggers in answers
    if (typeof value === 'string' && (value.toLowerCase().includes('pain') || value.toLowerCase().includes('dizziness'))) {
      setAppState('MEDICAL_HALT');
      return;
    }
    if (q.id === 19 && value === 'Yes') {
      setAppState('MEDICAL_HALT');
      return;
    }

    if (currentQuestionIndex < BATCH_1_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      playSuccessSound();
      setAppState('DASHBOARD');
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage: Message = {
      role: 'user',
      text: chatInput,
      timestamp: Date.now(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const history = chatMessages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: `You are the Matriarch Health Architect, a supportive yet firm health coach for women focusing on metabolic health, bone density, and longevity. 
          You have access to the user's health profile: ${JSON.stringify(answers)}. 
          Current Bone Density Trend: ${JSON.stringify(boneDensityData)}.
          ${dietPlan ? `Current Personalized Diet Plan: ${JSON.stringify(dietPlan)}.` : ''}
          Strict Coach Mode is ${isStrictCoach ? 'ON' : 'OFF'}.
          
          Answer questions about meal plans, routines, exercises, and recipes. 
          If a diet plan exists, refer to it when the user asks about meals or nutrition.
          If Strict Coach Mode is ON, be more direct and emphasize discipline. 
          If the user mentions pain or dizziness, immediately advise them to stop and consult a professional.
          Keep responses concise, empathetic, and scientifically grounded.
          
          You can control the app using the provided tools. Use them to help the user navigate or log data.`,
          tools: [
            {
              functionDeclarations: [
                {
                  name: "navigateTo",
                  description: "Navigate to a specific section of the app.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      destination: {
                        type: Type.STRING,
                        description: "The app state to navigate to.",
                        enum: ["DASHBOARD", "SCAN", "PLATE_TO_PILL", "DIET_DAY", "YOGA", "LABEL", "FAST", "WORKOUT_LOG", "BONE_DENSITY", "HERITAGE", "POSTURE_TEST", "METABOLIC_WALK", "STRESS_AUDIT", "HYDRATION_HUB"]
                      }
                    },
                    required: ["destination"]
                  }
                },
                {
                  name: "logWorkout",
                  description: "Log a new workout session.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      type: { type: Type.STRING, description: "Type of workout (e.g., Yoga, Strength)" },
                      duration: { type: Type.NUMBER, description: "Duration in minutes" }
                    },
                    required: ["type", "duration"]
                  }
                },
                {
                  name: "analyzeIngredient",
                  description: "Manually trigger a metabolic analysis for a specific ingredient by name.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      ingredientName: { type: Type.STRING, description: "The name of the ingredient to analyze" }
                    },
                    required: ["ingredientName"]
                  }
                }
              ]
            }
          ]
        },
      });

      const response = await chat.sendMessage({ message: chatInput });
      
      if (response.functionCalls) {
        for (const call of response.functionCalls) {
          if (call.name === 'navigateTo') {
            const { destination } = call.args as { destination: AppState };
            setAppState(destination);
            const modelMessage: Message = {
              role: 'model',
              text: `Navigating to ${destination.replace('_', ' ')} for you.`,
              timestamp: Date.now(),
            };
            setChatMessages(prev => [...prev, modelMessage]);
          } else if (call.name === 'logWorkout') {
            const { type, duration } = call.args as { type: string, duration: number };
            setWorkoutLog([{ type, duration, intensity: 'Moderate', date: new Date().toLocaleDateString() }, ...workoutLog]);
            playSuccessSound();
            const modelMessage: Message = {
              role: 'model',
              text: `Logged your ${duration} minute ${type} session. Great work!`,
              timestamp: Date.now(),
            };
            setChatMessages(prev => [...prev, modelMessage]);
          } else if (call.name === 'analyzeIngredient') {
            const { ingredientName } = call.args as { ingredientName: string };
            setAppState('LABEL');
            const modelMessage: Message = {
              role: 'model',
              text: `Analyzing ${ingredientName} for you...`,
              timestamp: Date.now(),
            };
            setChatMessages(prev => [...prev, modelMessage]);
            
            // Trigger the actual analysis
            setIsAnalyzingIngredient(true);
            const analysisResponse = await ai.models.generateContent({
              model: "gemini-3-flash-preview",
              contents: `Analyze the metabolic impact of ${ingredientName} for a woman's health. Return JSON.`,
              config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    metabolicImpact: { type: Type.STRING },
                    benefits: { type: Type.ARRAY, items: { type: Type.STRING } },
                    precautions: { type: Type.ARRAY, items: { type: Type.STRING } },
                    absorptionTips: { type: Type.ARRAY, items: { type: Type.STRING } },
                    pairings: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          item: { type: Type.STRING },
                          benefit: { type: Type.STRING }
                        }
                      }
                    }
                  }
                }
              }
            });
            const data = safeJsonParse(analysisResponse.text, null);
            if (data) {
              setIngredientAnalysis(data);
              playSuccessSound();
            }
            setIsAnalyzingIngredient(false);
          }
        }
      } else {
        const modelMessage: Message = {
          role: 'model',
          text: response.text || "I'm sorry, I couldn't process that.",
          timestamp: Date.now(),
        };
        setChatMessages(prev => [...prev, modelMessage]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        role: 'model',
        text: "I'm having trouble connecting to my knowledge base. Please try again in a moment.",
        timestamp: Date.now(),
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleVoiceCommand = (command: string) => {
    setLastInput(command);
    
    if (command.includes('scan') || command.includes('refrigerator')) setAppState('SCAN');
    if (command.includes('plate') || command.includes('pill')) setAppState('PLATE_TO_PILL');
    if (command.includes('yoga') || command.includes('exercise')) setAppState('YOGA');
    if (command.includes('label') || command.includes('nutrition')) setAppState('LABEL');
    if (command.includes('fast') || command.includes('timer')) setAppState('FAST');
    if (command.includes('diet plan') || command.includes('meals')) {
      setLastInput('DIET PLAN');
      setAppState('DASHBOARD');
    }
    if (command.includes('heritage') || command.includes('cooking')) {
      setLastInput('HERITAGE');
      setAppState('DASHBOARD');
    }
    if (command.includes('dashboard') || command.includes('home')) setAppState('DASHBOARD');
    if (command.includes('strict') || command.includes('coach')) {
      setIsStrictCoach(true);
      setAppState('DIET_DAY');
    }
    if (command.includes('normal') || command.includes('relax')) {
      setIsStrictCoach(false);
      setAppState('DASHBOARD');
    }
  };

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-700 font-sans",
      isStrictCoach ? "bg-zinc-950 text-zinc-100" : "bg-[#f5f5f0] text-[#1a1a1a]"
    )}>
      {appState === 'DASHBOARD' && <VoiceCommandButton onCommand={handleVoiceCommand} />}
      <AnimatePresence mode="wait">
        {appState === 'MEDICAL_HALT' && (
          <MedicalSafetyProtocol onReset={() => {
            setAppState('DASHBOARD');
            setLastInput('');
          }} />
        )}

        {appState === 'GEMINI_CHAT' && (
          <GeminiChat 
            onClose={() => {
              setAppState('DASHBOARD');
              setLastInput('');
            }} 
            onVoiceMode={() => setAppState('GEMINI_LIVE')} 
            initialInput={lastInput}
          />
        )}

        {appState === 'GEMINI_LIVE' && (
          <GeminiLiveOverlay onClose={() => setAppState('DASHBOARD')} />
        )}

        {appState === 'INITIAL' && (
          <motion.div 
            key="initial"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center min-h-screen p-6 text-center"
          >
            <div className="w-24 h-24 bg-emerald-600 rounded-full flex items-center justify-center mb-8 shadow-xl shadow-emerald-200">
              <Shield className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-5xl font-serif italic mb-4 text-emerald-900">Hello, Mom.</h1>
            <p className="text-xl text-emerald-800/70 max-w-md mb-12 leading-relaxed">
              I am your <strong>Health Fortress</strong>. My purpose is to protect your vitality, 
              honor your heritage, and architect your metabolic future.
            </p>
            <div className="bg-white/50 backdrop-blur-sm border border-emerald-100 p-6 rounded-3xl mb-12 max-w-sm">
              <p className="text-sm font-medium text-emerald-900 uppercase tracking-widest mb-2">System Status</p>
              <p className="text-emerald-700">LOCKED MODE: Initialization Required</p>
            </div>
            <button 
              onClick={() => setAppState('QUESTIONNAIRE')}
              className="group relative px-12 py-5 bg-emerald-900 text-white rounded-full font-bold text-lg overflow-hidden transition-all hover:scale-105 active:scale-95"
            >
              <span className="relative z-10 flex items-center gap-2">
                Begin Metabolic Baseline <ChevronRight className="w-5 h-5" />
              </span>
              <div className="absolute inset-0 bg-emerald-800 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </button>
          </motion.div>
        )}

        {appState === 'QUESTIONNAIRE' && (
          <motion.div 
            key="questionnaire"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-2xl mx-auto min-h-screen flex flex-col p-6 py-12"
          >
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-emerald-600" />
                <span className="font-bold text-sm uppercase tracking-widest text-emerald-900">Batch 1: Metabolic Baseline</span>
              </div>
              <span className="text-sm font-mono text-emerald-600">
                {currentQuestionIndex + 1} / {BATCH_1_QUESTIONS.length}
              </span>
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <h2 className="text-4xl font-serif text-emerald-950 leading-tight">
                  {BATCH_1_QUESTIONS[currentQuestionIndex].text}
                </h2>

                <div className="space-y-4">
                  {BATCH_1_QUESTIONS[currentQuestionIndex].type === 'choice' && BATCH_1_QUESTIONS[currentQuestionIndex].options?.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleAnswer(option)}
                      className="w-full text-left p-6 rounded-2xl bg-white border border-emerald-100 hover:border-emerald-400 hover:bg-emerald-50 transition-all flex items-center justify-between group"
                    >
                      <span className="text-lg font-medium text-emerald-900">{option}</span>
                      <ChevronRight className="w-5 h-5 text-emerald-300 group-hover:text-emerald-600 transition-colors" />
                    </button>
                  ))}

                  {BATCH_1_QUESTIONS[currentQuestionIndex].type === 'number' && (
                    <div className="relative">
                      <input 
                        type="number"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleAnswer((e.target as HTMLInputElement).value)}
                        className="w-full bg-white border-b-4 border-emerald-900 p-4 text-4xl font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                        placeholder="0"
                      />
                      <button 
                        onClick={(e) => {
                          const input = (e.currentTarget.previousSibling as HTMLInputElement);
                          handleAnswer(input.value);
                        }}
                        className="absolute right-0 bottom-4 p-2 bg-emerald-900 text-white rounded-lg"
                      >
                        <ChevronRight />
                      </button>
                    </div>
                  )}

                  {BATCH_1_QUESTIONS[currentQuestionIndex].type === 'text' && (
                    <div className="relative">
                      <input 
                        type="text"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleAnswer((e.target as HTMLInputElement).value)}
                        className="w-full bg-white border-b-4 border-emerald-900 p-4 text-2xl font-sans focus:outline-none focus:border-emerald-500 transition-colors"
                        placeholder="Type here..."
                      />
                      <button 
                        onClick={(e) => {
                          const input = (e.currentTarget.previousSibling as HTMLInputElement);
                          handleAnswer(input.value);
                        }}
                        className="absolute right-0 bottom-4 p-2 bg-emerald-900 text-white rounded-lg"
                      >
                        <ChevronRight />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            <div className="mt-12 h-2 bg-emerald-100 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-emerald-600"
                initial={{ width: 0 }}
                animate={{ width: `${((currentQuestionIndex + 1) / BATCH_1_QUESTIONS.length) * 100}%` }}
              />
            </div>
          </motion.div>
        )}

        {appState === 'DASHBOARD' && (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-6 max-w-5xl mx-auto space-y-12 pb-32"
          >
            {/* Hero Header */}
            <div className="relative overflow-hidden bg-emerald-950 rounded-[3rem] p-8 md:p-12 text-white shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 blur-[100px] -mr-32 -mt-32 rounded-full" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/10 blur-[80px] -ml-32 -mb-32 rounded-full" />
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                    <Activity className="w-3 h-3" />
                    Health Fortress Active
                  </div>
                  <h1 className="text-4xl md:text-5xl font-serif italic leading-tight">
                    Welcome back, <br/>
                    <span className="text-emerald-400">{user?.displayName || 'Mom'}</span>
                  </h1>
                  <p className="text-emerald-100/60 max-w-md text-lg">
                    Your metabolic markers are stable. Ready for your morning longevity routine?
                  </p>
                  
                  <div className="flex gap-4 pt-4">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-3xl">
                      <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Vitality Index</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black">88</span>
                        <span className="text-xs opacity-60">/100</span>
                      </div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-3xl">
                      <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Metabolic Age</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black">32</span>
                        <span className="text-xs opacity-60">yrs</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center md:items-end gap-6">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      {user ? (
                        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-2 pr-4 rounded-full border border-white/10">
                          <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-12 h-12 rounded-full border-2 border-emerald-400/30" referrerPolicy="no-referrer" />
                          <div className="hidden md:block text-left">
                            <p className="text-xs font-bold">{user.displayName}</p>
                            <button onClick={logOut} className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold uppercase tracking-widest">Sign Out</button>
                          </div>
                        </div>
                      ) : (
                        <button 
                          onClick={signIn}
                          className="px-8 py-3 bg-white text-emerald-950 rounded-full font-bold text-sm hover:bg-emerald-50 transition-all shadow-xl"
                        >
                          Sign In
                        </button>
                      )}
                    </div>
                    <button 
                      onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                      className={cn(
                        "p-4 rounded-full transition-all backdrop-blur-md border",
                        isAudioEnabled ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : "bg-white/5 border-white/10 text-white/40"
                      )}
                    >
                      {isAudioEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
                    </button>
                  </div>

                  {/* Circular Progress Ring for Daily Goal */}
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full -rotate-90">
                      <circle cx="64" cy="64" r="58" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                      <motion.circle 
                        cx="64" cy="64" r="58" fill="none" stroke="#10b981" strokeWidth="8" 
                        strokeDasharray="364.4"
                        initial={{ strokeDashoffset: 364.4 }}
                        animate={{ strokeDashoffset: 364.4 * (1 - 0.75) }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black">75%</span>
                      <span className="text-[8px] uppercase tracking-widest opacity-60">Daily Goal</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Goals Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Hydration', value: `${hydrationCount}/${hydrationGoal}`, icon: <Droplet className="w-4 h-4" />, color: 'text-blue-500', bg: 'bg-blue-50' },
                { label: 'Movement', value: '45/60 min', icon: <Activity className="w-4 h-4" />, color: 'text-orange-500', bg: 'bg-orange-50' },
                { label: 'Sleep', value: '7.5/8 hrs', icon: <Moon className="w-4 h-4" />, color: 'text-indigo-500', bg: 'bg-indigo-50' },
              ].map((goal, i) => (
                <div key={i} className="bg-white p-6 rounded-[2rem] border border-emerald-100 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-2xl", goal.bg, goal.color)}>
                      {goal.icon}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-emerald-800/40 uppercase tracking-widest">{goal.label}</p>
                      <p className="text-lg font-black text-emerald-950">{goal.value}</p>
                    </div>
                  </div>
                  <div className="w-12 h-1.5 bg-emerald-50 rounded-full overflow-hidden">
                    <div className={cn("h-full", goal.color.replace('text-', 'bg-'))} style={{ width: '70%' }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions / Used Features */}
            {recentFeatures.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-xl font-serif text-emerald-950">Recently Used</h2>
                  <button className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Clear History</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {recentFeatures.map(id => {
                    const feature = VITALITY_FEATURES.find(f => f.id === id);
                    if (!feature) return null;
                    return (
                      <motion.button
                        key={id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => launchFeature(id)}
                        className="bg-white p-6 rounded-[2.5rem] border border-emerald-100 shadow-sm hover:shadow-md transition-all text-left group"
                      >
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", feature.color)}>
                          {feature.icon}
                        </div>
                        <p className="font-bold text-emerald-950 text-sm">{feature.name}</p>
                      </motion.button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Main Bento Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Vitals Card */}
              <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-emerald-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-emerald-950">Bone Density Trends</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      step="0.1"
                      value={newTScore}
                      onChange={(e) => setNewTScore(e.target.value)}
                      placeholder="T-Score"
                      className="w-20 p-2 bg-emerald-50 border border-emerald-100 rounded-xl text-xs focus:outline-none"
                    />
                    <button 
                      onClick={() => {
                        if (!newTScore) return;
                        const date = new Date().toISOString().slice(0, 7);
                        setBoneDensityData([...boneDensityData, { date, tScore: parseFloat(newTScore) }]);
                        setNewTScore('');
                      }}
                      className="p-2 bg-emerald-900 text-white rounded-xl"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <BoneDensityChart data={boneDensityData} />
              </div>

              {/* Hydration Mini-Card */}
              <div className="bg-blue-600 rounded-[3rem] p-8 text-white shadow-xl flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16 rounded-full" />
                <div>
                  <div className="p-3 bg-white/20 rounded-2xl w-fit mb-6">
                    <Droplet className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-serif italic mb-2">Hydration</h3>
                  <p className="text-blue-100 text-sm opacity-80">Goal: {hydrationGoal} glasses</p>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-1">
                    {[...Array(hydrationGoal)].map((_, i) => (
                      <div key={i} className={cn("flex-1 h-1.5 rounded-full", i < hydrationCount ? "bg-white" : "bg-white/20")} />
                    ))}
                  </div>
                  <button 
                    onClick={() => setHydrationCount(prev => Math.min(prev + 1, hydrationGoal))}
                    className="w-full py-4 bg-white text-blue-600 rounded-2xl font-bold text-sm hover:bg-blue-50 transition-colors"
                  >
                    Log Glass
                  </button>
                </div>
              </div>
            </div>

            {/* Categorized Features */}
            {['AR Scanners', 'Food & Nutrition', 'Exercise & Fitness', 'Health Monitoring', 'AI Assistants'].map(category => (
              <section key={category} className="space-y-6">
                <div className="flex items-center gap-3 px-2">
                  <div className="w-1 h-6 bg-emerald-600 rounded-full" />
                  <h2 className="text-2xl font-serif text-emerald-950">{category}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {VITALITY_FEATURES.filter(f => f.category === category).map(feature => (
                    <motion.div 
                      key={feature.id}
                      whileHover={{ y: -5 }}
                      className="bg-white p-6 rounded-[2.5rem] border border-emerald-100 shadow-sm hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className={cn("p-4 rounded-2xl group-hover:scale-110 transition-transform", feature.color)}>
                          {feature.icon}
                        </div>
                        <div>
                          <h3 className="font-bold text-emerald-950">{feature.name}</h3>
                          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{category}</p>
                        </div>
                      </div>
                      <p className="text-sm text-emerald-800/60 mb-6 line-clamp-2">{feature.desc}</p>
                      <button 
                        onClick={() => launchFeature(feature.id)}
                        className={cn("w-full py-3 rounded-xl font-bold text-sm transition-colors", feature.color.replace('bg-', 'bg-opacity-20 bg-'))}
                      >
                        Launch Module
                      </button>
                    </motion.div>
                  ))}
                </div>
              </section>
            ))}

            {/* Hidden Gems / Explore All */}
            <section className="bg-zinc-50 rounded-[3rem] p-12 text-center border border-zinc-200">
              <div className="max-w-md mx-auto space-y-6">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto">
                  <Search className="w-8 h-8 text-zinc-400" />
                </div>
                <h2 className="text-3xl font-serif text-zinc-950">Explore Hidden Gems</h2>
                <p className="text-zinc-500">
                  Discover advanced metabolic tools, heritage recipe converters, and deep-focus architects hidden in our vault.
                </p>
                <button 
                  onClick={() => setAppState('FEATURE_HUB')}
                  className="px-8 py-4 bg-zinc-950 text-white rounded-full font-bold hover:bg-zinc-800 transition-all shadow-xl"
                >
                  Open Feature Vault
                </button>
              </div>
            </section>

            {/* Command Bar */}
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-md px-6 z-50">
              <div className="bg-emerald-950/90 backdrop-blur-xl p-2 rounded-full flex items-center gap-2 shadow-2xl border border-white/10">
                <div className="p-2 bg-emerald-800 rounded-full text-emerald-400">
                  <Zap className="w-5 h-5" />
                </div>
                <input 
                  type="text"
                  placeholder="Ask Architect (SCAN, YOGA, FAST...)"
                  className="flex-1 bg-transparent text-white px-4 py-2 focus:outline-none placeholder:text-emerald-400/30 text-sm"
                  value={lastInput}
                  onChange={(e) => setLastInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && lastInput.trim()) {
                      setAppState('GEMINI_CHAT');
                    }
                  }}
                />
                <button 
                  className="p-3 bg-emerald-600 text-white rounded-full hover:bg-emerald-500 transition-colors"
                  onClick={() => {
                    if (lastInput.trim()) setAppState('GEMINI_CHAT');
                  }}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
            {/* Vocal Stress Adjuster Notification */}
            {vocalStress === 'STRESSED' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-orange-50 border border-orange-200 p-4 rounded-2xl flex items-center gap-4"
              >
                <Wind className="w-6 h-6 text-orange-600" />
                <p className="text-sm text-orange-900">
                  <strong>Vocal Stress Detected:</strong> Swapping your workout to <strong>Pranayama (Breathwork)</strong> mode to lower cortisol.
                </p>
              </motion.div>
            )}

            {/* Hydration Reminder Toast */}
            <AnimatePresence>
              {showHydrationReminder && (
                <motion.div 
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 100 }}
                  className="fixed top-24 right-6 z-50 bg-blue-600 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 max-w-xs border border-white/20"
                >
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Wind className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase tracking-widest opacity-80">Hydration Reminder</p>
                    <p className="text-sm font-medium">Time for a glass of water! You've had {hydrationCount} of {hydrationGoal} today.</p>
                  </div>
                  <button onClick={() => setShowHydrationReminder(false)}>
                    <X className="w-4 h-4 opacity-60 hover:opacity-100" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Feature Overlays */}
        {appState === 'POSTURE_TEST' && (
          <FeatureOverlay 
            title="Posture Guard"
            icon={<Activity className="w-6 h-6" />}
            onClose={() => {
              setIsTestingPosture(false);
              setAppState('DASHBOARD');
            }}
            content={
              <div className="space-y-8">
                <div className="p-8 bg-white rounded-[3rem] border border-indigo-100 shadow-sm text-center">
                  {!isTestingPosture && !postureScore && (
                    <div className="space-y-6">
                      <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto">
                        <Activity className="w-12 h-12 text-indigo-600" />
                      </div>
                      <h3 className="text-2xl font-serif text-indigo-950">Stability & Fall Risk Assessment</h3>
                      <p className="text-sm text-indigo-800/70">
                        Stand on one leg and hold your phone against your chest. We'll use the accelerometer to measure your micro-stability.
                      </p>
                      <button 
                        onClick={startPostureTest}
                        className="w-full py-4 bg-indigo-900 text-white rounded-2xl font-bold shadow-xl hover:bg-indigo-800 transition-all"
                      >
                        Start 30s Test
                      </button>
                    </div>
                  )}

                  {isTestingPosture && (
                    <div className="space-y-8 py-12">
                      <div className="relative w-48 h-48 mx-auto">
                        <svg className="w-full h-full -rotate-90">
                          <circle 
                            cx="96" cy="96" r="88" 
                            fill="none" stroke="#e0e7ff" strokeWidth="8" 
                          />
                          <motion.circle 
                            cx="96" cy="96" r="88" 
                            fill="none" stroke="#4f46e5" strokeWidth="8" 
                            strokeDasharray="553"
                            initial={{ strokeDashoffset: 553 }}
                            animate={{ strokeDashoffset: 553 - (553 * (30 - postureTimer) / 30) }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-6xl font-black text-indigo-900">{postureTimer}</span>
                        </div>
                      </div>
                      <p className="text-indigo-600 font-bold animate-pulse uppercase tracking-widest text-xs">Stay Still. Rebuilding Balance.</p>
                    </div>
                  )}

                  {postureScore && !isTestingPosture && (
                    <div className="space-y-8">
                      <div className="w-32 h-32 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-500">
                        <span className="text-4xl font-black text-emerald-900">{postureScore}</span>
                      </div>
                      <div>
                        <h3 className="text-2xl font-serif text-emerald-950">Stability Score</h3>
                        <p className="text-sm text-emerald-800/70 mt-2">
                          {postureScore > 80 ? "Excellent stability. Your core and bone-supporting muscles are strong." : 
                           postureScore > 60 ? "Good stability. Consider adding 5 minutes of balance work daily." : 
                           "Stability alert. Focus on weight-bearing exercises to improve bone density and reduce fall risk."}
                        </p>
                      </div>
                      <button 
                        onClick={startPostureTest}
                        className="w-full py-4 bg-emerald-900 text-white rounded-2xl font-bold shadow-xl"
                      >
                        Retest Stability
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-white rounded-3xl border border-indigo-50">
                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">Sensor Frequency</p>
                    <p className="text-xl font-bold text-indigo-950">60Hz</p>
                  </div>
                  <div className="p-6 bg-white rounded-3xl border border-indigo-50">
                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">Axis Tracking</p>
                    <p className="text-xl font-bold text-indigo-950">X, Y, Z</p>
                  </div>
                </div>
              </div>
            }
          />
        )}

        {appState === 'METABOLIC_WALK' && (
          <FeatureOverlay 
            title="Metabolic Walk"
            icon={<MapPin className="w-6 h-6" />}
            onClose={() => {
              stopWalk();
              setAppState('DASHBOARD');
            }}
            content={
              <div className="space-y-8">
                <div className="p-8 bg-white rounded-[3rem] border border-emerald-100 shadow-sm overflow-hidden relative">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                        <Timer className="w-5 h-5" />
                      </div>
                      <p className="font-bold text-emerald-950">Live Tracker</p>
                    </div>
                    {isWalking && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                        <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Recording</span>
                      </div>
                    )}
                  </div>

                  {isWalking && (
                    <div className={cn(
                      "mb-8 p-4 rounded-2xl flex items-center justify-between transition-colors",
                      walkIntervalMode === 'FAST' ? "bg-orange-100 text-orange-700" : 
                      walkIntervalMode === 'SLOW' ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                    )}>
                      <div className="flex items-center gap-3">
                        {walkIntervalMode === 'FAST' ? <Zap className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                        <span className="font-bold uppercase tracking-widest text-xs">
                          {walkIntervalMode === 'FAST' ? 'Power Phase' : 
                           walkIntervalMode === 'SLOW' ? 'Recovery Phase' : 'Warm Up'}
                        </span>
                      </div>
                      <span className="font-mono font-bold">{Math.floor(walkIntervalTimer / 60)}:{(walkIntervalTimer % 60).toString().padStart(2, '0')}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-8 mb-12">
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Distance</p>
                      <p className="text-4xl font-black text-emerald-950">{(walkStats.distance / 1000).toFixed(2)}<span className="text-sm ml-1">km</span></p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Speed</p>
                      <p className="text-4xl font-black text-emerald-950">{(walkStats.speed * 3.6).toFixed(1)}<span className="text-sm ml-1">km/h</span></p>
                    </div>
                  </div>

                  {!isWalking ? (
                    <div className="space-y-4">
                      <button 
                        onClick={startWalk}
                        className="w-full py-6 bg-emerald-900 text-white rounded-[2rem] font-bold shadow-2xl flex items-center justify-center gap-3 hover:bg-emerald-800 transition-all"
                      >
                        <Zap className="w-6 h-6 fill-emerald-400 text-emerald-400" />
                        Start Metabolic Walk
                      </button>
                      {walkMetabolicImpact && (
                        <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                          <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">Last Walk Impact</p>
                          <p className="text-sm text-emerald-900 leading-relaxed italic">"{walkMetabolicImpact}"</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button 
                      onClick={stopWalk}
                      className="w-full py-6 bg-red-900 text-white rounded-[2rem] font-bold shadow-2xl flex items-center justify-center gap-3 hover:bg-red-800 transition-all"
                    >
                      <X className="w-6 h-6" />
                      Stop & Log Session
                    </button>
                  )}
                </div>

                <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                  <div className="flex items-center gap-3 mb-4">
                    <Info className="w-5 h-5 text-emerald-600" />
                    <p className="font-bold text-emerald-900">Why this matters?</p>
                  </div>
                  <p className="text-sm text-emerald-800/70 leading-relaxed">
                    Walking at varying speeds (Metabolic Interval Walking) triggers higher glucose disposal and stimulates bone-building osteoblasts more effectively than a steady pace.
                  </p>
                </div>
              </div>
            }
          />
        )}

        {appState === 'STRESS_AUDIT' && (
          <FeatureOverlay 
            title="Stress Audit"
            icon={<Brain className="w-6 h-6" />}
            onClose={() => setAppState('DASHBOARD')}
            content={
              <div className="space-y-8">
                <div className="p-8 bg-white rounded-[3rem] border border-orange-100 shadow-sm text-center">
                  {!stressAuditResult && !isAuditingStress && (
                    <div className="space-y-6">
                      <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mx-auto">
                        <Mic className="w-12 h-12 text-orange-600" />
                      </div>
                      <h3 className="text-2xl font-serif text-orange-950">Vocal Stress Analysis</h3>
                      <p className="text-sm text-orange-800/70">
                        How are you feeling right now? Speak or type your thoughts. We'll analyze your tone and markers for cortisol spikes.
                      </p>
                      <div className="relative">
                        <textarea 
                          className="w-full p-4 bg-orange-50 border border-orange-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[120px]"
                          placeholder="I've been feeling a bit overwhelmed lately..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              auditStress((e.target as HTMLTextAreaElement).value);
                            }
                          }}
                        />
                        <button 
                          onClick={(e) => {
                            const textarea = e.currentTarget.previousSibling as HTMLTextAreaElement;
                            auditStress(textarea.value);
                          }}
                          className="absolute bottom-4 right-4 p-2 bg-orange-600 text-white rounded-xl"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {isAuditingStress && (
                    <div className="py-12 space-y-6">
                      <div className="flex items-center justify-center gap-2">
                        {[1, 2, 3, 4, 5].map(i => (
                          <motion.div 
                            key={i}
                            animate={{ height: [10, 40, 10] }}
                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                            className="w-1 bg-orange-400 rounded-full"
                          />
                        ))}
                      </div>
                      <p className="text-orange-600 font-bold animate-pulse uppercase tracking-widest text-xs">Analyzing Biometric Markers...</p>
                    </div>
                  )}

                  {stressAuditResult && !isAuditingStress && (
                    <div className="space-y-8">
                      <div className={cn(
                        "w-32 h-32 rounded-full flex items-center justify-center mx-auto border-4",
                        stressAuditResult.level === 'LOW' ? "bg-emerald-50 border-emerald-500" : 
                        stressAuditResult.level === 'MODERATE' ? "bg-orange-50 border-orange-500" : "bg-red-50 border-red-500"
                      )}>
                        <span className="text-4xl font-black text-zinc-900">{stressAuditResult.score}</span>
                      </div>
                      <div>
                        <h3 className="text-2xl font-serif text-zinc-950">{stressAuditResult.level} Stress Detected</h3>
                        <p className="text-sm text-zinc-800/70 mt-4 leading-relaxed">
                          {stressAuditResult.analysis}
                        </p>
                        <div className="mt-6 p-6 bg-zinc-50 rounded-3xl border border-zinc-100 text-left">
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Recommendation</p>
                          <p className="text-sm font-medium text-zinc-900">{stressAuditResult.recommendation}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setStressAuditResult(null)}
                        className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold shadow-xl"
                      >
                        New Audit
                      </button>
                    </div>
                  )}
                </div>
              </div>
            }
          />
        )}

        {/* Feature Hub */}
        {appState === 'FEATURE_HUB' && (
          <FeatureOverlay 
            title="Maternal Feature Hub" 
            icon={<LayoutGrid className="w-6 h-6 text-emerald-600" />} 
            onClose={() => setAppState('DASHBOARD')}
            content={
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {MATERNAL_FEATURES.map(feature => (
                    <button 
                      key={feature.id}
                      onClick={() => setAppState(feature.id as AppState)}
                      className={cn(
                        "p-6 rounded-[2rem] border border-emerald-100 text-left group transition-all hover:shadow-lg",
                        feature.color
                      )}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-3 bg-white/50 rounded-2xl group-hover:scale-110 transition-transform">
                          {feature.icon}
                        </div>
                        <ChevronRight className="w-5 h-5 opacity-30 group-hover:translate-x-1 transition-transform" />
                      </div>
                      <h4 className="font-bold text-lg mb-1">{feature.name}</h4>
                      <p className="text-xs opacity-70 leading-relaxed">{feature.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            }
          />
        )}

        {/* 11. Focus Flow */}
        {appState === 'FOCUS_FLOW' && (
          <FeatureOverlay 
            title="Focus Flow" 
            icon={<Timer className="w-6 h-6 text-orange-600" />} 
            onClose={() => setAppState('DASHBOARD')}
            content={
              <div className="space-y-6">
                <div className="p-12 bg-orange-900 text-white rounded-[3rem] text-center relative overflow-hidden">
                  <Timer className="absolute -right-4 -top-4 w-32 h-32 opacity-10" />
                  <p className="text-[10px] font-bold text-orange-300 uppercase tracking-widest mb-4">Deep Work Timer</p>
                  <h3 className="text-4xl font-serif italic mb-8">00:00:00</h3>
                  <button className="w-32 h-32 bg-orange-400 text-orange-950 rounded-full font-bold text-xl shadow-2xl hover:scale-105 active:scale-95 transition-all">
                    START
                  </button>
                </div>
                <div className="space-y-3">
                  <h4 className="font-bold text-orange-950 text-xs uppercase tracking-widest">Recent Sessions</h4>
                  <p className="text-xs text-orange-800/40 italic">No focus sessions logged yet.</p>
                </div>
              </div>
            }
          />
        )}

        {/* 12. Nutri Flow */}
        {appState === 'NUTRI_FLOW' && (
          <FeatureOverlay 
            title="Nutri Flow" 
            icon={<Utensils className="w-6 h-6 text-sky-600" />} 
            onClose={() => setAppState('DASHBOARD')}
            content={
              <div className="space-y-6">
                <div className="p-8 bg-sky-50 rounded-[3rem] border border-sky-100">
                  <h3 className="text-xl font-serif text-sky-950 mb-6">Log Nutrition</h3>
                  <div className="flex gap-4 mb-8">
                    <button className="flex-1 py-4 bg-white border border-sky-200 rounded-2xl font-bold text-sky-900 hover:bg-sky-100 transition-colors">Meal</button>
                    <button className="flex-1 py-4 bg-white border border-sky-200 rounded-2xl font-bold text-sky-900 hover:bg-sky-100 transition-colors">Hydration</button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <button className="p-4 bg-white border border-sky-100 rounded-2xl text-xs font-bold text-sky-900">Protein</button>
                    <button className="p-4 bg-white border border-sky-100 rounded-2xl text-xs font-bold text-sky-900">Fiber</button>
                  </div>
                  <button className="w-full py-4 bg-sky-600 text-white rounded-2xl font-bold shadow-lg">Log Intake</button>
                </div>
              </div>
            }
          />
        )}

        {/* 13. Habit Hub */}
        {appState === 'HABIT_HUB' && (
          <FeatureOverlay 
            title="Habit Hub" 
            icon={<LayoutGrid className="w-6 h-6 text-lime-600" />} 
            onClose={() => setAppState('DASHBOARD')}
            content={
              <div className="space-y-6">
                <div className="p-8 bg-lime-50 rounded-[3rem] border border-lime-100">
                  <h3 className="text-xl font-serif text-lime-950 mb-6">Habit Tracker</h3>
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    {['Morning', 'Afternoon', 'Evening'].map(t => (
                      <button key={t} className="p-4 bg-white border border-lime-200 rounded-2xl text-xs font-bold text-lime-900 hover:bg-lime-100 transition-colors">
                        {t}
                      </button>
                    ))}
                  </div>
                  <button className="w-full py-4 bg-lime-600 text-white rounded-2xl font-bold shadow-lg">Log Habit</button>
                </div>
              </div>
            }
          />
        )}

        {/* 14. Recovery Roadmap */}
        {appState === 'RECOVERY_ROADMAP' && (
          <FeatureOverlay 
            title="Recovery Roadmap" 
            icon={<Map className="w-6 h-6 text-violet-600" />} 
            onClose={() => setAppState('DASHBOARD')}
            content={
              <div className="space-y-6">
                <div className="p-8 bg-violet-50 rounded-[3rem] border border-violet-100">
                  <h3 className="text-xl font-serif text-violet-950 mb-6">Postpartum Healing</h3>
                  <div className="space-y-4">
                    {recoveryTasks.map(task => (
                      <button 
                        key={task.id}
                        onClick={() => setRecoveryTasks(recoveryTasks.map(t => t.id === task.id ? { ...t, done: !t.done } : t))}
                        className="w-full p-5 bg-white rounded-2xl border border-violet-100 flex items-center gap-4 text-left group"
                      >
                        <div className={cn(
                          "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors",
                          task.done ? "bg-violet-600 border-violet-600" : "border-violet-200 group-hover:border-violet-400"
                        )}>
                          {task.done && <CheckCircle2 className="w-4 h-4 text-white" />}
                        </div>
                        <span className={cn(
                          "font-medium transition-all",
                          task.done ? "text-violet-400 line-through" : "text-violet-900"
                        )}>
                          {task.text}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            }
          />
        )}

        {/* 15. Vitality Circle */}
        {appState === 'VITALITY_CIRCLE' && (
          <FeatureOverlay 
            title="Vitality Circle" 
            icon={<Users className="w-6 h-6 text-fuchsia-600" />} 
            onClose={() => setAppState('DASHBOARD')}
            content={
              <div className="space-y-6">
                <div className="p-8 bg-fuchsia-50 rounded-[3rem] border border-fuchsia-100">
                  <h3 className="text-xl font-serif text-fuchsia-950 mb-6">Community Support</h3>
                  <div className="space-y-4">
                    {[
                      { user: 'Sarah M.', text: 'Anyone else dealing with sleep regression at 4 months?', time: '2m ago' },
                      { user: 'Elena R.', text: 'Found a great recipe for iron-rich snacks!', time: '15m ago' },
                      { user: 'Jessica K.', text: 'The Core Power sessions are really helping.', time: '1h ago' },
                    ].map((post, i) => (
                      <div key={i} className="p-5 bg-white rounded-3xl border border-fuchsia-100 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-fuchsia-900 text-sm">{post.user}</span>
                          <span className="text-[10px] text-fuchsia-400 font-mono">{post.time}</span>
                        </div>
                        <p className="text-sm text-fuchsia-800/70 leading-relaxed">{post.text}</p>
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-8 py-4 bg-fuchsia-900 text-white rounded-2xl font-bold shadow-lg">Join the Conversation</button>
                </div>
              </div>
            }
          />
        )}

        {/* 6. Longevity Blueprint */}
        {appState === 'LONGEVITY_BLUEPRINT' && (
          <FeatureOverlay 
            title="Longevity Blueprint" 
            icon={<FileText className="w-6 h-6 text-blue-600" />} 
            onClose={() => setAppState('DASHBOARD')}
            content={
              <div className="space-y-6">
                <div className="p-8 bg-blue-50 rounded-[3rem] border border-blue-100">
                  <h3 className="text-xl font-serif text-blue-950 mb-6">Your Longevity Architecture</h3>
                  <div className="space-y-4">
                    {Object.entries(birthPlan).map(([key, value]) => (
                      <div key={key} className="p-4 bg-white rounded-2xl border border-blue-100">
                        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">{key.replace(/([A-Z])/g, ' $1')}</p>
                        <p className="font-bold text-blue-900">{value}</p>
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-8 py-4 bg-blue-900 text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" />
                    Export to PDF / Provider
                  </button>
                </div>
              </div>
            }
          />
        )}

        {/* 7. Vital Vibe */}
        {appState === 'VITAL_VIBE' && (
          <FeatureOverlay 
            title="Vital Vibe" 
            icon={<Heart className="w-6 h-6 text-purple-600" />} 
            onClose={() => setAppState('DASHBOARD')}
            content={
              <div className="space-y-6">
                <div className="p-12 bg-purple-900 text-white rounded-[3rem] text-center relative overflow-hidden">
                  <Heart className="absolute -right-4 -top-4 w-32 h-32 opacity-10" />
                  <p className="text-[10px] font-bold text-purple-300 uppercase tracking-widest mb-4">Heart Rhythm</p>
                  <h3 className="text-5xl font-serif italic mb-8">{kickCount} BPM</h3>
                  <button 
                    onClick={() => setKickCount(prev => prev + 1)}
                    className="w-32 h-32 bg-purple-400 text-purple-950 rounded-full font-bold text-xl shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
                  >
                    BEAT
                  </button>
                </div>
                <div className="p-6 bg-white border border-purple-100 rounded-3xl flex items-center justify-between">
                  <div>
                    <p className="text-xs text-purple-800/60">Session Duration</p>
                    <p className="font-bold text-purple-950">14m 22s</p>
                  </div>
                  <button onClick={() => setKickCount(0)} className="text-xs text-purple-400 underline">Reset Session</button>
                </div>
              </div>
            }
          />
        )}

        {/* 8. Weight Wisdom */}
        {appState === 'WEIGHT_WISDOM' && (
          <FeatureOverlay 
            title="Weight Wisdom" 
            icon={<Scale className="w-6 h-6 text-emerald-600" />} 
            onClose={() => setAppState('DASHBOARD')}
            content={
              <div className="space-y-6">
                <div className="p-8 bg-white rounded-[3rem] border border-emerald-100 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-serif text-emerald-950">Weight Trajectory</h3>
                    <button className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="h-48 w-full bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-center italic text-emerald-800/40 text-sm">
                    [Precision Weight Graph Rendering...]
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Current</p>
                      <p className="text-xl font-bold text-emerald-950">68.4 kg</p>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Total Gain</p>
                      <p className="text-xl font-bold text-emerald-950">+8.2 kg</p>
                    </div>
                  </div>
                </div>
              </div>
            }
          />
        )}

        {/* 9. Pressure Point */}
        {appState === 'PRESSURE_POINT' && (
          <FeatureOverlay 
            title="Pressure Point" 
            icon={<Activity className="w-6 h-6 text-rose-600" />} 
            onClose={() => setAppState('DASHBOARD')}
            content={
              <div className="space-y-6">
                <div className="p-8 bg-rose-50 rounded-[3rem] border border-rose-100">
                  <h3 className="text-xl font-serif text-rose-950 mb-6">Blood Pressure Log</h3>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-rose-400 uppercase mb-2">Systolic</p>
                      <input type="number" placeholder="120" className="w-full p-4 bg-white border border-rose-100 rounded-2xl text-xl font-bold focus:outline-none focus:ring-2 focus:ring-rose-500" />
                    </div>
                    <div className="text-2xl font-bold text-rose-300 mt-6">/</div>
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-rose-400 uppercase mb-2">Diastolic</p>
                      <input type="number" placeholder="80" className="w-full p-4 bg-white border border-rose-100 rounded-2xl text-xl font-bold focus:outline-none focus:ring-2 focus:ring-rose-500" />
                    </div>
                  </div>
                  <button className="w-full py-4 bg-rose-600 text-white rounded-2xl font-bold shadow-lg">Log Reading</button>
                </div>
                <div className="space-y-3">
                  <h4 className="font-bold text-rose-950 text-xs uppercase tracking-widest">Recent Trends</h4>
                  <div className="p-4 bg-white rounded-2xl border border-rose-100 flex items-center justify-between">
                    <span className="font-bold text-rose-900">118 / 76</span>
                    <span className="text-[10px] text-rose-400 font-mono">Yesterday, 09:15</span>
                  </div>
                </div>
              </div>
            }
          />
        )}

        {/* 10. Glucose Guard */}
        {appState === 'GLUCOSE_GUARD' && (
          <FeatureOverlay 
            title="Glucose Guard" 
            icon={<Droplet className="w-6 h-6 text-cyan-600" />} 
            onClose={() => setAppState('DASHBOARD')}
            content={
              <div className="space-y-6">
                <div className="p-8 bg-cyan-50 rounded-[3rem] border border-cyan-100">
                  <h3 className="text-xl font-serif text-cyan-950 mb-6">Blood Sugar Monitor</h3>
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    {['Fasting', 'Post-Breakfast', 'Post-Lunch', 'Post-Dinner'].map(t => (
                      <button key={t} className="p-4 bg-white border border-cyan-100 rounded-2xl text-xs font-bold text-cyan-900 hover:bg-cyan-100 transition-colors">
                        {t}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 mb-8">
                    <input type="number" placeholder="95" className="flex-1 p-4 bg-white border border-cyan-100 rounded-2xl text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                    <span className="font-bold text-cyan-600">mg/dL</span>
                  </div>
                  <button className="w-full py-4 bg-cyan-600 text-white rounded-2xl font-bold shadow-lg">Log Glucose</button>
                </div>
              </div>
            }
          />
        )}

        {/* 1. Sleep Architect */}
        {appState === 'SLEEP_ARCHITECT' && (
          <FeatureOverlay 
            title="Sleep Architect" 
            icon={<Moon className="w-6 h-6 text-indigo-600" />} 
            onClose={() => setAppState('DASHBOARD')}
            content={
              <div className="space-y-6">
                <div className="p-8 bg-indigo-900 text-white rounded-[3rem] shadow-xl relative overflow-hidden">
                  <Moon className="absolute -right-4 -top-4 w-32 h-32 opacity-10" />
                  <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-2">Circadian Sync</p>
                  <h3 className="text-3xl font-serif italic mb-4">Optimal Sleep Window</h3>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-4 bg-white/10 rounded-2xl text-center flex-1">
                      <p className="text-[10px] uppercase opacity-60 mb-1">Wind Down</p>
                      <p className="text-xl font-bold">21:30</p>
                    </div>
                    <div className="p-4 bg-white/10 rounded-2xl text-center flex-1">
                      <p className="text-[10px] uppercase opacity-60 mb-1">Sleep Goal</p>
                      <p className="text-xl font-bold">8.5h</p>
                    </div>
                  </div>
                  <p className="text-sm text-indigo-100/80 leading-relaxed">
                    Based on your metabolic profile, your cortisol peak is at 07:15. Aim for 8.5 hours to maximize bone remodeling.
                  </p>
                </div>
                <div className="space-y-4">
                  <h4 className="font-bold text-emerald-950">AI Sleep Hygiene Tasks:</h4>
                  {[
                    "Blue light block at 20:30",
                    "Magnesium glycinate at 21:00",
                    "Cool room to 18°C",
                    "Nasal breathing practice"
                  ].map((task, i) => (
                    <div key={i} className="p-4 bg-white border border-indigo-100 rounded-2xl flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full border-2 border-indigo-200" />
                      <span className="text-sm text-indigo-900 font-medium">{task}</span>
                    </div>
                  ))}
                </div>
              </div>
            }
          />
        )}

        {/* 2. Mood Harmony */}
        {appState === 'MOOD_HARMONY' && (
          <FeatureOverlay 
            title="Mood Harmony" 
            icon={<Smile className="w-6 h-6 text-pink-600" />} 
            onClose={() => setAppState('DASHBOARD')}
            content={
              <div className="space-y-6">
                <div className="p-8 bg-pink-50 rounded-[3rem] border border-pink-100 text-center">
                  <h3 className="text-2xl font-serif text-pink-950 mb-4">How are you feeling, Mom?</h3>
                  <div className="flex justify-center gap-4 mb-8">
                    {['😔', '😐', '😊', '✨', '🔥'].map((emoji, i) => (
                      <button 
                        key={i}
                        onClick={() => setMoodLogs([{ mood: emoji, note: '', time: Date.now() }, ...moodLogs])}
                        className="w-12 h-12 bg-white rounded-2xl shadow-sm hover:scale-110 transition-transform text-2xl flex items-center justify-center border border-pink-100"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-4 text-left">
                    <h4 className="font-bold text-pink-950 text-sm uppercase tracking-widest">Recent Reflections</h4>
                    {moodLogs.length === 0 ? (
                      <p className="text-xs text-pink-800/40 italic">No logs yet today.</p>
                    ) : (
                      moodLogs.map((log, i) => (
                        <div key={i} className="p-4 bg-white rounded-2xl border border-pink-100 flex items-center justify-between">
                          <span className="text-2xl">{log.mood}</span>
                          <span className="text-[10px] text-pink-400 font-mono">{new Date(log.time).toLocaleTimeString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            }
          />
        )}

        {/* 3. Core Power */}
        {appState === 'CORE_POWER' && (
          <FeatureOverlay 
            title="Core Power" 
            icon={<Anchor className="w-6 h-6 text-teal-600" />} 
            onClose={() => setAppState('DASHBOARD')}
            content={
              <div className="space-y-6">
                <div className="p-12 bg-teal-900 text-white rounded-[3rem] text-center relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center opacity-10">
                    <div className="w-48 h-48 border-8 border-white rounded-full animate-ping" />
                  </div>
                  <p className="text-[10px] font-bold text-teal-300 uppercase tracking-widest mb-4">Guided Session</p>
                  <h3 className="text-4xl font-serif italic mb-8">Hold for 5s</h3>
                  <button className="w-24 h-24 bg-teal-400 text-teal-950 rounded-full font-bold text-lg shadow-xl hover:scale-105 transition-transform">
                    START
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-teal-50 rounded-3xl border border-teal-100 text-center">
                    <p className="text-[10px] font-bold text-teal-600 uppercase mb-1">Today's Reps</p>
                    <p className="text-2xl font-bold text-teal-950">12 / 30</p>
                  </div>
                  <div className="p-6 bg-teal-50 rounded-3xl border border-teal-100 text-center">
                    <p className="text-[10px] font-bold text-teal-600 uppercase mb-1">Streak</p>
                    <p className="text-2xl font-bold text-teal-950">4 Days</p>
                  </div>
                </div>
              </div>
            }
          />
        )}

        {/* 4. Vitality Vault */}
        {appState === 'VITALITY_VAULT' && (
          <FeatureOverlay 
            title="Vitality Vault" 
            icon={<Pill className="w-6 h-6 text-amber-600" />} 
            onClose={() => setAppState('DASHBOARD')}
            content={
              <div className="space-y-6">
                <div className="space-y-4">
                  {[
                    { name: 'Prenatal Multi', time: '08:00', dose: '1 Capsule', taken: true },
                    { name: 'Omega-3 DHA', time: '08:00', dose: '2 Softgels', taken: true },
                    { name: 'Calcium + D3', time: '12:00', dose: '1 Tablet', taken: false },
                    { name: 'Iron (Gentle)', time: '18:00', dose: '1 Capsule', taken: false },
                  ].map((pill, i) => (
                    <div key={i} className={cn(
                      "p-5 rounded-3xl border transition-all flex items-center justify-between",
                      pill.taken ? "bg-emerald-50 border-emerald-100" : "bg-white border-amber-100"
                    )}>
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-3 rounded-xl",
                          pill.taken ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                        )}>
                          <Pill className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-emerald-950">{pill.name}</p>
                          <p className="text-[10px] text-emerald-800/60 font-mono uppercase">{pill.time} | {pill.dose}</p>
                        </div>
                      </div>
                      {pill.taken ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                      ) : (
                        <button className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold shadow-sm">LOG</button>
                      )}
                    </div>
                  ))}
                </div>
                <button className="w-full py-4 bg-amber-50 text-amber-700 rounded-2xl font-bold border border-amber-100 flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Supplement
                </button>
              </div>
            }
          />
        )}

        {/* 5. Symptom Sentinel */}
        {appState === 'SYMPTOM_SENTINEL' && (
          <FeatureOverlay 
            title="Symptom Sentinel" 
            icon={<Stethoscope className="w-6 h-6 text-red-600" />} 
            onClose={() => setAppState('DASHBOARD')}
            content={
              <div className="space-y-6">
                <div className="p-8 bg-red-50 rounded-[3rem] border border-red-100">
                  <h3 className="text-xl font-serif text-red-950 mb-4">Log New Symptom</h3>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {['Nausea', 'Swelling', 'Headache', 'Back Pain', 'Fatigue', 'Dizziness'].map(s => (
                      <button 
                        key={s}
                        onClick={() => setSelectedSymptom(s)}
                        className={cn(
                          "p-3 border rounded-2xl text-xs font-bold transition-all",
                          selectedSymptom === s 
                            ? "bg-red-600 border-red-600 text-white shadow-lg scale-105" 
                            : "bg-white border-red-100 text-red-900 hover:bg-red-100"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  {selectedSymptom && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 p-6 bg-white rounded-3xl border border-red-100 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-red-950 text-sm">Severity: {symptomSeverity}</h4>
                        <div className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                          symptomSeverity <= 3 ? "bg-emerald-100 text-emerald-600" :
                          symptomSeverity <= 7 ? "bg-orange-100 text-orange-600" : "bg-red-100 text-red-600"
                        )}>
                          {symptomSeverity <= 3 ? 'Mild' : symptomSeverity <= 7 ? 'Moderate' : 'Severe'}
                        </div>
                      </div>
                      <input 
                        type="range" min="1" max="10" 
                        value={symptomSeverity}
                        onChange={(e) => setSymptomSeverity(parseInt(e.target.value))}
                        className="w-full h-2 bg-red-100 rounded-lg appearance-none cursor-pointer accent-red-600 mb-6"
                      />
                      <button 
                        onClick={() => {
                          setSymptomLogs([{ symptom: selectedSymptom, severity: symptomSeverity, time: Date.now() }, ...symptomLogs]);
                          playSuccessSound();
                          speakText(`Logged ${selectedSymptom} with severity ${symptomSeverity}.`);
                          setSelectedSymptom(null);
                          setSymptomSeverity(5);
                        }}
                        className="w-full py-3 bg-red-900 text-white rounded-xl font-bold hover:bg-red-800 transition-colors"
                      >
                        Confirm Log
                      </button>
                    </motion.div>
                  )}

                  <div className="space-y-3">
                    <h4 className="font-bold text-red-950 text-xs uppercase tracking-widest">Recent Logs</h4>
                    {symptomLogs.map((log, i) => (
                      <div key={i} className="p-4 bg-white rounded-2xl border border-red-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-3 h-3 rounded-full",
                            log.severity <= 3 ? "bg-emerald-400" :
                            log.severity <= 7 ? "bg-orange-400" : "bg-red-400"
                          )} />
                          <div>
                            <p className="text-sm font-bold text-red-900">{log.symptom}</p>
                            <p className="text-[10px] text-red-400 font-medium">Severity: {log.severity}</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-red-400 font-mono">{new Date(log.time).toLocaleTimeString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-6 bg-emerald-900 text-white rounded-3xl flex items-start gap-4">
                  <Shield className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <p className="font-bold text-sm">AI Triage Active</p>
                    <p className="text-xs text-emerald-100/70">No high-risk markers detected in your recent logs. Continue monitoring.</p>
                  </div>
                </div>
              </div>
            }
          />
        )}

        {appState === 'HYDRATION_HUB' && (
          <FeatureOverlay 
            title="Hydration Hub"
            icon={<Droplet className="w-6 h-6 text-blue-600" />}
            onClose={() => setAppState('DASHBOARD')}
            content={
              <div className="space-y-8">
                <div className="p-8 bg-white rounded-[3rem] border border-blue-100 shadow-sm text-center">
                  <div className="relative w-48 h-48 mx-auto mb-8">
                    <svg className="w-full h-full -rotate-90">
                      <circle 
                        cx="96" cy="96" r="88" 
                        fill="none" stroke="#eff6ff" strokeWidth="12" 
                      />
                      <motion.circle 
                        cx="96" cy="96" r="88" 
                        fill="none" stroke="#3b82f6" strokeWidth="12" 
                        strokeDasharray="553"
                        initial={{ strokeDashoffset: 553 }}
                        animate={{ strokeDashoffset: 553 - (553 * Math.min(hydrationCount, hydrationGoal) / hydrationGoal) }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-black text-blue-900">{hydrationCount}</span>
                      <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">of {hydrationGoal}ml</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-8">
                    {[250, 500, 750].map(amount => (
                      <button 
                        key={amount}
                        onClick={() => {
                          setHydrationCount(prev => prev + amount);
                          setHydrationLogs([{ amount, time: Date.now() }, ...hydrationLogs]);
                          playSuccessSound();
                          speakText(`Added ${amount} milliliters of water.`);
                        }}
                        className="p-4 bg-blue-50 text-blue-600 rounded-2xl font-bold text-sm hover:bg-blue-100 transition-all active:scale-95"
                      >
                        +{amount}ml
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 mb-8 p-4 bg-blue-50/50 rounded-2xl">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Set Goal:</span>
                    <input 
                      type="range" min="1000" max="5000" step="250"
                      value={hydrationGoal}
                      onChange={(e) => setHydrationGoal(parseInt(e.target.value))}
                      className="flex-1 h-1.5 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <span className="text-xs font-bold text-blue-900">{hydrationGoal}ml</span>
                  </div>

                  {!hydrationStrategy && !isCalculatingHydration && (
                    <button 
                      onClick={calculateHydrationStrategy}
                      className="w-full py-4 bg-blue-900 text-white rounded-2xl font-bold shadow-xl flex items-center justify-center gap-2"
                    >
                      <Zap className="w-4 h-4" />
                      Generate AI Strategy
                    </button>
                  )}

                  {isCalculatingHydration && (
                    <div className="py-4 flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-blue-600 font-bold text-sm">Calculating Needs...</p>
                    </div>
                  )}

                  {hydrationStrategy && (
                    <div className="mt-8 p-6 bg-blue-50 rounded-3xl border border-blue-100 text-left">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">AI Strategy</p>
                        <button onClick={() => setHydrationStrategy(null)} className="text-[10px] text-blue-400 underline">Reset</button>
                      </div>
                      <div className="text-sm text-blue-900 leading-relaxed whitespace-pre-wrap italic">
                        {hydrationStrategy}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-emerald-950 uppercase tracking-widest">Hydration History</h4>
                  <div className="space-y-2">
                    {hydrationLogs.slice(0, 5).map((log, i) => (
                      <div key={i} className="p-4 bg-white rounded-2xl border border-blue-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Droplet className="w-4 h-4 text-blue-400" />
                          <span className="text-sm font-bold text-blue-900">{log.amount}ml</span>
                        </div>
                        <span className="text-[10px] text-blue-400 font-mono">{new Date(log.time).toLocaleTimeString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            }
          />
        )}

        {appState === 'YOGA' && (
          <FeatureOverlay 
            title="Yoga Studio"
            icon={<Zap className="w-6 h-6 text-purple-600" />}
            onClose={() => setAppState('DASHBOARD')}
            content={
              <div className="space-y-8">
                {!yogaRoutine && !isGeneratingYoga && (
                  <div className="p-8 bg-white rounded-[3rem] border border-purple-100 shadow-sm text-center space-y-6">
                    <div className="w-24 h-24 bg-purple-50 rounded-full flex items-center justify-center mx-auto">
                      <Zap className="w-12 h-12 text-purple-600" />
                    </div>
                    <h3 className="text-2xl font-serif text-purple-950">Personalized Yoga Architect</h3>
                    <p className="text-sm text-purple-800/70 leading-relaxed">
                      We'll design a routine specifically for your bone density profile and current stress levels.
                    </p>
                    <button 
                      onClick={generateYogaRoutine}
                      className="w-full py-4 bg-purple-900 text-white rounded-2xl font-bold shadow-xl"
                    >
                      Generate My Routine
                    </button>
                  </div>
                )}

                {isGeneratingYoga && (
                  <div className="p-8 bg-white rounded-[3rem] border border-purple-100 shadow-sm text-center py-20 space-y-6">
                    <div className="w-16 h-16 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin mx-auto" />
                    <p className="text-purple-600 font-bold animate-pulse">Architecting Flow...</p>
                  </div>
                )}

                {yogaRoutine && (
                  <div className="space-y-6">
                    <div className="p-8 bg-purple-900 text-white rounded-[3rem] shadow-xl">
                      <p className="text-[10px] font-bold text-purple-300 uppercase tracking-widest mb-2">Today's Practice</p>
                      <h3 className="text-3xl font-serif italic mb-2">{yogaRoutine.title}</h3>
                      <p className="text-sm text-purple-100/80">{yogaRoutine.focus}</p>
                    </div>

                    <div className="space-y-4">
                      {yogaRoutine.poses.map((pose, i) => (
                        <div key={i} className="p-6 bg-white rounded-3xl border border-purple-100 shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold text-purple-950 text-lg">{pose.name}</h4>
                            <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-xs font-bold">{pose.duration}</span>
                          </div>
                          <p className="text-xs text-purple-600 font-bold uppercase tracking-widest mb-2">Benefit: {pose.benefit}</p>
                          <p className="text-sm text-purple-800/70 leading-relaxed">{pose.instructions}</p>
                        </div>
                      ))}
                    </div>

                    <button 
                      onClick={() => setYogaRoutine(null)}
                      className="w-full py-4 bg-purple-50 text-purple-600 rounded-2xl font-bold border border-purple-100"
                    >
                      Generate New Flow
                    </button>
                  </div>
                )}
              </div>
            }
          />
        )}

        {appState === 'SCAN' && (
          <FeatureOverlay 
            title="Refrigerator Vision" 
            icon={<Camera />} 
            onClose={() => setAppState('DASHBOARD')}
            content={
              <div className="space-y-6">
                <div className="relative aspect-video bg-zinc-900 rounded-3xl overflow-hidden flex items-center justify-center border-2 border-emerald-500/30">
                  <CameraPreview videoRef={videoRef} />
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/80 to-transparent pointer-events-none" />
                  
                  {/* Scanning Line Animation */}
                  {isAnalyzingRefrigerator && (
                    <motion.div 
                      initial={{ top: 0 }}
                      animate={{ top: '100%' }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute left-0 right-0 h-1 bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)] z-10 pointer-events-none"
                    />
                  )}

                  <div className="relative z-20 text-center p-6 pointer-events-none">
                    <p className="text-emerald-400 font-mono text-xs uppercase tracking-[0.3em] mb-2">Freshness Spectral Active</p>
                    <p className="text-white font-medium">
                      {isAnalyzingRefrigerator ? "Analyzing Texture & Spoilage Markers..." : "Point at your refrigerator contents"}
                    </p>
                  </div>

                  {/* Mock UI Overlays on Image */}
                  <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md p-2 rounded-lg border border-white/10 text-[10px] font-mono text-emerald-400 pointer-events-none">
                    TEMP: 3.2°C | HUMID: 42%
                  </div>
                </div>

                <button 
                  onClick={analyzeRefrigerator}
                  disabled={isAnalyzingRefrigerator}
                  className={cn(
                    "w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2",
                    isAnalyzingRefrigerator ? "bg-emerald-800 text-emerald-400 cursor-not-allowed" : "bg-emerald-900 text-white hover:bg-emerald-800 shadow-lg"
                  )}
                >
                  {isAnalyzingRefrigerator ? (
                    <>
                      <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                      Spectral Scanning...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      Identify & Audit Freshness
                    </>
                  )}
                </button>

                {refrigeratorItems.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-emerald-950">Identified Items & Vitality:</h4>
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Spectral Confidence: 98.4%</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {refrigeratorItems.map(item => (
                        <div key={item.name} className="p-3 bg-white border border-emerald-100 rounded-2xl flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-emerald-900 text-sm">{item.name}</span>
                            <div className={cn("w-2 h-2 rounded-full", item.color)} />
                          </div>
                          <p className="text-[10px] text-emerald-600 font-bold uppercase">{item.status}</p>
                          <p className="text-[9px] text-emerald-800/40 italic">{item.detail}</p>
                        </div>
                      ))}
                    </div>

                    <h4 className="font-bold text-emerald-950 mt-8 mb-4">Precision Recipes (Visible Items Only):</h4>
                    <div className="space-y-3">
                      {refrigeratorRecipes.map((recipe, i) => (
                        <div key={i} className="p-5 bg-white border border-emerald-100 rounded-[2rem] hover:border-emerald-400 transition-colors cursor-pointer group">
                          <div className="flex justify-between items-start mb-2">
                            <p className="font-bold text-emerald-900 text-lg">{i + 1}. {recipe.title}</p>
                            <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-[10px] font-bold">{recipe.time}</span>
                          </div>
                          <p className="text-xs text-emerald-800/60 leading-relaxed">
                            {recipe.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            }
          />
        )}

        {appState === 'DIET_DAY' && (
          <FeatureOverlay 
            title="Metabolic Diet Architect" 
            icon={<Utensils />} 
            onClose={() => setAppState('DASHBOARD')}
            content={
              <div className="space-y-8">
                {!dietPlan && !isGeneratingDiet && (
                  <div className="text-center space-y-6 py-12">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                      <Utensils className="w-10 h-10" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-serif text-emerald-950 mb-2">Ready for your blueprint?</h3>
                      <p className="text-emerald-800/60 max-w-xs mx-auto">We'll architect a 1-day plan perfectly synced to your metabolic needs.</p>
                    </div>
                    <button 
                      onClick={generateDietPlan}
                      className="px-8 py-4 bg-emerald-900 text-white rounded-2xl font-bold shadow-lg hover:bg-emerald-800 transition-all"
                    >
                      Generate My Plan
                    </button>
                  </div>
                )}

                {isGeneratingDiet && (
                  <div className="text-center space-y-6 py-12">
                    <div className="w-20 h-20 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mx-auto" />
                    <p className="text-emerald-800 font-medium animate-pulse">Architecting your metabolic fuel...</p>
                  </div>
                )}

                {dietPlan && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-12"
                  >
                    {/* Hero Section - Editorial Style */}
                    <div className="relative h-[400px] rounded-[3rem] overflow-hidden bg-emerald-950">
                      <img 
                        src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=1000" 
                        alt="Healthy Food" 
                        className="absolute inset-0 w-full h-full object-cover opacity-40"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/40 to-transparent" />
                      <div className="absolute bottom-12 left-12 right-12">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="px-3 py-1 bg-emerald-500 text-white rounded-full text-[10px] font-bold uppercase tracking-widest">
                            Daily Blueprint
                          </div>
                          <div className="px-3 py-1 bg-white/10 text-emerald-300 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-md">
                            Metabolic Sync
                          </div>
                        </div>
                        <h3 className="text-5xl font-serif text-white mb-4 leading-tight">
                          Your Metabolic <br />
                          <span className="italic text-emerald-400">Masterpiece</span>
                        </h3>
                        <p className="text-emerald-100/80 max-w-lg text-lg italic leading-relaxed">
                          "{dietPlan.metabolicFocus}"
                        </p>
                      </div>
                    </div>

                    {/* Split Layout for Meals */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                      <div className="lg:col-span-8 space-y-8">
                        {[
                          { label: 'Morning Fuel', title: 'Breakfast', content: dietPlan.breakfast, time: '07:30 AM', color: 'bg-amber-50' },
                          { label: 'Midday Power', title: 'Lunch', content: dietPlan.lunch, time: '12:30 PM', color: 'bg-emerald-50' },
                          { label: 'Evening Restore', title: 'Dinner', content: dietPlan.dinner, time: '06:30 PM', color: 'bg-indigo-50' },
                        ].map((meal, i) => (
                          <div key={i} className="group relative">
                            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-emerald-100 rounded-full group-hover:bg-emerald-500 transition-colors" />
                            <div className="pl-8">
                              <div className="flex items-center justify-between mb-4">
                                <div>
                                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">{meal.label}</p>
                                  <h4 className="text-2xl font-serif text-emerald-950">{meal.title}</h4>
                                </div>
                                <span className="text-xs font-mono text-emerald-800/40">{meal.time}</span>
                              </div>
                              <div className={cn("p-8 rounded-[2.5rem] border border-emerald-100 shadow-sm transition-all group-hover:shadow-md", meal.color)}>
                                <p className="text-emerald-900 leading-relaxed text-lg italic mb-4">
                                  {meal.content.name}
                                </p>
                                <div className="flex flex-wrap gap-2 mb-4">
                                  {meal.content.macros.split(',').map((macro, j) => (
                                    <span key={j} className="px-3 py-1 bg-white/50 rounded-full text-[10px] font-bold text-emerald-800 uppercase tracking-widest">
                                      {macro.trim()}
                                    </span>
                                  ))}
                                </div>
                                {meal.content.absorptionTip && (
                                  <div className="p-4 bg-white/40 rounded-2xl border border-white/20 flex items-start gap-3">
                                    <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                    <p className="text-xs text-emerald-900 leading-relaxed">
                                      <span className="font-bold uppercase tracking-widest text-[9px] block mb-1">Plate-to-Pill Tip</span>
                                      {meal.content.absorptionTip}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="lg:col-span-4 space-y-8">
                        <div className="bg-white p-8 rounded-[3rem] border border-emerald-100 shadow-sm sticky top-8">
                          <h5 className="text-sm font-bold text-emerald-950 mb-6 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-amber-500" />
                            Supportive Elements
                          </h5>
                          
                          <div className="space-y-8">
                            <div>
                              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-4">Metabolic Snacks</p>
                              <div className="space-y-3">
                                {dietPlan.snacks.map((snack, i) => (
                                  <div key={i} className="flex flex-col gap-1 p-3 bg-emerald-50/50 rounded-2xl border border-emerald-50">
                                    <div className="flex items-start gap-3">
                                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-1.5 shrink-0" />
                                      <p className="text-xs text-emerald-900 font-bold">{snack.name}</p>
                                    </div>
                                    <p className="text-[10px] text-emerald-600 font-mono ml-4">{snack.macros}</p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100">
                              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Wind className="w-3 h-3" />
                                Hydration Protocol
                              </p>
                              <p className="text-xs text-blue-900 leading-relaxed italic">
                                {dietPlan.hydration}
                              </p>
                            </div>

                            <button 
                              onClick={() => window.print()}
                              className="w-full py-4 bg-emerald-900 text-white rounded-2xl font-bold text-sm hover:bg-emerald-800 transition-all flex items-center justify-center gap-2"
                            >
                              <ClipboardList className="w-4 h-4" />
                              Export Blueprint
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-12 border-t border-emerald-100">
                      <div className="max-w-2xl mx-auto bg-emerald-50/50 p-8 rounded-[3rem] border border-emerald-100">
                        <h4 className="text-xl font-serif text-emerald-950 mb-4 text-center">Not quite right?</h4>
                        <p className="text-emerald-800/60 text-sm text-center mb-6">Tell us what you'd like to change (e.g., "more protein", "no dairy", "different breakfast") and we'll refine it.</p>
                        <div className="flex flex-col sm:flex-row gap-4">
                          <input 
                            type="text" 
                            value={refinementFeedback}
                            onChange={(e) => setRefinementFeedback(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && refinementFeedback.trim() && !isGeneratingDiet) {
                                generateDietPlan(refinementFeedback);
                              }
                            }}
                            placeholder="Your feedback..."
                            className="flex-1 px-6 py-4 bg-white rounded-2xl border border-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-900"
                          />
                          <button 
                            onClick={() => generateDietPlan(refinementFeedback)}
                            disabled={!refinementFeedback.trim() || isGeneratingDiet}
                            className="px-8 py-4 bg-emerald-900 text-white rounded-2xl font-bold shadow-lg hover:bg-emerald-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {isGeneratingDiet ? (
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <Zap className="w-4 h-4" />
                            )}
                            Refine Plan
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="pt-12 border-t border-emerald-100 text-center">
                      <button 
                        onClick={() => setDietPlan(null)}
                        className="text-emerald-600 font-bold text-sm hover:text-emerald-800 transition-colors"
                      >
                        Re-Architect Plan
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            }
          />
        )}

        {appState === 'WORKOUT_LOG' && (
          <FeatureOverlay 
            title="Movement Studio" 
            icon={<Dumbbell />} 
            onClose={() => setAppState('DASHBOARD')}
            content={
              <div className="space-y-8">
                <div className="bg-white p-8 rounded-[3rem] border border-emerald-100 shadow-sm">
                  <h4 className="font-bold text-emerald-950 mb-6">Log New Session</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <input 
                      type="text" 
                      placeholder="Workout Type (e.g. Yoga, Strength)"
                      className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      id="workout-type"
                    />
                    <input 
                      type="number" 
                      placeholder="Duration (min)"
                      className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      id="workout-duration"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      const type = (document.getElementById('workout-type') as HTMLInputElement).value;
                      const duration = (document.getElementById('workout-duration') as HTMLInputElement).value;
                      if (!type || !duration) return;
                      setWorkoutLog([{ type, duration: parseInt(duration), intensity: 'Moderate', date: new Date().toLocaleDateString() }, ...workoutLog]);
                      (document.getElementById('workout-type') as HTMLInputElement).value = '';
                      (document.getElementById('workout-duration') as HTMLInputElement).value = '';
                    }}
                    className="w-full py-4 bg-emerald-900 text-white rounded-2xl font-bold text-sm hover:bg-emerald-800 transition-all"
                  >
                    Save Session
                  </button>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-emerald-950">Recent Movement</h4>
                  {workoutLog.map((log, i) => (
                    <div key={i} className="p-6 bg-white border border-emerald-100 rounded-[2rem] flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
                          <Dumbbell className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-emerald-900">{log.type}</p>
                          <p className="text-xs text-emerald-800/40">{log.date} • {log.duration} min</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase">
                        {log.intensity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            }
          />
        )}

        {appState === 'MEAL_LOG' && (
          <FeatureOverlay 
            title="Nourishment Log" 
            icon={<ClipboardList />} 
            onClose={() => setAppState('DASHBOARD')}
            content={
              <div className="space-y-8">
                <div className="bg-white p-8 rounded-[3rem] border border-emerald-100 shadow-sm">
                  <h4 className="font-bold text-emerald-950 mb-6">Log Meal</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <input 
                      type="text" 
                      placeholder="Meal Name"
                      className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      id="meal-name"
                    />
                    <input 
                      type="number" 
                      placeholder="Est. Calories"
                      className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      id="meal-calories"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      const name = (document.getElementById('meal-name') as HTMLInputElement).value;
                      const calories = (document.getElementById('meal-calories') as HTMLInputElement).value;
                      if (!name || !calories) return;
                      setMealLog([{ name, calories: parseInt(calories), type: 'Balanced', date: new Date().toLocaleDateString() }, ...mealLog]);
                      (document.getElementById('meal-name') as HTMLInputElement).value = '';
                      (document.getElementById('meal-calories') as HTMLInputElement).value = '';
                    }}
                    className="w-full py-4 bg-emerald-900 text-white rounded-2xl font-bold text-sm hover:bg-emerald-800 transition-all"
                  >
                    Log Meal
                  </button>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-emerald-950">Daily Intake</h4>
                  {mealLog.map((log, i) => (
                    <div key={i} className="p-6 bg-white border border-emerald-100 rounded-[2rem] flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                          <Utensils className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-emerald-900">{log.name}</p>
                          <p className="text-xs text-emerald-800/40">{log.date} • {log.calories} kcal</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase">
                        {log.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            }
          />
        )}

        {appState === 'INGREDIENT_SEARCH' && (
          <FeatureOverlay 
            title="Ingredient Spotlight" 
            icon={<Info />} 
            onClose={() => {
              setAppState('DASHBOARD');
              setIsScanningIngredient(false);
            }}
            content={
              <div className="space-y-8">
                <div className="bg-white p-8 rounded-[3rem] border border-emerald-100 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="font-bold text-emerald-950">Metabolic Analysis</h4>
                    <button 
                      onClick={() => setIsScanningIngredient(!isScanningIngredient)}
                      className={cn(
                        "p-3 rounded-2xl transition-all",
                        isScanningIngredient ? "bg-emerald-900 text-white" : "bg-emerald-100 text-emerald-600"
                      )}
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                  </div>

                  {isScanningIngredient ? (
                    <div className="space-y-4">
                      <div className="relative aspect-square bg-zinc-900 rounded-3xl overflow-hidden border-2 border-emerald-500/30">
                        <CameraPreview videoRef={videoRef} />
                        <div className="absolute inset-0 border-[20px] border-emerald-500/10 pointer-events-none" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-emerald-400/30 rounded-full pointer-events-none" />
                      </div>
                      <button 
                        onClick={captureIngredient}
                        disabled={isAnalyzingIngredient}
                        className="w-full py-4 bg-emerald-900 text-white rounded-2xl font-bold hover:bg-emerald-800 transition-all flex items-center justify-center gap-2"
                      >
                        {isAnalyzingIngredient ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Zap className="w-5 h-5" />
                            Identify & Analyze
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Enter ingredient (e.g. Ginger, Chia Seeds)..."
                        className="flex-1 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        value={ingredientSearchQuery}
                        onChange={(e) => setIngredientSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && analyzeIngredient()}
                      />
                      <button 
                        onClick={() => analyzeIngredient()}
                        disabled={isAnalyzingIngredient || !ingredientSearchQuery.trim()}
                        className="px-6 bg-emerald-900 text-white rounded-2xl font-bold hover:bg-emerald-800 transition-all disabled:opacity-50"
                      >
                        {isAnalyzingIngredient ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Search className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {ingredientAnalysis && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                  >
                    <div className="relative">
                      <div className="absolute -top-4 -left-4 w-24 h-24 bg-emerald-100/50 rounded-full -z-10 blur-2xl" />
                      <h2 className="text-5xl font-serif italic text-emerald-950 mb-2">{ingredientAnalysis.name}</h2>
                      <div className="flex items-center gap-2 mb-6">
                        <span className="px-3 py-1 bg-emerald-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-full">Metabolic Profile</span>
                        <div className="h-px flex-1 bg-emerald-100" />
                      </div>
                      <p className="text-xl text-emerald-900/80 leading-relaxed font-serif italic">
                        "{ingredientAnalysis.metabolicImpact}"
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white p-8 rounded-[2.5rem] border border-emerald-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                          <Zap className="w-12 h-12" />
                        </div>
                        <h5 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                          <Heart className="w-3 h-3" />
                          Health Benefits
                        </h5>
                        <ul className="space-y-4">
                          {ingredientAnalysis.benefits.map((benefit, i) => (
                            <li key={i} className="flex gap-3">
                              <span className="text-emerald-400 font-serif italic">0{i+1}</span>
                              <p className="text-sm text-emerald-900 leading-relaxed">{benefit}</p>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-rose-50/50 p-8 rounded-[2.5rem] border border-rose-100 shadow-sm">
                        <h5 className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                          <AlertTriangle className="w-3 h-3" />
                          Precautions
                        </h5>
                        <ul className="space-y-4">
                          {ingredientAnalysis.precautions.map((precaution, i) => (
                            <li key={i} className="flex gap-3">
                              <div className="w-1.5 h-1.5 bg-rose-400 rounded-full mt-1.5 shrink-0" />
                              <p className="text-sm text-rose-900 leading-relaxed">{precaution}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="bg-emerald-900 text-white p-10 rounded-[3rem] shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-800/50 rounded-full blur-3xl -mr-32 -mt-32" />
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8">
                          <div className="p-2 bg-white/10 rounded-xl">
                            <Zap className="w-5 h-5 text-emerald-400" />
                          </div>
                          <h5 className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-400">Plate-to-Pill: Bio-availability</h5>
                        </div>
                        <div className="space-y-6">
                          {ingredientAnalysis.absorptionTips.map((tip, i) => (
                            <p key={i} className="text-lg font-serif italic leading-relaxed text-emerald-50/90">
                              {tip}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h5 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest px-4">AI-Powered Synergy Pairings</h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {ingredientAnalysis.pairings.map((pairing, i) => (
                          <div key={i} className="bg-white p-6 rounded-[2rem] border border-emerald-100 hover:border-emerald-300 transition-all group">
                            <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">Pair with</p>
                            <p className="text-lg font-serif italic text-emerald-950 mb-3 group-hover:text-emerald-600 transition-colors">{pairing.item}</p>
                            <p className="text-[11px] text-emerald-800/60 leading-relaxed">{pairing.benefit}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            }
          />
        )}

        {appState === 'PLATE_TO_PILL' && (
          <FeatureOverlay 
            title="AR Plate-to-Pill" 
            icon={<Camera />} 
            onClose={() => {
              setAppState('DASHBOARD');
              setAnalysisResult(null);
              setDetectedItems([]);
              setFoodPairings([]);
            }}
            content={
              <div className="space-y-6">
                <div className="relative aspect-video bg-zinc-900 rounded-3xl overflow-hidden flex items-center justify-center border-2 border-emerald-500/30">
                  <CameraPreview videoRef={videoRef} />
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/80 to-transparent pointer-events-none" />
                  
                  {/* Scanning HUD */}
                  <div className="absolute inset-0 border-[20px] border-emerald-500/10 pointer-events-none" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-emerald-400/30 rounded-full animate-ping pointer-events-none" />

                  {/* Real-time Bounding Boxes */}
                  <AnimatePresence>
                    {detectedItems.map((item, idx) => {
                      const [ymin, xmin, ymax, xmax] = item.box_2d;
                      return (
                        <motion.div
                          key={`${item.label}-${idx}`}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute border-2 border-emerald-400 rounded-lg pointer-events-none z-30 shadow-[0_0_15px_rgba(52,211,153,0.5)]"
                          style={{
                            top: `${ymin / 10}%`,
                            left: `${xmin / 10}%`,
                            width: `${(xmax - xmin) / 10}%`,
                            height: `${(ymax - ymin) / 10}%`,
                          }}
                        >
                          <div className="absolute -top-6 left-0 bg-emerald-400 text-emerald-950 text-[10px] font-bold px-2 py-0.5 rounded-t-md whitespace-nowrap">
                            {item.label}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {/* Scanning Line Animation */}
                  {isAnalyzing && (
                    <motion.div 
                      initial={{ top: '0%' }}
                      animate={{ top: '100%' }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute left-0 right-0 h-1 bg-emerald-400/50 shadow-[0_0_15px_rgba(52,211,153,0.8)] z-40 pointer-events-none"
                    />
                  )}

                  <div className="relative z-20 text-center p-6 pointer-events-none">
                    <p className="text-emerald-400 font-mono text-xs uppercase tracking-[0.3em] mb-2">Nutrient Absorption Scanner</p>
                    <p className="text-white font-medium">Align plate within the frame</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <button 
                    onClick={analyzePlate}
                    disabled={isAnalyzing}
                    className={cn(
                      "w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2",
                      isAnalyzing ? "bg-emerald-800 text-emerald-400 cursor-not-allowed" : "bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg"
                    )}
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                        AI Architect Analyzing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        Scan Plate for Tips
                      </>
                    )}
                  </button>

                  {allergenWarnings.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-red-50 p-6 rounded-3xl border border-red-100 shadow-sm"
                    >
                      <div className="flex items-center gap-2 mb-4 text-red-900 font-bold">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        Allergen Alerts
                      </div>
                      <div className="space-y-2">
                        {allergenWarnings.map((warning, idx) => (
                          <p key={idx} className="text-sm text-red-800 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5 shrink-0" />
                            {warning}
                          </p>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {detectedItems.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm"
                    >
                      <div className="flex items-center gap-2 mb-4 text-emerald-900 font-bold">
                        <Activity className="w-5 h-5 text-emerald-600" />
                        Nutritional Breakdown
                      </div>
                      <div className="space-y-6">
                        {detectedItems.map((item, idx) => (
                          <div key={idx} className="border-b border-emerald-50 last:border-0 pb-4 last:pb-0">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-bold text-emerald-950">{item.label}</span>
                              <span className="text-xs font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg">
                                {item.nutrition?.calories} kcal
                              </span>
                            </div>
                            
                            {item.nutrition && (
                              <div className="grid grid-cols-3 gap-2 mb-3">
                                <div className="p-2 bg-emerald-50/50 rounded-xl text-center">
                                  <p className="text-[10px] text-emerald-600 uppercase font-bold">Protein</p>
                                  <p className="text-xs font-bold text-emerald-900">{item.nutrition.protein}</p>
                                </div>
                                <div className="p-2 bg-emerald-50/50 rounded-xl text-center">
                                  <p className="text-[10px] text-emerald-600 uppercase font-bold">Carbs</p>
                                  <p className="text-xs font-bold text-emerald-900">{item.nutrition.carbs}</p>
                                </div>
                                <div className="p-2 bg-emerald-50/50 rounded-xl text-center">
                                  <p className="text-[10px] text-emerald-600 uppercase font-bold">Fats</p>
                                  <p className="text-xs font-bold text-emerald-900">{item.nutrition.fats}</p>
                                </div>
                              </div>
                            )}

                            {item.nutrition?.micronutrients && item.nutrition.micronutrients.length > 0 && (
                              <div>
                                <p className="text-[10px] text-emerald-500 uppercase font-bold mb-2">Micronutrients</p>
                                <div className="flex flex-wrap gap-2">
                                  {item.nutrition.micronutrients.map((micro, mIdx) => (
                                    <span key={mIdx} className="text-[10px] bg-white border border-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                                      {micro.name}: {micro.amount}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {foodPairings.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-2 text-emerald-900 font-bold">
                        <Zap className="w-5 h-5 text-amber-500" />
                        Optimal Food Pairings
                      </div>
                      <div className="grid gap-3">
                        {foodPairings.map((pairing, idx) => (
                          <div key={idx} className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-emerald-900">{pairing.item}</span>
                              <span className="text-emerald-600">+</span>
                              <span className="font-bold text-amber-700">{pairing.suggestedPairing}</span>
                            </div>
                            <p className="text-xs text-emerald-800/70 italic">{pairing.reason}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {analysisResult && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm"
                    >
                      <div className="flex items-center gap-2 mb-4 text-emerald-900 font-bold">
                        <Shield className="w-5 h-5 text-emerald-600" />
                        AI Absorption Analysis
                      </div>
                      <div className="prose prose-sm prose-emerald max-w-none text-emerald-800/80 whitespace-pre-wrap">
                        {analysisResult}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            }
          />
        )}

        {appState === 'YOGA' && (
          <FeatureOverlay 
            title="3D Skeletal Instructor" 
            icon={<Activity />} 
            onClose={() => setAppState('DASHBOARD')}
            content={
              <div className="space-y-6">
                {/* 3D Instructor Visualization Placeholder */}
                <div className="relative aspect-square bg-emerald-950 rounded-[3rem] overflow-hidden flex items-center justify-center border-4 border-emerald-800 shadow-2xl">
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-400 via-transparent to-transparent animate-pulse" />
                  
                  {/* Mock 3D Skeleton/Instructor */}
                  <div className="relative z-10 flex flex-col items-center">
                    <motion.div 
                      animate={{ 
                        rotateY: [0, 10, -10, 0],
                        y: [0, -5, 0]
                      }}
                      transition={{ duration: 4, repeat: Infinity }}
                      className="w-32 h-64 border-2 border-emerald-400/50 rounded-full flex flex-col items-center p-4"
                    >
                      <div className="w-12 h-12 border-2 border-emerald-400 rounded-full mb-2" /> {/* Head */}
                      <div className="w-1 h-32 bg-emerald-400/50" /> {/* Spine */}
                      <div className="absolute top-20 w-24 h-1 bg-emerald-400/50" /> {/* Shoulders */}
                      <div className="absolute bottom-10 w-20 h-1 bg-emerald-400/50" /> {/* Hips */}
                    </motion.div>
                    <div className="mt-8 text-center">
                      <p className="text-emerald-400 font-mono text-xs tracking-widest uppercase mb-1">Active Pose</p>
                      <p className="text-2xl font-serif text-white italic">Warrior II (Virabhadrasana II)</p>
                    </div>
                  </div>

                  {/* 3D Coordinates Overlay */}
                  <div className="absolute bottom-6 left-6 right-6 flex justify-between font-mono text-[10px] text-emerald-500/70">
                    <div>L-ARM: [0.8, 1.2, -0.1]</div>
                    <div>R-ARM: [-0.8, 1.2, -0.1]</div>
                    <div>PELVIS: [0.0, 0.9, 0.0]</div>
                  </div>
                </div>

                {/* Routine Instructions */}
                <div className="space-y-4">
                  <h4 className="font-bold text-emerald-950 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    Bone Density Routine: Phase 1
                  </h4>
                  
                  <div className="space-y-3">
                    {[
                      { 
                        pose: "Warrior II", 
                        instruction: "Extend arms parallel to the floor. Gaze over the front hand. Keep the front knee at a 90° angle.",
                        focus: "Femur Loading & Hip Stability",
                        coords: "L-Knee: [0.4, 0.5, 0.2]"
                      },
                      { 
                        pose: "Triangle Pose", 
                        instruction: "Reach forward and down. Keep both legs straight. Open the chest toward the ceiling.",
                        focus: "Spinal Alignment & Bone Mineralization",
                        coords: "Torso-Tilt: 45°"
                      },
                      { 
                        pose: "Tree Pose", 
                        instruction: "Place the sole of the foot on the inner thigh. Balance on one leg. Hands in prayer.",
                        focus: "Balance & Proprioception",
                        coords: "Center-of-Mass: [0.0, 1.0, 0.0]"
                      }
                    ].map((step, i) => (
                      <div key={i} className="p-5 bg-white border border-emerald-100 rounded-3xl hover:border-emerald-400 transition-all group">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-bold text-emerald-900">{step.pose}</p>
                          <span className="text-[10px] font-mono text-emerald-500">{step.coords}</span>
                        </div>
                        <p className="text-xs text-emerald-800/70 mb-3 leading-relaxed">{step.instruction}</p>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                          <Zap className="w-3 h-3" />
                          Focus: {step.focus}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button className="w-full py-4 bg-emerald-900 text-white rounded-2xl font-bold shadow-lg hover:bg-emerald-800 transition-colors">
                  Complete Session
                </button>
              </div>
            }
          />
        )}

        {appState === 'LABEL' && (
          <FeatureOverlay 
            title="Nutrition Label Analysis" 
            icon={<Scale />} 
            onClose={() => setAppState('DASHBOARD')}
            content={
              <div className="space-y-6">
                <div className="aspect-[3/4] bg-zinc-100 rounded-3xl flex items-center justify-center border-2 border-dashed border-zinc-300">
                  <p className="text-zinc-400 font-medium">Scan Nutrition Label...</p>
                </div>
                <div className="bg-white p-8 rounded-[3rem] border border-emerald-100 text-center">
                  <p className="text-zinc-500 uppercase tracking-widest text-xs mb-2">Mom-Score</p>
                  <div className="text-7xl font-serif text-emerald-900 mb-4">84<span className="text-2xl text-emerald-600/50">/100</span></div>
                  <p className="text-emerald-800 font-medium italic">"High in fiber, but watch the hidden sodium in the 'Natural Flavors'."</p>
                </div>
                <div className="space-y-4">
                  <h4 className="font-bold text-emerald-950">The Breakdown:</h4>
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-emerald-50">
                      <tr>
                        <td className="py-3 text-emerald-800/60">Marketing Claim</td>
                        <td className="py-3 text-right font-bold text-rose-600">"Heart Healthy"</td>
                      </tr>
                      <tr>
                        <td className="py-3 text-emerald-800/60">Actual Reality</td>
                        <td className="py-3 text-right font-bold text-emerald-700">High Glycemic Index</td>
                      </tr>
                      <tr>
                        <td className="py-3 text-emerald-800/60">Mom-Recommendation</td>
                        <td className="py-3 text-right font-bold text-emerald-900">Limit to 1 serving</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            }
          />
        )}

        {lastInput.toUpperCase() === 'HERITAGE' && (
          <FeatureOverlay 
            title="Heritage Kitchen" 
            icon={<CookingPot />} 
            onClose={() => {
              setLastInput('');
              setRecipeInput('');
              setOptimizedRecipeResult(null);
              setRecipeSearchQuery('');
              setRecipeSearchResults([]);
            }}
            content={
              <div className="space-y-6">
                {/* Recipe Search Bar */}
                <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm">
                  <h4 className="font-bold text-emerald-950 mb-4 flex items-center gap-2">
                    <Search className="w-4 h-4 text-emerald-600" />
                    Search Traditional Recipes
                  </h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={recipeSearchQuery}
                      onChange={(e) => setRecipeSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && searchRecipes()}
                      placeholder="Search by name or ingredients (e.g., 'Lentil Soup', 'Turmeric')..."
                      className="flex-1 p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                    <button
                      onClick={searchRecipes}
                      disabled={isSearchingRecipes || !recipeSearchQuery.trim()}
                      className="px-6 bg-emerald-900 text-white rounded-2xl font-bold hover:bg-emerald-800 transition-all disabled:opacity-50"
                    >
                      {isSearchingRecipes ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        "Search"
                      )}
                    </button>
                  </div>

                  {recipeSearchResults.length > 0 && (
                    <div className="mt-6 grid grid-cols-1 gap-3">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Search Results</p>
                      {recipeSearchResults.map((result, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setRecipeInput(`${result.name}\n\nIngredients:\n${result.ingredients}`);
                            setRecipeSearchResults([]);
                          }}
                          className="text-left p-4 bg-emerald-50 border border-emerald-100 rounded-2xl hover:border-emerald-400 transition-all group"
                        >
                          <p className="font-bold text-emerald-900 group-hover:text-emerald-600 transition-colors">{result.name}</p>
                          <p className="text-xs text-emerald-800/60 line-clamp-1">{result.ingredients}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white p-6 rounded-3xl border border-emerald-100">
                  <h4 className="font-bold text-emerald-950 mb-4">Traditional Recipe Input</h4>
                  <textarea
                    value={recipeInput}
                    onChange={(e) => setRecipeInput(e.target.value)}
                    placeholder="Paste your traditional recipe here (e.g., Mom's Butter Chicken, Nana's Lasagna)..."
                    className="w-full h-32 p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
                  />
                  <button
                    onClick={optimizeRecipe}
                    disabled={isOptimizingRecipe || !recipeInput.trim()}
                    className={cn(
                      "w-full mt-4 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2",
                      isOptimizingRecipe || !recipeInput.trim() 
                        ? "bg-emerald-100 text-emerald-400 cursor-not-allowed" 
                        : "bg-emerald-900 text-white hover:bg-emerald-800 shadow-lg"
                    )}
                  >
                    {isOptimizingRecipe ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        AI Architect Optimizing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Optimize Recipe
                      </>
                    )}
                  </button>
                </div>

                {optimizedRecipeResult && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {originalRecipeImage && (
                        <div className="space-y-2">
                          <p className="text-[10px] text-emerald-600 uppercase tracking-widest font-bold">Original Heritage Dish</p>
                          <div className="aspect-video rounded-3xl overflow-hidden border border-emerald-100 shadow-sm">
                            <img src={originalRecipeImage} alt="Original Recipe" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                        </div>
                      )}
                      {optimizedRecipeImage && (
                        <div className="space-y-2">
                          <p className="text-[10px] text-amber-600 uppercase tracking-widest font-bold">Optimized Metabolic Version</p>
                          <div className="aspect-video rounded-3xl overflow-hidden border border-amber-100 shadow-sm">
                            <img src={optimizedRecipeImage} alt="Optimized Recipe" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Enhanced Recipe Results */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 text-emerald-900 font-bold border-b border-emerald-50 pb-2">
                          <Shield className="w-5 h-5 text-emerald-600" />
                          Original Analysis
                        </div>
                        <div className="prose prose-sm prose-emerald max-w-none text-emerald-800/80 whitespace-pre-wrap">
                          {optimizedRecipeResult.originalAnalysis}
                        </div>
                        {optimizedRecipeResult.inflammatoryTriggers && optimizedRecipeResult.inflammatoryTriggers.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-4">
                            {optimizedRecipeResult.inflammatoryTriggers.map((trigger, i) => (
                              <span key={i} className="px-3 py-1 bg-red-50 text-red-600 text-[10px] font-bold uppercase rounded-full border border-red-100">
                                {trigger}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 text-emerald-900 font-bold border-b border-emerald-100 pb-2">
                          <Zap className="w-5 h-5 text-amber-500" />
                          Optimized Version
                        </div>
                        <div className="prose prose-sm prose-emerald max-w-none text-emerald-900 font-medium whitespace-pre-wrap">
                          {optimizedRecipeResult.optimizedVersion}
                        </div>
                      </div>
                    </div>

                    {/* Metabolic Scorecard */}
                    {optimizedRecipeResult.stats && (
                      <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm">
                        <h5 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-4">Metabolic Scorecard (Est. per serving)</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[
                            { label: 'Calories', key: 'calories' },
                            { label: 'Protein', key: 'protein' },
                            { label: 'Fiber', key: 'fiber' },
                            { label: 'Sugar', key: 'sugar' }
                          ].map((stat) => (
                            <div key={stat.label} className="p-4 bg-emerald-50/30 rounded-2xl border border-emerald-50">
                              <p className="text-[10px] text-emerald-800/60 font-bold uppercase mb-2">{stat.label}</p>
                              <div className="flex items-baseline gap-2">
                                <span className="text-sm font-bold text-emerald-900">
                                  {optimizedRecipeResult.stats?.optimized[stat.key as keyof typeof optimizedRecipeResult.stats.optimized]}
                                </span>
                                <span className="text-[10px] text-emerald-500 line-through opacity-50">
                                  {optimizedRecipeResult.stats?.original[stat.key as keyof typeof optimizedRecipeResult.stats.original]}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Swap Gallery */}
                    {optimizedRecipeResult.swaps && optimizedRecipeResult.swaps.length > 0 && (
                      <div className="space-y-4">
                        <h5 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Metabolic Swaps & Benefits</h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {optimizedRecipeResult.swaps.map((swap, i) => (
                            <div key={i} className="p-4 bg-white border border-emerald-100 rounded-2xl shadow-sm space-y-2">
                              <div className="flex items-center justify-between text-[10px] font-bold">
                                <span className="text-red-400 line-through">{swap.original}</span>
                                <ChevronRight className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-600">{swap.replacement}</span>
                              </div>
                              <p className="text-[11px] text-emerald-800/70 italic leading-relaxed">
                                {swap.benefit}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 text-amber-900 font-bold border-b border-amber-200 pb-2">
                        <Activity className="w-5 h-5 text-amber-600" />
                        Nutritional Comparison & Benefits
                      </div>
                      <div className="prose prose-sm prose-amber max-w-none text-amber-900/80 whitespace-pre-wrap">
                        {optimizedRecipeResult.nutritionalComparison}
                      </div>
                    </div>
                    
                    <div className="p-6 bg-emerald-900 text-white rounded-3xl text-center">
                      <p className="italic">"Flavor preserved. Heart protected."</p>
                    </div>
                  </motion.div>
                )}

                {!optimizedRecipeResult && !isOptimizingRecipe && (
                  <div className="p-6 bg-emerald-50/50 border border-dashed border-emerald-200 rounded-3xl text-center">
                    <p className="text-xs text-emerald-600 italic">
                      "Heritage Kitchen uses AI to swap inflammatory ingredients for metabolic superfoods while keeping the soul of your family recipes intact."
                    </p>
                  </div>
                )}
              </div>
            }
          />
        )}

        {appState === 'DIET_DAY' && (
          <motion.div 
            key="diet-day"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-40 bg-zinc-950 text-zinc-100 p-6 overflow-y-auto"
          >
            <div className="max-w-md mx-auto space-y-12 py-12">
              <div className="flex items-center justify-between">
                <h1 className="text-4xl font-black uppercase tracking-tighter">Diet Day Active</h1>
                <button onClick={() => {
                  setIsStrictCoach(false);
                  setAppState('DASHBOARD');
                }} className="p-2 bg-zinc-800 rounded-full">
                  <ChevronLeft />
                </button>
              </div>
              
              <div className="p-8 bg-zinc-900 rounded-[3rem] border-4 border-zinc-800">
                <p className="text-zinc-500 uppercase tracking-widest text-xs mb-4">Strict Coach Mode</p>
                <p className="text-2xl font-bold italic leading-tight">
                  "No excuses today, Mom. We are rebuilding your foundation. Drink your water NOW."
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold uppercase tracking-widest text-zinc-500">Today's Schedule</h3>
                {[
                  { time: '08:00', task: 'Lemon Water + 10min Walk', done: true },
                  { time: '10:00', task: 'Protein Intake (20g)', done: false },
                  { time: '12:00', task: 'Main Meal (High Fiber)', done: false },
                  { time: '14:00', task: 'Hydration Check (500ml)', done: false },
                ].map((item, i) => (
                  <div key={i} className={cn(
                    "p-6 rounded-2xl flex items-center justify-between border-2",
                    item.done ? "bg-zinc-900 border-zinc-800 opacity-50" : "bg-zinc-800 border-zinc-700"
                  )}>
                    <div>
                      <p className="text-xs font-mono text-zinc-500">{item.time}</p>
                      <p className="font-bold">{item.task}</p>
                    </div>
                    {item.done ? <CheckCircle2 className="text-emerald-500" /> : <Clock className="text-zinc-600" />}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Chat Button */}
      {appState === 'DASHBOARD' && (
        <div className="fixed bottom-8 right-8 z-50">
          <AnimatePresence>
            {isChatOpen && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="absolute bottom-20 right-0 w-[350px] h-[500px] bg-white rounded-[2.5rem] shadow-2xl border border-emerald-100 flex flex-col overflow-hidden"
              >
                {/* Chat Header */}
                <div className="p-6 bg-emerald-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-800 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Health Architect</p>
                      <p className="text-[10px] text-emerald-400 uppercase tracking-widest">Always Active</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsChatOpen(false)}
                    className="p-2 hover:bg-emerald-800 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-emerald-50/30">
                  {chatMessages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-40">
                      <MessageSquare className="w-12 h-12 mb-4 text-emerald-900" />
                      <p className="text-sm font-serif italic text-emerald-900">
                        "Ask me about your meal plan, bone density routine, or heart-healthy recipes."
                      </p>
                    </div>
                  )}
                  {chatMessages.map((msg, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "flex flex-col max-w-[85%]",
                        msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                      )}
                    >
                      <div className={cn(
                        "p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
                        msg.role === 'user' 
                          ? "bg-emerald-900 text-white rounded-tr-none" 
                          : "bg-white text-emerald-950 border border-emerald-100 rounded-tl-none"
                      )}>
                        {msg.text}
                      </div>
                      <span className="text-[9px] text-emerald-800/40 mt-1 font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex items-center gap-2 text-emerald-600">
                      <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce" />
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="p-4 bg-white border-t border-emerald-100">
                  <div className="relative flex items-center">
                    <input 
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type your question..."
                      className="w-full pl-4 pr-12 py-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-950"
                    />
                    <button 
                      onClick={handleSendMessage}
                      disabled={!chatInput.trim() || isChatLoading}
                      className="absolute right-2 p-2 bg-emerald-900 text-white rounded-xl hover:bg-emerald-800 transition-colors disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300",
              isChatOpen ? "bg-white text-emerald-900 rotate-90" : "bg-emerald-900 text-white"
            )}
          >
            {isChatOpen ? <X className="w-8 h-8" /> : <MessageSquare className="w-8 h-8" />}
          </motion.button>
        </div>
      )}

      <AnimatePresence>
        {cameraError && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-red-900 text-white px-6 py-3 rounded-2xl font-bold shadow-2xl flex items-center gap-2"
          >
            <AlertTriangle className="w-5 h-5" />
            {cameraError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      {appState !== 'INITIAL' && appState !== 'QUESTIONNAIRE' && appState !== 'MEDICAL_HALT' && (
        <BottomNavigation currentTab={appState} onTabChange={setAppState} />
      )}
    </div>
  );
}

function BottomNavigation({ currentTab, onTabChange }: { currentTab: AppState, onTabChange: (tab: AppState) => void }) {
  const tabs = [
    { id: 'DASHBOARD', label: 'Home', icon: <LayoutDashboard className="w-6 h-6" /> },
    { id: 'GEMINI_CHAT', label: 'Architect', icon: <MessageSquare className="w-6 h-6" /> },
    { id: 'WORKOUT_LOG', label: 'Workout', icon: <Activity className="w-6 h-6" /> },
    { id: 'DIET_DAY', label: 'Diet', icon: <CookingPot className="w-6 h-6" /> },
    { id: 'HYDRATION_HUB', label: 'Hydration', icon: <Droplet className="w-6 h-6" /> },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-emerald-100 p-4 pb-8 flex justify-around items-center z-[60] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id as AppState)}
            className={cn(
              "flex flex-col items-center gap-1 transition-all duration-300 relative",
              isActive ? "text-emerald-600 scale-110" : "text-emerald-800/40 hover:text-emerald-600"
            )}
          >
            {tab.icon}
            <span className="text-[10px] font-bold uppercase tracking-widest">{tab.label}</span>
            {isActive && (
              <motion.div 
                layoutId="activeTab"
                className="absolute -top-2 w-1 h-1 bg-emerald-600 rounded-full"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

function GeminiChat({ onClose, onVoiceMode, initialInput }: { onClose: () => void, onVoiceMode: () => void, initialInput?: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState(initialInput || '');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasSentInitialRef = useRef(false);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  const sendMessage = async (overrideInput?: string) => {
    const textToSend = overrideInput || input;
    if (!textToSend.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      text: textToSend,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: textToSend,
        config: {
          systemInstruction: "You are the Matriarch Health Architect, a world-class longevity and metabolic health expert. Your goal is to provide evidence-based, supportive, and actionable health advice. Use Google Search for the latest research and Google Maps to find local health resources when relevant.",
          tools: [{ googleSearch: {} }, { googleMaps: {} }],
        },
      });

      const modelMessage: ChatMessage = {
        role: 'model',
        text: response.text || "I'm sorry, I couldn't process that.",
        timestamp: Date.now()
      };

      const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
      if (groundingMetadata?.groundingChunks) {
        const sources = groundingMetadata.groundingChunks
          .map(chunk => chunk.web?.uri || chunk.maps?.uri)
          .filter(Boolean);
        
        if (sources.length > 0) {
          modelMessage.text += "\n\n**Sources:**\n" + Array.from(new Set(sources)).map(s => `- ${s}`).join('\n');
        }
      }

      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        role: 'model',
        text: "I encountered an error. Please try again.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialInput && !hasSentInitialRef.current) {
      hasSentInitialRef.current = true;
      sendMessage(initialInput);
    }
  }, [initialInput]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-[70] bg-[#f5f5f0] flex flex-col"
    >
      {/* Header */}
      <div className="p-6 bg-white border-b border-emerald-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-900 text-white rounded-2xl shadow-lg">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-serif text-emerald-950">Gemini Architect</h2>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">AI Health Assistant</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-3 bg-emerald-50 text-emerald-900 rounded-full hover:bg-emerald-100 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
            <Brain className="w-16 h-16 text-emerald-900" />
            <p className="text-lg font-serif italic text-emerald-950">How can I assist your longevity journey today?</p>
            <div className="flex flex-wrap justify-center gap-2 max-w-sm">
              {['Find nearby clinics', 'Latest longevity research', 'Metabolic health tips'].map(tip => (
                <button 
                  key={tip}
                  onClick={() => setInput(tip)}
                  className="px-4 py-2 bg-white border border-emerald-100 rounded-full text-xs font-bold text-emerald-800 hover:bg-emerald-50 transition-colors"
                >
                  {tip}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              "flex flex-col max-w-[85%]",
              msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
            )}
          >
            <div className={cn(
              "p-4 rounded-[2rem] text-sm leading-relaxed shadow-sm",
              msg.role === 'user' 
                ? "bg-emerald-900 text-white rounded-tr-none" 
                : "bg-white text-emerald-950 border border-emerald-100 rounded-tl-none"
            )}>
              {msg.text}
            </div>
            <span className="text-[8px] font-bold text-emerald-800/40 uppercase tracking-widest mt-2 px-2">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-emerald-600 p-4">
            <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.2s]" />
            <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.4s]" />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-6 bg-white border-t border-emerald-100">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button 
            onClick={onVoiceMode}
            className="p-4 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-100 transition-colors"
            title="Switch to Voice Mode"
          >
            <Mic className="w-6 h-6" />
          </button>
          <div className="flex-1 relative">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask about your health, nutrition, or find local services..."
              className="w-full bg-emerald-50 border border-emerald-100 rounded-3xl px-6 py-4 pr-16 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-950"
            />
            <button 
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-emerald-900 text-white rounded-2xl hover:bg-emerald-800 transition-all disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function GeminiLiveOverlay({ onClose }: { onClose: () => void }) {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [status, setStatus] = useState<'IDLE' | 'CONNECTING' | 'CONNECTED' | 'ERROR'>('IDLE');
  const [transcript, setTranscript] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef(0);

  const startSession = async () => {
    setIsConnecting(true);
    setStatus('CONNECTING');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      
      // Simple ScriptProcessor fallback for simplicity in this environment
      // (Instruction says manual PCM encoding/decoding)
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      
      const sessionPromise = ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "You are the Matriarch Health Architect. You are in a real-time voice conversation with the user. Be supportive, concise, and helpful. Focus on metabolic health and longevity.",
        },
        callbacks: {
          onopen: () => {
            setStatus('CONNECTED');
            setIsActive(true);
            setIsConnecting(false);
            
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              // Convert Float32 to Int16 PCM
              const pcmData = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
              }
              const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
              sessionPromise.then(session => {
                session.sendRealtimeInput({
                  audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
                });
              });
            };
            source.connect(processor);
            processor.connect(audioContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts) {
              for (const part of message.serverContent.modelTurn.parts) {
                if (part.inlineData?.data) {
                  const base64Audio = part.inlineData.data;
                  const binaryString = atob(base64Audio);
                  const bytes = new Uint8Array(binaryString.length);
                  for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                  }
                  const pcmData = new Int16Array(bytes.buffer);
                  
                  // Play PCM
                  if (audioContextRef.current) {
                    const buffer = audioContextRef.current.createBuffer(1, pcmData.length, 24000);
                    const channelData = buffer.getChannelData(0);
                    for (let i = 0; i < pcmData.length; i++) {
                      channelData[i] = pcmData[i] / 0x7FFF;
                    }
                    const source = audioContextRef.current.createBufferSource();
                    source.buffer = buffer;
                    source.connect(audioContextRef.current.destination);
                    
                    const now = audioContextRef.current.currentTime;
                    const startTime = Math.max(now, nextStartTimeRef.current);
                    source.start(startTime);
                    nextStartTimeRef.current = startTime + buffer.duration;
                  }
                }
              }
            }
            
            if (message.serverContent?.interrupted) {
              // Stop playback
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => {
            stopSession();
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            setStatus('ERROR');
            stopSession();
          }
        }
      });

      sessionRef.current = await sessionPromise;

    } catch (err) {
      console.error("Failed to start Live session:", err);
      setStatus('ERROR');
      setIsConnecting(false);
    }
  };

  const stopSession = () => {
    setIsActive(false);
    setStatus('IDLE');
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopSession();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-950/90 backdrop-blur-2xl p-6"
    >
      <div className="max-w-md w-full bg-white rounded-[3rem] p-8 text-center shadow-2xl border border-rose-100 relative overflow-hidden">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-rose-50 rounded-full transition-colors"
        >
          <X className="w-6 h-6 text-rose-900" />
        </button>

        <div className="mb-8">
          <div className={cn(
            "w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-500",
            isActive ? "bg-rose-500 scale-110 shadow-[0_0_50px_rgba(244,63,94,0.4)]" : "bg-rose-50"
          )}>
            {isActive ? (
              <div className="flex gap-1 items-center">
                {[1, 2, 3, 4, 5].map(i => (
                  <motion.div 
                    key={i}
                    animate={{ height: [10, 40, 10] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                    className="w-1.5 bg-white rounded-full"
                  />
                ))}
              </div>
            ) : (
              <Mic className="w-12 h-12 text-rose-600" />
            )}
          </div>
          <h2 className="text-3xl font-serif text-rose-950 mb-2">Gemini Live</h2>
          <p className="text-sm text-rose-800/60 font-medium uppercase tracking-widest">
            {status === 'IDLE' && 'Ready to talk?'}
            {status === 'CONNECTING' && 'Connecting to AI...'}
            {status === 'CONNECTED' && 'AI is listening...'}
            {status === 'ERROR' && 'Connection failed'}
          </p>
        </div>

        <div className="space-y-4">
          {!isActive ? (
            <button 
              onClick={startSession}
              disabled={isConnecting}
              className="w-full py-5 bg-rose-600 text-white rounded-3xl font-bold text-lg shadow-xl hover:bg-rose-500 transition-all flex items-center justify-center gap-3"
            >
              {isConnecting ? (
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Activity className="w-6 h-6" />
                  Start Conversation
                </>
              )}
            </button>
          ) : (
            <button 
              onClick={stopSession}
              className="w-full py-5 bg-zinc-900 text-white rounded-3xl font-bold text-lg shadow-xl hover:bg-zinc-800 transition-all"
            >
              End Session
            </button>
          )}
          <p className="text-xs text-rose-800/40 leading-relaxed">
            Real-time voice allows for natural, hands-free coaching. <br/>
            Try asking: "What should I eat for lunch to boost my energy?"
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function FeatureOverlay({ title, icon, content, onClose }: { title: string, icon: React.ReactNode, content: React.ReactNode, onClose: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-50 bg-[#f5f5f0] p-6 overflow-y-auto"
    >
      <div className="max-w-2xl mx-auto pb-32">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-900 text-white rounded-2xl">
              {icon}
            </div>
            <h2 className="text-2xl font-serif text-emerald-950">{title}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-emerald-100 text-emerald-900 rounded-full hover:bg-emerald-200 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>
        {content}
      </div>
    </motion.div>
  );
}
