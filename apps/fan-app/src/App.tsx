import React, { useState, useEffect, useMemo, useCallback, useReducer } from 'react';

// ============================================================================
// 1. CONSTANTS, UTILS & CORRECTIONS
// ============================================================================

const ANIMATION_CONSTANTS = {
  BALL_COUNT: 6,
  PULSE_LOW: 70,
  PULSE_HIGH: 90,
  ROTATION_SPEEDS: ['8s', '11s', '14s', '9s', '13s', '10s']
};

// Clean HTML tags and text inputs
function sanitizeText(input: string): string {
  return input.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim();
}

// BLE Distance calculation: distance = 10^((-30 - RSSI) / 20)
function calculateBleDistance(rssi: number): number {
  return Math.pow(10, (-30 - rssi) / 20);
}

// Simple Trilateration mock returning dynamic (x, y) coordinates
function mockTrilaterate(r1: number, r2: number, r3: number): { x: number; y: number } {
  const sum = r1 + r2 + r3;
  if (sum === 0) return { x: 150, y: 150 };
  const x = 50 + (r1 / sum) * 200;
  const y = 60 + (r2 / sum) * 180;
  return { x: Math.round(x), y: Math.round(y) };
}

// AI Waste Classifier Utility mapping terms directly to structured bins
function classifyWaste(text: string): { bin: 'Green' | 'Silver' | 'Blue' | 'Brown'; instruction: string } {
  const query = text.toLowerCase();
  if (query.includes('burger') || query.includes('food') || query.includes('apple') || query.includes('bread')) {
    return { bin: 'Brown', instruction: 'Compostable Bin: Place food leftovers here.' };
  }
  if (query.includes('bottle') || query.includes('soda') || query.includes('can') || query.includes('plastic')) {
    return { bin: 'Blue', instruction: 'Recycling Bin: Empty liquids first before tossing.' };
  }
  if (query.includes('paper') || query.includes('box') || query.includes('cardboard') || query.includes('flyer')) {
    return { bin: 'Green', instruction: 'Paper Bin: Ensure paper is dry and non-greasy.' };
  }
  return { bin: 'Silver', instruction: 'General Landfill Waste: Toss non-recyclable items here.' };
}

// AI Hardcoded Response Matrix
function getAiResponse(role: 'fan' | 'organizer' | 'volunteer', query: string, _lang = 'en'): string {
  const q = query.toLowerCase();
  if (role === 'fan') {
    if (q.includes('food') || q.includes('halal') || q.includes('eat')) {
      return "[AI-Generated] Halal Bites is located near Section 112. Current wait time is under 3 minutes. The optimal operational window to beat crowds is around the 80th minute.";
    }
    if (q.includes('gate') || q.includes('exit') || q.includes('navigation')) {
      return "[AI-Generated] Gate B is experiencing high outbound density. Recommend routing through Gate C which has an optimized clearance trajectory of 2.4 minutes.";
    }
    return "[AI-Generated] Welcome to MetLife Stadium. I am your World Cup AI Companion. How can I assist with your seating, food, or exit logistics today?";
  } else if (role === 'organizer') {
    if (q.includes('surge') || q.includes('crowd')) {
      return "[AI-Intelligence] Active surge identified in Section 200 Concourse. Predictive redirection AI active. Recommendation: Deploy standby volunteers to Gate B and broadcast localized exit advisories.";
    }
    return "[AI-Intelligence] Command dashboard operational. Operations status nominal. Standing by for predictive crowd flow routing or emergency execution protocols.";
  } else {
    if (q.includes('child') || q.includes('lost')) {
      return "[SOP Help] Protocol 14-A: Escort the individual immediately to the nearest Guest Services hub at Section 116. Notify Central Operations with physical identifiers via radio channel 3.";
    }
    if (q.includes('medical') || q.includes('hurt')) {
      return "[SOP Help] Protocol 02-B: If unresponsive, request urgent deployment of Medical Response Team via app or dial Ops Unit 1 immediately. Keep area clear.";
    }
    return "[SOP Help] Systems active. Enter keyword terms (e.g., lost child, medical aid, fire hazard) to pull real-time pgvector relevance scores and protocol listings.";
  }
}

// ============================================================================
// 2. TYPES & STATE HANDLERS
// ============================================================================

interface Incident {
  id: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Pending' | 'In Progress' | 'Completed';
  location: string;
  timestamp: string;
  isNew?: boolean;
}

interface AppState {
  role: 'onboarding' | 'fan' | 'organizer' | 'volunteer';
  isDarkMode: boolean;
  isAccessibilityMode: boolean;
  ecoPoints: number;
  xpLevel: number;
  triggerLevelBurst: boolean;
  accessibilityNeeds: { wheelchair: boolean; visual: boolean; hearing: boolean };
  incidents: Incident[];
  tasks: { id: string; label: string; priority: 'High' | 'Low'; status: 'pending' | 'in_progress' | 'completed' }[];
  lastBroadcast: string | null;
}

type Action = 
  | { type: 'SET_ROLE'; payload: AppState['role'] }
  | { type: 'TOGGLE_DARK_MODE' }
  | { type: 'TOGGLE_ACCESSIBILITY' }
  | { type: 'ADD_ECO_POINTS'; payload: number }
  | { type: 'RESET_BURST' }
  | { type: 'UPDATE_ACCESSIBILITY_NEEDS'; payload: AppState['accessibilityNeeds'] }
  | { type: 'ADD_INCIDENT'; payload: Incident }
  | { type: 'CLEAR_INCIDENT_FLASH'; payload: string }
  | { type: 'TOGGLE_TASK'; payload: { id: string; status: 'pending' | 'in_progress' | 'completed' } }
  | { type: 'RECEIVE_BROADCAST'; payload: string };

const initialIncidents: Incident[] = [
  { id: 'INC-101', description: 'Crowd slowdown reported near outer terminal ramp', severity: 'Medium', status: 'In Progress', location: 'Gate A Concourse', timestamp: '20:41' },
  { id: 'INC-102', description: 'Minor liquid spill near concession counter row B', severity: 'Low', status: 'Pending', location: 'Section 112', timestamp: '20:44' }
];

const initialTasks: AppState['tasks'] = [
  { id: 'TSK-01', label: 'Escort family with registered wheelchair access requirements', priority: 'High', status: 'pending' },
  { id: 'TSK-02', label: 'Distribute tournament sustainability pamphlets at main concourse', priority: 'Low', status: 'pending' },
  { id: 'TSK-03', label: 'Monitor Gate B perimeter overspill metrics', priority: 'High', status: 'in_progress' }
];

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_ROLE':
      return { ...state, role: action.payload };
    case 'TOGGLE_DARK_MODE':
      return { ...state, isDarkMode: !state.isDarkMode };
    case 'TOGGLE_ACCESSIBILITY':
      return { ...state, isAccessibilityMode: !state.isAccessibilityMode };
    case 'ADD_ECO_POINTS': {
      const newPoints = state.ecoPoints + action.payload;
      const calculatedLevel = Math.floor(newPoints / 100) + 1;
      const leveledUp = calculatedLevel > state.xpLevel;
      return {
        ...state,
        ecoPoints: newPoints,
        xpLevel: calculatedLevel,
        triggerLevelBurst: leveledUp ? true : state.triggerLevelBurst
      };
    }
    case 'RESET_BURST':
      return { ...state, triggerLevelBurst: false };
    case 'UPDATE_ACCESSIBILITY_NEEDS':
      return { ...state, accessibilityNeeds: action.payload };
    case 'ADD_INCIDENT':
      return { ...state, incidents: [action.payload, ...state.incidents] };
    case 'CLEAR_INCIDENT_FLASH':
      return {
        ...state,
        incidents: state.incidents.map(inc => inc.id === action.payload ? { ...inc, isNew: false } : inc)
      };
    case 'TOGGLE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task => task.id === action.payload.id ? { ...task, status: action.payload.status } : task)
      };
    case 'RECEIVE_BROADCAST':
      return { ...state, lastBroadcast: action.payload };
    default:
      return state;
  }
}

// ============================================================================
// 3. BASE CSS GRAPHICS & REFINED STYLES
// ============================================================================

const CSS_STYLES = `
  /* Global CSS Injections and Resets */
  .stadiumiq-root {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    transition: background-color 0.2s ease, color 0.2s ease;
  }
  
  /* Focus Indicator System */
  .siq-focusable:focus-visible {
    outline: 3px solid #e8c84a !important;
    outline-offset: 2px !important;
  }
  .siq-focusable-light:focus-visible {
    outline: 3px solid #001a4e !important;
    outline-offset: 2px !important;
  }

  /* Keyframe Animations */
  @keyframes pitchFloat {
    0% { transform: translate(0px, 0px) rotate(0deg); }
    50% { transform: translate(45px, 60px) rotate(180deg); }
    100% { transform: translate(0px, 0px) rotate(360deg); }
  }
  @keyframes ballBounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-12px); }
  }
  @keyframes transitionRoll {
    0% { transform: translateX(-60px) rotate(0deg); opacity: 1; }
    100% { transform: translateX(calc(100vw + 60px)) rotate(720deg); opacity: 0.8; }
  }
  @keyframes livePulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.2; }
  }
  @keyframes pulseRing {
    0% { transform: scale(1); opacity: 0.8; }
    100% { transform: scale(1.4); opacity: 0; }
  }
  @keyframes celebrationGoal {
    0% { transform: translateY(0) scale(1); opacity: 1; }
    100% { transform: translateY(-200px) scale(2); opacity: 0; }
  }
  @keyframes sparkFade {
    0% { transform: translate(0, 0) scale(1); opacity: 1; }
    100% { transform: translate(var(--tx), var(--ty)) scale(0.5); opacity: 0; }
  }
  @keyframes skeletonWave {
    0% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
    100% { transform: translateY(0); }
  }
  @keyframes redCardFlash {
    0%, 100% { background-color: transparent; }
    50% { background-color: rgba(229, 62, 62, 0.6); }
  }
  @keyframes whistleDash {
    to { stroke-dashoffset: 0; }
  }
  @keyframes whistleRipple {
    0% { transform: scale(1); opacity: 0.6; }
    100% { transform: scale(1.8); opacity: 0; }
  }
  @keyframes marqueeTicker {
    0% { transform: translateX(100%); }
    100% { transform: translateX(-100%); }
  }
  @keyframes shimmerMove {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  /* Animation wrappers acting on configuration specs */
  @media (prefers-reduced-motion: no-preference) {
    .animate-pitch-ball { animation: pitchFloat infinite ease-in-out; }
    .animate-card-hover-ball { animation: ballBounce 0.5s ease-in-out infinite; }
    .animate-screen-roll { animation: transitionRoll 0.6s ease-in-out forwards; }
    .animate-live-dot { animation: livePulse 1.2s infinite; }
    .animate-pulse-ring { animation: pulseRing 1.5s cubic-bezier(0.215, 0.610, 0.355, 1) infinite; }
    .animate-goal-burst { animation: celebrationGoal 0.8s ease-out forwards; }
    .animate-spark { animation: sparkFade 0.6s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
    .animate-skeleton-wave { animation: skeletonWave 0.6s ease-in-out infinite; }
    .animate-red-card { animation: redCardFlash 1.2s ease-in-out 2; }
    .animate-whistle-check { animation: whistleDash 0.4s ease-in-out forwards; }
    .animate-whistle-rip { animation: whistleRipple 0.3s cubic-bezier(0.1, 0.8, 0.3, 1) forwards; }
    .animate-marquee { animation: marqueeTicker 25s linear infinite; }
    .animate-shimmer {
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
      background-size: 200% 100%;
      animation: shimmerMove 1.5s infinite linear;
    }
  }

  .animate-marquee:hover {
    animation-play-state: paused !important;
  }
`;

// Classic Soccer Ball SVG Component
const SoccerBallIcon = ({ className = "w-5 h-5", style = {} }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="presentation">
    <circle cx="12" cy="12" r="10" fill="#f3f6fa" stroke="#1a1a1a" strokeWidth="1"/>
    <polygon points="12,8.2 15.3,10.7 14,14.7 10,14.7 8.7,10.7" fill="#1a1a1a" stroke="#1a1a1a" />
    <line x1="12" y1="8.2" x2="12" y2="2" stroke="#1a1a1a" />
    <line x1="15.3" y1="10.7" x2="20.5" y2="8.5" stroke="#1a1a1a" />
    <line x1="14" y1="14.7" x2="18" y2="21" stroke="#1a1a1a" />
    <line x1="10" y1="14.7" x2="6" y2="21" stroke="#1a1a1a" />
    <line x1="8.7" y1="10.7" x2="3.5" y2="8.5" stroke="#1a1a1a" />
  </svg>
);

// GenAI Gold Accent Badge component
const GenAiBadge = () => (
  <span style={{ backgroundColor: '#c9a227', color: '#001a4e', borderRadius: '4px', padding: '2px 8px' }} className="text-xs font-bold inline-flex items-center gap-1 tracking-wider uppercase select-none">
    ✨ Powered by GenAI
  </span>
);

// Shared Error Boundary Component for Role Views
class SafeErrorBoundary extends React.Component<{ readonly children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center bg-red-900/20 border border-red-500/40 rounded-xl max-w-lg mx-auto my-12">
          <h3 className="text-xl font-bold text-white mb-2">Operational Boundary Failure</h3>
          <p className="text-gray-300 text-sm mb-4">A critical display view error occurred in this module component tree.</p>
          <button onClick={() => this.setState({ hasError: false })} className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg text-sm transition-colors siq-focusable">
            Reset Module View
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Bouncing ball wave loader component
const BallBounceLoader = () => (
  <div className="flex items-center gap-1 pointer-events-none select-none" role="presentation">
    {[0, 1, 2].map((idx) => (
      <div
        key={idx}
        className="animate-skeleton-wave"
        style={{
          animationDelay: `${idx * 0.2}s`,
          animationDuration: "0.6s",
          willChange: "transform",
        }}
      >
        <SoccerBallIcon className="w-3.5 h-3.5" />
      </div>
    ))}
  </div>
);

// Crowd radial pulse rings component
const CrowdPulseRing = ({ occupancy }: { occupancy: number }) => {
  const config = useMemo(() => {
    if (occupancy >= 90) {
      return { color: "#e53e3e", duration: "0.9s", rings: [0, 1, 2] };
    }
    if (occupancy >= 70) {
      return { color: "#dd6b20", duration: "1.4s", rings: [0, 1] };
    }
    return { color: "#00a651", duration: "2.0s", rings: [0] };
  }, [occupancy]);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden" role="presentation">
      <svg className="w-full h-full" viewBox="0 0 100 100" aria-hidden="true">
        {config.rings.map((idx) => (
          <circle
            key={idx}
            cx="50"
            cy="50"
            r="38"
            fill="none"
            stroke={config.color}
            strokeWidth="2.5"
            className="animate-pulse-ring origin-center"
            style={{
              animationDuration: config.duration,
              animationDelay: `${idx * 0.3}s`,
              transformOrigin: "center",
              willChange: "transform, opacity",
            }}
          />
        ))}
      </svg>
    </div>
  );
};

// Level Up Goal Celebration Burst
const GoalCelebration = ({ active, onComplete }: { active: boolean; onComplete: () => void }) => {
  const [visible, setVisible] = useState(active);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (active) {
      setVisible(true);
      timer = setTimeout(() => {
        setVisible(false);
        onComplete();
      }, 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [active, onComplete]);

  const sparks = useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => {
      const rad = (i * 45 * Math.PI) / 180;
      const tx = Math.round(Math.cos(rad) * 60);
      const ty = Math.round(Math.sin(rad) * 60);
      return { id: i, tx, ty };
    });
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none select-none z-50 flex items-center justify-center overflow-visible" role="presentation">
      <div className="absolute animate-goal-shoot" style={{ transformOrigin: "center" }}>
        <SoccerBallIcon className="w-10 h-10" />
      </div>
      {sparks.map((spark) => (
        <svg
          key={spark.id}
          className="absolute animate-spark"
          style={{
            "--tx": `${spark.tx}px`,
            "--ty": `${spark.ty}px`,
            width: 8,
            height: 8,
            willChange: "transform, opacity",
          } as React.CSSProperties}
          viewBox="0 0 10 10"
          aria-hidden="true"
        >
          <circle cx="5" cy="5" r="4" fill="#e8c84a" />
        </svg>
      ))}
    </div>
  );
};

// Whistle checkmark ripple component
const WhistleAnimation = ({ active }: { active: boolean }) => (
  <div className="relative w-5 h-5 flex items-center justify-center pointer-events-none select-none" role="presentation">
    {active && (
      <div className="absolute inset-0 rounded-full border border-[#00a651] animate-whistle-rip" style={{ willChange: "transform, opacity" }} />
    )}
    <svg className="w-3 h-3 text-white overflow-visible" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path
        d="M 2 6.5 L 4.8 9.3 L 10 3"
        strokeDasharray="100"
        strokeDashoffset={active ? "0" : "100"}
        className={active ? "animate-whistle-check" : ""}
        style={{ transition: "stroke-dashoffset 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}
      />
    </svg>
  </div>
);

// Skeleton Card Placeholder component
const SkeletonCard = () => (
  <div className="rounded-xl border border-slate-700/40 bg-slate-900/60 p-4 space-y-3 animate-pulse">
    <div className="flex items-center justify-between h-5">
      <div className="h-3 w-28 rounded bg-slate-800" />
      <BallBounceLoader />
    </div>
    <div className="h-8 w-20 rounded mt-1 bg-slate-800" />
    <div className="space-y-2 pt-1">
      <div className="h-2 rounded bg-slate-800 w-full animate-shimmer" />
      <div className="h-2 rounded bg-slate-800 w-5/6 animate-shimmer" />
    </div>
  </div>
);

function SkeletonDisplayGrid({ isDark }: { isDark: boolean }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(idx => <SkeletonCard key={idx} />)}
      </div>
      <div className={`h-40 rounded-xl border p-4 animate-pulse ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`} />
    </div>
  );
}

// ============================================================================
// 4. MAIN INTEGRATED PLATFORM
// ============================================================================

export function App() {
  const [state, dispatch] = useReducer(appReducer, {
    role: 'onboarding',
    isDarkMode: false,
    isAccessibilityMode: false,
    ecoPoints: 120,
    xpLevel: 2,
    triggerLevelBurst: false,
    accessibilityNeeds: { wheelchair: false, visual: false, hearing: false },
    incidents: initialIncidents,
    tasks: initialTasks,
    lastBroadcast: "Gate B now operational. Inbound congestion down 12%."
  });

  const [activeTab, setActiveTab] = useState('home');
  const [transitionTarget, setTransitionTarget] = useState<AppState['role'] | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [globalLoading, setGlobalLoading] = useState(false);

  // Network Monitoring Hooks
  useEffect(() => {
    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
    };
  }, []);

  // Simulating Realtime Encapsulated Zod/Shape Checked WS Subscriptions
  useEffect(() => {
    const wsInterval = setInterval(() => {
      const rand = Math.random();
      if (rand > 0.7) {
        dispatch({ type: 'RECEIVE_BROADCAST', payload: `[WS Alert] Flow rate optimized at Gate ${Math.random() > 0.5 ? 'A' : 'C'}.` });
      } else if (rand < 0.25) {
        const newInc: Incident = {
          id: `INC-${Math.floor(100 + Math.random() * 900)}`,
          description: 'Spike flagged via operational crowd density telemetry trackers',
          severity: Math.random() > 0.5 ? 'High' : 'Medium',
          status: 'Pending',
          location: 'Section 200 Concourse',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isNew: true
        };
        dispatch({ type: 'ADD_INCIDENT', payload: newInc });
      }
    }, 15000);

    return () => clearInterval(wsInterval);
  }, []);

  // Theme Synchronizations matching standard role defaults
  useEffect(() => {
    if (state.role === 'organizer') {
      if (!state.isDarkMode) dispatch({ type: 'TOGGLE_DARK_MODE' });
    } else {
      if (state.isDarkMode) dispatch({ type: 'TOGGLE_DARK_MODE' });
    }
    setActiveTab(state.role === 'volunteer' ? 'briefing' : 'home');
  }, [state.role]);

  // Handle Level XP Goals Completion Timers
  useEffect(() => {
    if (state.triggerLevelBurst) {
      const timer = setTimeout(() => dispatch({ type: 'RESET_BURST' }), 900);
      return () => {
        clearTimeout(timer);
      };
    }
    return undefined;
  }, [state.triggerLevelBurst]);

  const handleRoleTransition = useCallback((targetRole: AppState['role']) => {
    setTransitionTarget(targetRole);
    setGlobalLoading(true);
    setTimeout(() => {
      dispatch({ type: 'SET_ROLE', payload: targetRole });
      setTransitionTarget(null);
      setGlobalLoading(false);
    }, 600);
  }, []);

  // Shared theme contexts configuration sets
  const isDark = state.isDarkMode && !state.isAccessibilityMode;
  const isAccess = state.isAccessibilityMode;

  return (
    <div id="main-content" className={`stadiumiq-root min-h-screen relative overflow-hidden flex flex-col ${
      isAccess ? 'bg-black text-white text-lg font-bold' : isDark ? 'bg-[#070b16] text-[#f3f6fa]' : 'bg-[#f0f4fa] text-[#0f1a30]'
    }`}>
      <style>{CSS_STYLES}</style>

      {/* Full Width Full Context Ball Transition Engine */}
      {transitionTarget && (
        <div role="presentation" className="fixed inset-0 z-50 pointer-events-none flex items-center bg-black/10 backdrop-blur-[1px]">
          <div className="w-full relative">
            <div className="animate-screen-roll absolute top-0 left-0">
              <SoccerBallIcon className="w-16 h-16 filter drop-shadow-lg" />
            </div>
          </div>
        </div>
      )}

      {/* Network offline system diagnostic bars */}
      {!isOnline && (
        <div className="bg-yellow-600 text-black text-center text-xs font-bold py-1 px-4 z-50 animate-fade-in" role="alert">
          Offline Mode Active. Cached operational schemas will synchronize dynamically upon reconnection.
        </div>
      )}

      {/* Real-time structural system broadcast updates marquee */}
      {state.lastBroadcast && (
        <div className="bg-blue-900 border-b border-blue-700 text-white text-xs px-4 py-2 flex justify-between items-center gap-2 font-medium z-30" aria-live="assertive">
          <div className="flex items-center gap-2">
            <span className="bg-blue-600 text-white font-bold px-2 py-0.5 rounded text-[10px] tracking-wide uppercase">Live Link</span>
            <span>{state.lastBroadcast}</span>
          </div>
          <button onClick={() => dispatch({ type: 'RECEIVE_BROADCAST', payload: '' })} className="text-white/70 hover:text-white font-bold text-sm px-1 rounded siq-focusable" aria-label="Dismiss Alert">✕</button>
        </div>
      )}

      {/* GLOBAL HEADER BAR - FIXED ACCORDING TO SPEC ARCHITECTURE */}
      <header style={{ backgroundColor: 'rgba(7, 11, 22, 0.94)' }} className="text-[#f3f6fa] border-b border-gray-800 z-40 sticky top-0 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          
          {/* Logo & Live Score Engine Container */}
          <div className="flex items-center gap-4">
            <h1 style={{ color: '#c9a227' }} className="text-xl font-black tracking-tighter uppercase cursor-pointer" onClick={() => handleRoleTransition('onboarding')}>
              Stadium<span className="text-white">IQ</span>
            </h1>

            {/* Live Match Scoreboard Element */}
            <div className="bg-slate-900 border border-slate-700/60 rounded px-2.5 py-1 flex items-center gap-2 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#e53e3e] animate-live-dot" />
              <span className="text-gray-400">USA</span>
              <span className="text-white font-mono bg-slate-950 px-1.5 rounded">2 - 1</span>
              <span className="text-gray-400">MEX</span>
            </div>
          </div>

          {/* Quick Context Control Switcher Toggles */}
          <div className="flex items-center gap-2 flex-wrap">
            
            {/* Context Navigation Dropdown Menu Selection */}
            {state.role !== 'onboarding' && (
              <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-700 p-1 rounded">
                <label htmlFor="global-role-switcher" className="sr-only">Switch Platform Persona View</label>
                <select
                  id="global-role-switcher"
                  value={state.role}
                  onChange={(e) => handleRoleTransition(e.target.value as AppState['role'])}
                  className="bg-transparent text-white text-xs font-bold py-1 px-2 border-0 outline-none focus:ring-0 cursor-pointer"
                >
                  <option value="fan" className="text-black">Fan Portal View</option>
                  <option value="organizer" className="text-black">Command Operations View</option>
                  <option value="volunteer" className="text-black">Staff / Volunteer View</option>
                </select>
                <button
                  onClick={() => handleRoleTransition('onboarding')}
                  className="bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold px-2 py-1 rounded transition-colors"
                >
                  Landing
                </button>
              </div>
            )}

            {/* Universal Mode Switch Toggles */}
            <button
              onClick={() => dispatch({ type: 'TOGGLE_DARK_MODE' })}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-xs transition-colors"
              aria-label="Toggle Adaptive System Contrast Theme Mode"
            >
              {state.isDarkMode ? '☀️ Light' : '🌙 Dark'}
            </button>

            <button
              onClick={() => dispatch({ type: 'TOGGLE_ACCESSIBILITY' })}
              className={`p-1.5 border rounded text-xs font-bold transition-all ${
                isAccess 
                  ? 'bg-[#e8c84a] text-black border-black ring-2 ring-white' 
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-white'
              }`}
              aria-label="Toggle High-Contrast Large Text Mode"
            >
              ♿ {isAccess ? 'Standard Font' : 'High Contrast'}
            </button>
          </div>
        </div>

        {/* Dynamic Global Running Stadium Headliner Ticker Stream */}
        <div className="h-[28px] bg-slate-950 border-t border-slate-900 flex items-center" role="presentation">
          <div className="shrink-0 bg-slate-950 px-3 text-[10px] font-black uppercase text-[#c9a227] tracking-wider border-r border-slate-900 h-full flex items-center z-10">
            METLIFE UPDATES
          </div>
          <div className="flex-1 overflow-hidden h-full flex items-center relative">
            <div className="animate-marquee whitespace-nowrap flex items-center gap-12 text-xs font-medium tracking-wide text-[#abc0d8]">
              <span>FIFA World Cup 2026 — MetLife Stadium, East Rutherford, NJ</span>
              <span>Match 82 | Group Stage | Gate B now open — reduced wait time 2.4 min</span>
              <span>Eco Impact: 1,240 kg waste diverted today — thank you fans</span>
              <span>AI Surge Forecast: Section 200 at 94% — volunteers dispatched</span>
              <span>Shuttle Service: Platform 3 departing in 8 min — Gate C exit recommended</span>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN RENDER ENGINE AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 relative z-10">
        {globalLoading ? (
          <SkeletonDisplayGrid isDark={isDark} />
        ) : (
          <SafeErrorBoundary>
            {state.role === 'onboarding' && <RoleSelectionLanding dispatch={handleRoleTransition} isDark={isDark} isAccess={isAccess} />}
            {state.role === 'fan' && <FanPortalView state={state} dispatch={dispatch} activeTab={activeTab} setActiveTab={setActiveTab} isDark={isDark} isAccess={isAccess} />}
            {state.role === 'organizer' && <CommandCenterView state={state} dispatch={dispatch} isDark={isDark} isAccess={isAccess} />}
            {state.role === 'volunteer' && <VolunteerPortalView state={state} dispatch={dispatch} activeTab={activeTab} setActiveTab={setActiveTab} isDark={isDark} isAccess={isAccess} />}
          </SafeErrorBoundary>
        )}
      </main>

      {/* STADIUMIQ STRUCTURAL FOOTER COMPONENT */}
      <footer className={`mt-auto border-t py-4 text-center text-xs transition-colors ${
        isAccess ? 'bg-black border-white text-white' : isDark ? 'bg-[#0e162b] border-gray-800 text-[#6c829e]' : 'bg-white border-gray-200 text-[#485a7e]'
      }`}>
        <div className="px-4 flex flex-col sm:flex-row justify-between items-center gap-2 max-w-7xl mx-auto">
          <p>© 2026 FIFA Operations Dashboard Hub — StadiumIQ Systems Ecosystem.</p>
          <div className="flex gap-4 font-semibold">
            <span>MetLife Security Verified</span>
            <span>v2.6-Live</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ============================================================================
// 5. SCREEN MODULE COMPONENT VIEW 1: LANDING & STRATEGIC HUB SELECTION
// ============================================================================

function RoleSelectionLanding({ dispatch, isDark, isAccess }: { dispatch: (role: AppState['role']) => void; isDark: boolean; isAccess: boolean }) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const cards = [
    { id: 'fan', label: 'Fan Portal', desc: 'Your game-day companion for navigation, AI assistance, and eco rewards', theme: 'border-amber-500/20', icon: '🎫' },
    { id: 'organizer', label: 'Command Center', desc: 'Command Center for real-time crowd intelligence and operations control', theme: 'border-blue-500/20', icon: '🎛️' },
    { id: 'volunteer', label: 'Volunteer / Staff', desc: 'Your shift briefing, task board, and SOP assistant', theme: 'border-emerald-500/20', icon: '📋' }
  ];

  return (
    <div className="relative py-8 px-2 flex flex-col items-center justify-center min-h-[75vh]">
      
      {/* 1. Onboarding Animated Field Base Map Backdrop */}
      {!isAccess && (
        <div role="presentation" className="absolute inset-0 z-0 pointer-events-none opacity-40 overflow-hidden rounded-2xl bg-[#001a4e]/10 border border-[#c9a227]/15">
          <svg className="w-full h-full" viewBox="0 0 800 500" preserveAspectRatio="none">
            {/* Structural Markings */}
            <rect width="800" height="500" fill="transparent" />
            <line x1="400" y1="0" x2="400" y2="500" stroke="#c9a227" strokeWidth="2" strokeOpacity="0.15" />
            <circle cx="400" cy="250" r="70" stroke="#c9a227" strokeWidth="2" strokeOpacity="0.15" fill="none" />
            <rect x="0" y="150" width="80" height="200" stroke="#c9a227" strokeWidth="2" strokeOpacity="0.15" fill="none" />
            <rect x="720" y="150" width="80" height="200" stroke="#c9a227" strokeWidth="2" strokeOpacity="0.15" fill="none" />
          </svg>
          
          {/* Scatter 6 Parameterized Multi-Arc Floating Soccer Ball Objects */}
          {Array.from({ length: ANIMATION_CONSTANTS.BALL_COUNT }).map((_, idx) => {
            const positions = [
              { top: '15%', left: '20%', del: '0s', dur: '9s' },
              { top: '25%', left: '70%', del: '-2s', dur: '12s' },
              { top: '65%', left: '15%', del: '-4s', dur: '14s' },
              { top: '75%', left: '80%', del: '-1s', dur: '10s' },
              { top: '45%', left: '45%', del: '-5s', dur: '11s' },
              { top: '80%', left: '48%', del: '-3s', dur: '13s' }
            ];
            const p = positions[idx];
            return (
              <div
                key={idx}
                className="animate-pitch-ball absolute opacity-25"
                style={{
                  top: p.top,
                  left: p.left,
                  animationDelay: p.del,
                  animationDuration: p.dur
                }}
              >
                <SoccerBallIcon className="w-8 h-8" />
              </div>
            );
          })}
        </div>
      )}

      {/* Main Structural Typography Title */}
      <div className="z-10 text-center mb-10 max-w-xl">
        <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
          FIFA WORLD CUP <span style={{ color: '#c9a227' }}>2026</span>
        </h2>
        <p className={`text-sm ${isAccess ? 'text-white' : 'text-[#485a7e]'} max-w-md mx-auto`}>
          Select operational mode node parameters to launch real-time coordination vectors inside MetLife Stadium infrastructure matrices.
        </p>
      </div>

      {/* Card Grid Setup */}
      <div className="z-10 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl px-4">
        {cards.map((c) => (
          <div
            key={c.id}
            onMouseEnter={() => setHoveredCard(c.id)}
            onMouseLeave={() => setHoveredCard(null)}
            className={`border rounded-xl p-6 transition-all relative flex flex-col justify-between group ${
              isAccess 
                ? 'bg-black border-white text-white border-4' 
                : isDark 
                  ? 'bg-[#0e162b] border-[#c9a227]/10 hover:border-[#c9a227]/40 text-white' 
                  : 'bg-white border-slate-200 hover:border-blue-500/40 text-slate-900 shadow-sm'
            }`}
          >
            <div>
              <div className="text-3xl mb-3" role="presentation">{c.icon}</div>
              <h3 className="text-xl font-bold mb-2 tracking-tight group-hover:text-[#c9a227] transition-colors">{c.label}</h3>
              <p className={`text-xs mb-6 leading-relaxed ${isAccess ? 'text-white' : isDark ? 'text-[#abc0d8]' : 'text-[#485a7e]'}`}>
                {c.desc}
              </p>
            </div>

            <button
              onClick={() => dispatch(c.id as AppState['role'])}
              className={`w-full py-2.5 px-4 font-bold rounded-lg text-xs tracking-wider uppercase transition-all ${
                isAccess 
                  ? 'bg-white text-black border-2 border-black focus:ring-4 focus:ring-yellow-400' 
                  : 'bg-[#001a4e] text-white hover:bg-opacity-90 shadow-md focus:ring-2 focus:ring-[#c9a227]'
              }`}
            >
              Enter As {c.label.split(' ')[0]}
            </button>

            {/* 2. Hover Ball Bounce Decoration */}
            {!isAccess && hoveredCard === c.id && (
              <div className="animate-card-hover-ball absolute bottom-3 right-3 opacity-90" role="presentation">
                <SoccerBallIcon className="w-6 h-6" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 6. SCREEN MODULE COMPONENT VIEW 2: FULL FAN INTERACTION PORTAL
// ============================================================================

function FanPortalView({ state, dispatch, activeTab, setActiveTab, isDark, isAccess }: {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  activeTab: string;
  setActiveTab: (t: string) => void;
  isDark: boolean;
  isAccess: boolean;
}) {
  const tabs = [
    { id: 'home', label: 'Dashboard', icon: '🏠' },
    { id: 'navigate', label: 'Indoor Wayfinding', icon: '🗺️' },
    { id: 'ai', label: 'AI Concierge', icon: '✨' },
    { id: 'ticket', label: 'My Ticket', icon: '🎟️' },
    { id: 'eco', label: 'Eco Earn', icon: '🌱' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      
      {/* Sidebar Navigation Matrix (Desktop / Tablet Screen Modes) */}
      <nav className="lg:col-span-1 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 border-b lg:border-b-0 lg:border-r border-slate-700/20" aria-label="Fan Portal Navigation Sub-tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap tracking-wide transition-all ${
              activeTab === t.id 
                ? (isAccess ? 'bg-white text-black border-2 border-black' : 'bg-[#c9a227] text-[#001a4e] shadow-sm')
                : (isAccess ? 'bg-black text-white border border-white hover:bg-slate-900' : isDark ? 'text-gray-300 hover:bg-slate-800/50' : 'text-slate-700 hover:bg-slate-200')
            }`}
            aria-current={activeTab === t.id ? 'page' : undefined}
          >
            <span role="presentation">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      {/* Main Subtab Dynamic Render Engine Wrapper */}
      <div className="lg:col-span-4 min-h-[60vh]">
        {activeTab === 'home' && <FanTabHome state={state} setActiveTab={setActiveTab} isDark={isDark} isAccess={isAccess} />}
        {activeTab === 'navigate' && <FanTabNavigate state={state} isDark={isDark} isAccess={isAccess} />}
        {activeTab === 'ai' && <FanTabAi isDark={isDark} isAccess={isAccess} />}
        {activeTab === 'ticket' && <FanTabTicket isDark={isDark} isAccess={isAccess} />}
        {activeTab === 'eco' && <FanTabEco state={state} dispatch={dispatch} isDark={isDark} isAccess={isAccess} />}
      </div>
    </div>
  );
}

// Subtab 2.A: Fan Dashboard Overview Panel
function FanTabHome({ state, setActiveTab, isDark, isAccess }: { state: AppState; setActiveTab: (t: string) => void; isDark: boolean; isAccess: boolean }) {
  const [showExitPlanner, setShowExitPlanner] = useState(false);
  const [exitDestination, setExitDestination] = useState('');
  const [exitPlanResult, setExitPlanResult] = useState('');
  const [accWheelchair, setAccWheelchair] = useState(state.accessibilityNeeds.wheelchair);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  const handleExitPlanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exitDestination.trim()) return;
    setExitPlanResult(`[AI-Generated] Optimized Routing Configuration Matrix identified: Exit via Gate C (lowest current congestion metric index: 2.4 min wait) → Board NJ Transit Shuttle Express directly at Meadowlands Station Terminal Platform 2 → Projected destination ETA: 48 minutes total.`);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Advisory Warnings Component Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`p-4 border rounded-xl ${isAccess ? 'border-red-600 bg-black' : 'bg-red-950/20 border-red-500/30'}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-red-600 text-white font-bold rounded text-[10px] tracking-wide uppercase">CONGESTION LEVEL HIGH</span>
            <span className="text-xs font-mono text-red-400">Section 200 Concourse</span>
          </div>
          <p className="text-xs text-white">Crowd limits are reaching 94% density threshold flags. Use secondary peripheral exit routes via Gate C corridor segments.</p>
        </div>

        <div className={`p-4 border rounded-xl ${isAccess ? 'border-green-600 bg-black' : 'bg-green-950/20 border-green-500/30'}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-green-600 text-white font-bold rounded text-[10px] tracking-wide uppercase">FAST TRACK OPEN</span>
            <span className="text-xs font-mono text-green-400">Gate B Security Lines</span>
          </div>
          <p className="text-xs text-white">Current entry/clearance tracking processing cycles sit optimal at ~2.4 mins total transit latency parameters.</p>
        </div>
      </div>

      {/* Primary Row Content Widgets Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Widget 1: Digital Seating Overview Ticket Snapshot */}
        <div className={`p-5 rounded-xl border md:col-span-1 flex flex-col justify-between ${isDark ? 'bg-[#0e162b] border-[#c9a227]/10' : 'bg-white border-slate-200'}`}>
          <div>
            <h4 className="text-xs font-black text-[#c9a227] tracking-wider uppercase mb-3">Live Digital Token</h4>
            <div className="text-2xl font-black mb-1">MATCH 82</div>
            <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-slate-600'} space-y-0.5 font-semibold`}>
              <div>Section 212, Row 12</div>
              <div>Seat Allocation: 4</div>
              <div>Designated Entrance Vector: Gate B</div>
            </div>
          </div>
          <button onClick={() => setActiveTab('ticket')} className="mt-4 w-full text-center py-2 bg-slate-800 text-white hover:bg-slate-700 rounded text-xs font-bold tracking-wide transition-colors">
            Expand Secure Barcode
          </button>
        </div>

        {/* Widget 2: Predictive AI Vendor Queue Intelligence Systems */}
        <div className={`p-5 rounded-xl border md:col-span-2 ${isDark ? 'bg-[#0e162b] border-[#c9a227]/10' : 'bg-white border-slate-200'}`}>
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-xs font-black text-[#c9a227] tracking-wider uppercase">Concession Wait Diagnostics</h4>
            <span className="text-[10px] text-gray-400 font-mono">Refreshed 30s ago</span>
          </div>
          <div className="space-y-2.5">
            {[
              { name: 'Halal Bites Express (Sec 112)', wait: '3 min queue', status: 'Optimal Flow', bg: 'bg-green-600' },
              { name: 'Jersey Burger Grills (Sec 204)', wait: '18 min queue', status: 'Saturated', bg: 'bg-red-600' },
              { name: 'Trophy Tacos Hub (Sec 118)', wait: '7 min queue', status: 'Normal Flow', bg: 'bg-amber-600' }
            ].map((v, i) => (
              <div key={i} className="flex justify-between items-center text-xs border-b border-gray-700/20 pb-1.5 last:border-0">
                <span className="font-semibold">{v.name}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-gray-400">{v.wait}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] text-white font-bold ${v.bg}`}>{v.status}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-[#c9a227] font-semibold italic bg-amber-500/5 p-2 rounded border border-amber-500/10">
            💡 AI Operational Tip: Halal Bites queue is optimized. Avoid Jersey Burger segment channels until the 80th-minute operational reset windows.
          </p>
        </div>
      </div>

      {/* Post Match Intelligent AI Exit Route Terminal Planner */}
      <div className={`p-5 rounded-xl border ${isDark ? 'bg-[#0e162b] border-[#c9a227]/10' : 'bg-white border-slate-200'}`}>
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <div>
            <h4 className="text-sm font-black tracking-tight flex items-center gap-2">
              🚨 Plan My Exit Matrix <GenAiBadge />
            </h4>
            <p className="text-xs text-gray-400">Calculate high-efficiency escape trajectories mitigating active stadium outer congestion trends.</p>
          </div>
          <button
            onClick={() => setShowExitPlanner(!showExitPlanner)}
            className="px-4 py-1.5 bg-[#001a4e] text-white font-bold text-xs rounded-lg hover:bg-opacity-90 transition-all shadow"
          >
            {showExitPlanner ? 'Collapse Panel' : 'Initialize Planner'}
          </button>
        </div>

        {showExitPlanner && (
          <form onSubmit={handleExitPlanSubmit} className="space-y-4 border-t border-gray-700/20 pt-4">
            <div>
              <label htmlFor="exit-dest-input" className="block text-xs font-bold mb-1 text-gray-300">Terminal Transit Target Destination</label>
              <div className="flex gap-2">
                <input
                  id="exit-dest-input"
                  type="text"
                  placeholder="e.g. Times Square, JFK Airport, Newark Penn Station"
                  value={exitDestination}
                  onChange={(e) => setExitDestination(sanitizeText(e.target.value))}
                  className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs flex-1 outline-none focus:border-[#c9a227]"
                />
                <button type="submit" className="px-4 py-1.5 bg-[#c9a227] text-[#001a4e] font-bold text-xs rounded-lg hover:bg-opacity-90 transition-all">
                  Compute Vectors
                </button>
              </div>
            </div>

            {exitPlanResult && (
              <div className="p-3 bg-slate-950 border border-amber-500/30 rounded-lg text-xs font-medium text-amber-200 leading-relaxed">
                {exitPlanResult}
              </div>
            )}
          </form>
        )}
      </div>

      {/* Collapsible Cross-Platform Accessibility Needs Registration Segment */}
      <div className={`p-5 rounded-xl border ${isDark ? 'bg-[#0e162b] border-[#c9a227]/10' : 'bg-white border-slate-200'}`}>
        <h4 className="text-sm font-bold tracking-tight mb-2">♿ Adaptive Accessibility Registration Matrix</h4>
        <p className="text-xs text-gray-400 mb-4">Flags configured here dynamically pass parameters into live supervisor dispatch modules for ground tactical support.</p>
        
        <div className="flex flex-col gap-2.5 max-w-md">
          <label className="flex items-center gap-2.5 text-xs font-bold cursor-pointer">
            <input
              type="checkbox"
              checked={accWheelchair}
              onChange={(e) => setAccWheelchair(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0 w-4 h-4"
            />
            <span>Require Wheelchair-Accessible Optimized Route Overlays</span>
          </label>

          <button
            onClick={() => {
              setRegisteredSuccess(true);
              setTimeout(() => setRegisteredSuccess(false), 3000);
            }}
            className="w-48 mt-2 py-1.5 bg-slate-800 text-white hover:bg-slate-700 rounded font-bold text-xs tracking-wider uppercase transition-colors"
          >
            Save Parameter Config
          </button>
          
          {registeredSuccess && (
            <div className="text-xs text-green-500 font-bold mt-1">✓ Settings operationalized. Ground staff briefing metrics synced.</div>
          )}
        </div>
      </div>

    </div>
  );
}

// Subtab 2.B: Indoor BLE Wayfinding Optimization Map Engine (Completed)
function FanTabNavigate({ state: _state, isDark, isAccess: _isAccess }: { readonly state: AppState; readonly isDark: boolean; readonly isAccess: boolean }) {
  const [rssiVal, setRssiVal] = useState(-52);
  const [walkProgress, setWalkProgress] = useState(0);
  const [accessibleOverlay, setAccessibleOverlay] = useState(false);

  // Dynamic BLE Beacon metrics derivation loops
  const calculatedDistance = useMemo(() => calculateBleDistance(rssiVal), [rssiVal]);
  const userCoordinates = useMemo(() => {
    const factor = walkProgress / 100;
    const baseCoords = mockTrilaterate(Math.abs(rssiVal), 60, 45);
    return {
      x: baseCoords.x + Math.floor(factor * 60),
      y: baseCoords.y + Math.floor(Math.sin(factor * Math.PI) * 40)
    };
  }, [rssiVal, walkProgress]);

  return (
    <div className="space-y-6">
      
      {/* Top Map Configuration Control Toggles */}
      <div className="flex justify-between items-center bg-slate-900/40 p-3 rounded-xl border border-slate-700/30 flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-bold">BLE Wayfinding & Space Mapping</h3>
          <p className="text-[11px] text-gray-400">Simulating live spatial matrix calculation vectors over MetLife coordinates.</p>
        </div>
        <label className="flex items-center gap-2 bg-purple-900/30 border border-purple-500/40 px-3 py-1 rounded-lg text-xs font-bold text-purple-200 cursor-pointer">
          <input
            type="checkbox"
            checked={accessibleOverlay}
            onChange={(e) => setAccessibleOverlay(e.target.checked)}
            className="rounded text-purple-600 focus:ring-0"
          />
          <span>Show Wheelchair Routes</span>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* SVG Interactive Render Map Canvas Area */}
        <div className={`md:col-span-2 border rounded-xl p-4 flex flex-col items-center justify-center min-h-[340px] ${isDark ? 'bg-slate-950 border-gray-800' : 'bg-slate-100 border-gray-200'}`}>
          <div className="w-full text-left mb-2 text-[10px] font-mono tracking-wider text-gray-400">METLIFE SECTOR SCENARIO MATRIX LAYOUT</div>
          
          <div className="relative w-full max-w-[400px] h-[300px] bg-slate-900/90 rounded-xl border border-slate-700 overflow-hidden shadow-inner">
            <svg className="w-full h-full" viewBox="0 0 400 300" aria-label="Stadium map schematic outlining paths and zones">
              {/* Perimeter Rings */}
              <circle cx="200" cy="150" r="130" stroke="#485a7e" strokeWidth="2" strokeDasharray="4" fill="none" opacity="0.3" />
              <circle cx="200" cy="150" r="90" stroke="#485a7e" strokeWidth="1" fill="none" opacity="0.4" />
              
              {/* Central Playing Field Representation */}
              <rect x="140" y="100" width="120" height="100" rx="6" fill="#00a651" fillOpacity="0.15" stroke="#00a651" strokeWidth="1" />
              <circle cx="200" cy="150" r="20" stroke="#00a651" strokeWidth="1" strokeOpacity="0.3" fill="none" />

              {/* Core Security Infrastructure Gates */}
              <circle cx="80" cy="150" r="8" fill="#e53e3e" fillOpacity="0.7" />
              <text x="76" y="138" fill="#ffffff" fontSize="9" fontWeight="bold">Gate A</text>

              <circle cx="320" cy="150" r="8" fill="#00a651" fillOpacity="0.7" />
              <text x="316" y="138" fill="#ffffff" fontSize="9" fontWeight="bold">Gate B</text>

              {/* 5-Second Parameterized Heatmap Density Blocks */}
              <rect x="75" y="60" width="70" height="40" fill="#e53e3e" fillOpacity="0.35" rx="4" />
              <rect x="250" y="60" width="70" height="40" fill="#dd6b20" fillOpacity="0.35" rx="4" />
              <rect x="165" y="220" width="70" height="40" fill="#00a651" fillOpacity="0.25" rx="4" />

              {/* Overlay Accessible Corridors If Toggled */}
              {accessibleOverlay && (
                <path d="M 80 150 Q 140 70 200 150 T 320 150" fill="none" stroke="#a855f7" strokeWidth="3" strokeDasharray="6 4" className="opacity-90" />
              )}

              {/* Dynamic User Location Matrix Node Pointer Dot */}
              <circle cx={userCoordinates.x} cy={userCoordinates.y} r="7" fill="#3182ce" className="transition-all duration-300 ring-4 ring-blue-500/30" />
              <circle cx={userCoordinates.x} cy={userCoordinates.y} r="2" fill="#ffffff" />
            </svg>

            {/* Static Spatial Meta Tooltips */}
            <div className="absolute bottom-2 left-2 bg-slate-950/90 text-[10px] font-mono p-1.5 rounded border border-slate-800 text-gray-300">
              User Vector Position: X: {userCoordinates.x}px | Y: {userCoordinates.y}px
            </div>
          </div>
        </div>

        {/* Diagnostic Control & Slider Mock System Panels */}
        <div className="space-y-4 md:col-span-1 text-xs">
          <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#0e162b] border-[#c9a227]/10' : 'bg-white border-slate-200'}`}>
            <h4 className="text-xs font-black text-[#c9a227] tracking-wider uppercase mb-3">Telemetry Control Engine</h4>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between font-mono mb-1">
                  <span>Simulated RSSI (Gate B)</span>
                  <span className="text-amber-400 font-bold">{rssiVal} dBm</span>
                </div>
                <input
                  type="range"
                  min="-90"
                  max="-30"
                  value={rssiVal}
                  onChange={(e) => setRssiVal(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded outline-none appearance-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-mono mb-1">
                  <span>Walk simulator progress</span>
                  <span className="text-blue-400 font-bold">{walkProgress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={walkProgress}
                  onChange={(e) => setWalkProgress(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded outline-none appearance-none cursor-pointer"
                />
              </div>

              <div className="pt-2 border-t border-gray-700/20 font-mono text-[10.5px] space-y-1.5 text-gray-400">
                <div>Path Loss Distance: <span className="text-white font-bold">{calculatedDistance.toFixed(2)}m</span></div>
                <div>Beacons Scanned: <span className="text-green-400">3 Online</span></div>
                <div>Grid Coordinate Resolution: <span className="text-white">100x100</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Subtab 2.C: Fan AI chatbot concierge
function FanTabAi({ isDark, isAccess: _isAccess }: { readonly isDark: boolean; readonly isAccess: boolean }) {
  const [messages, setMessages] = useState<{ id: string; sender: 'user' | 'ai'; text: string }[]>([
    { id: '1', sender: 'ai', text: '[AI-Generated] Welcome to MetLife Stadium. I am your World Cup AI Companion. How can I assist with your seating, food, or exit logistics today?' }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [lang, setLang] = useState('en');
  const [isListening, setIsListening] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const userMsg = { id: Date.now().toString(), sender: 'user' as const, text: inputVal };
    const replyText = getAiResponse('fan', inputVal, lang);
    const aiReply = { id: (Date.now() + 1).toString(), sender: 'ai' as const, text: replyText };

    setMessages(prev => [...prev, userMsg, aiReply]);
    setInputVal('');
  };

  const handleSpeechInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser environment. Recommend Chrome/Edge.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'ar' ? 'ar-SA' : lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : lang === 'pt' ? 'pt-BR' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);
    recognition.start();

    recognition.onresult = (event: any) => {
      const speechText = event.results[0][0].transcript;
      setInputVal(speechText);
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
  };

  return (
    <div className={`rounded-xl border p-5 space-y-4 flex flex-col h-[500px] ${isDark ? 'bg-[#0e162b] border-[#c9a227]/10' : 'bg-white border-slate-200'}`}>
      <div className="flex justify-between items-center border-b border-gray-700/20 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold">Multilingual AI Concierge</h3>
          <GenAiBadge />
        </div>
        
        {/* Language select row */}
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-white text-[10px] font-bold rounded p-1 outline-none"
        >
          <option value="en">🇺🇸 EN (English)</option>
          <option value="ar">🇸🇦 AR (العربية)</option>
          <option value="fr">🇫🇷 FR (Français)</option>
          <option value="es">🇪🇸 ES (Español)</option>
          <option value="pt">🇵🇹 PT (Português)</option>
        </select>
      </div>

      {/* Message window */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] rounded-xl px-3.5 py-2 text-xs font-semibold leading-relaxed ${
              m.sender === 'user'
                ? 'bg-[#001a4e] text-white rounded-br-none'
                : 'bg-slate-800/60 border border-slate-700/50 text-[#f3f6fa] rounded-bl-none'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input controls form */}
      <form onSubmit={handleSend} className="flex gap-2">
        <button
          type="button"
          onClick={handleSpeechInput}
          className={`px-3 py-2 rounded-lg border text-sm transition-all focus:ring-0 ${
            isListening 
              ? 'bg-red-600 text-white border-red-500 animate-pulse'
              : 'bg-slate-800 hover:bg-slate-700 text-gray-300 border-slate-700'
          }`}
          aria-label="Voice input"
        >
          🎙️
        </button>
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(sanitizeText(e.target.value))}
          placeholder="Ask AI directions, concessions advice..."
          className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-[#c9a227]"
        />
        <button type="submit" className="px-4 py-2 bg-[#c9a227] text-[#001a4e] font-black text-xs rounded-lg hover:bg-opacity-90 transition-all uppercase tracking-wider">
          Send
        </button>
      </form>
      
      {/* Collapsible prompt transparency inspector */}
      <details className="text-[9.5px] border-t border-gray-700/20 pt-2 text-gray-400 font-mono">
        <summary className="cursor-pointer font-bold text-amber-500/70 hover:text-amber-400">RAG Prompt & Embeddings Transparency Inspector</summary>
        <div className="mt-2 space-y-1 bg-slate-950 p-2 rounded border border-slate-800">
          <div>System Prompt Context Template: <span className="text-white">{"{stadium_faq_embeddings}"}</span></div>
          <div>Retrieved Vector Score (Cosine Similarity): <span className="text-green-400 font-bold">0.8742</span></div>
          <div>Matched pgvector segment ID: <span className="text-white font-bold">faq_metlife_concessions_112</span></div>
        </div>
      </details>
    </div>
  );
}

// Subtab 2.D: Digital Verified QR ticket card
function FanTabTicket({ isDark, isAccess: _isAccess }: { readonly isDark: boolean; readonly isAccess: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
      <div className={`rounded-2xl border p-6 max-w-sm w-full space-y-5 shadow-xl relative overflow-hidden ${isDark ? 'bg-[#0e162b] border-[#c9a227]/20 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-[#001a4e] via-[#c9a227] to-[#00a651]" />
        
        <div className="text-left border-b border-gray-700/20 pb-3 flex justify-between items-center">
          <div>
            <h3 className="font-display font-black text-lg">StadiumIQ Ticket</h3>
            <p className="text-[10px] text-gray-400 tracking-widest uppercase">FIFA World Cup 2026</p>
          </div>
          <span className="bg-[#00a651]/20 text-[#00c863] border border-[#00c863]/30 px-2 py-0.5 rounded text-[9px] font-bold uppercase">Verified</span>
        </div>

        <div className="space-y-1 font-mono text-xs text-left">
          <div className="flex justify-between"><span>Match:</span><span className="font-bold text-slate-900 dark:text-white">Group Stage - Match 82</span></div>
          <div className="flex justify-between"><span>Venue:</span><span className="font-bold text-slate-900 dark:text-white">MetLife Stadium</span></div>
          <div className="flex justify-between"><span>Section:</span><span className="font-bold text-slate-900 dark:text-white">212</span></div>
          <div className="flex justify-between"><span>Row / Seat:</span><span className="font-bold text-slate-900 dark:text-white">12 / 4</span></div>
          <div className="flex justify-between"><span>Entry Gate:</span><span className="font-bold text-[#e8c84a]">Gate B</span></div>
        </div>

        {/* Mock barcode SVG */}
        <div className="bg-white p-3.5 rounded-lg flex flex-col items-center justify-center border border-slate-200">
          <svg className="w-48 h-12" viewBox="0 0 100 24" fill="none" stroke="#000000" strokeWidth="2" aria-hidden="true" role="presentation">
            <line x1="2" y1="2" x2="2" y2="22" strokeWidth="3" />
            <line x1="8" y1="2" x2="8" y2="22" strokeWidth="1" />
            <line x1="12" y1="2" x2="12" y2="22" strokeWidth="4" />
            <line x1="20" y1="2" x2="20" y2="22" strokeWidth="2" />
            <line x1="25" y1="2" x2="25" y2="22" strokeWidth="1" />
            <line x1="32" y1="2" x2="32" y2="22" strokeWidth="3" />
            <line x1="38" y1="2" x2="38" y2="22" strokeWidth="2" />
            <line x1="44" y1="2" x2="44" y2="22" strokeWidth="4" />
            <line x1="52" y1="2" x2="52" y2="22" strokeWidth="1" />
            <line x1="58" y1="2" x2="58" y2="22" strokeWidth="3" />
            <line x1="64" y1="2" x2="64" y2="22" strokeWidth="2" />
            <line x1="72" y1="2" x2="72" y2="22" strokeWidth="4" />
            <line x1="80" y1="2" x2="80" y2="22" strokeWidth="2" />
            <line x1="86" y1="2" x2="86" y2="22" strokeWidth="1" />
            <line x1="92" y1="2" x2="92" y2="22" strokeWidth="3" />
          </svg>
          <span className="text-[8px] font-mono text-slate-800 tracking-widest mt-1">SIQ-FIFA2026-M82-SEC212</span>
        </div>

        <p className="text-[10px] text-gray-400">Keep screen brightness at max for seamless gate scanner operational processing.</p>
      </div>
    </div>
  );
}

// Subtab 2.E: Eco Earn Tab - Sustainability Gamification
function FanTabEco({ state, dispatch, isDark, isAccess: _isAccess }: { readonly state: AppState; readonly dispatch: React.Dispatch<Action>; readonly isDark: boolean; readonly isAccess: boolean }) {
  const [wasteInput, setWasteInput] = useState('');
  const [wasteResult, setWasteResult] = useState<{ bin: string; instruction: string } | null>(null);
  const [showVoucher, setShowVoucher] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');

  const xpProgressPct = useMemo(() => {
    return (state.ecoPoints % 100);
  }, [state.ecoPoints]);

  const treeValue = useMemo(() => {
    // Carbon offset metric conversion: carbonOffsetKg / 21.77
    const cumulativeCarbon = 1240 + state.ecoPoints * 0.45;
    return Math.floor(cumulativeCarbon / 21.77);
  }, [state.ecoPoints]);

  const handleEcoAction = (actionPoints: number) => {
    dispatch({ type: 'ADD_ECO_POINTS', payload: actionPoints });
  };

  const handleWasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wasteInput.trim()) return;
    const res = classifyWaste(wasteInput);
    setWasteResult(res);
  };

  const handleRedeem = (cost: number, code: string) => {
    if (state.ecoPoints >= cost) {
      dispatch({ type: 'ADD_ECO_POINTS', payload: -cost });
      setVoucherCode(code);
      setShowVoucher(true);
    } else {
      alert("Insufficient Eco Points balance. Perform more green actions!");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Celebration animation trigger overlay */}
      <GoalCelebration active={state.triggerLevelBurst} onComplete={() => dispatch({ type: 'RESET_BURST' })} />

      {/* Top Points Diagnostic Dashboard Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Eco points balance card */}
        <div className={`p-5 rounded-xl border relative overflow-hidden flex flex-col justify-between ${isDark ? 'bg-[#0e162b] border-[#c9a227]/20' : 'bg-white border-slate-200'}`}>
          <div>
            <h4 className="text-xs font-black text-[#c9a227] tracking-wider uppercase mb-2">XP Progress Matrix</h4>
            <div className="flex justify-between items-end mb-1">
              <span className="text-3xl font-black">{state.ecoPoints} <span className="text-xs text-gray-400">Points</span></span>
              <span className="text-xs font-bold text-[#c9a227]">Level {state.xpLevel}</span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full h-2 rounded bg-slate-800 overflow-hidden mt-2" role="presentation">
              <div className="h-full bg-gradient-to-r from-green-500 to-[#c9a227] transition-all duration-500" style={{ width: `${xpProgressPct}%` }} />
            </div>
            <div className="flex justify-between text-[9px] text-gray-400 font-mono mt-1">
              <span>{state.ecoPoints % 100} / 100 XP</span>
              <span>Next Levelup: {100 - (state.ecoPoints % 100)} pts</span>
            </div>
          </div>
        </div>

        {/* Live carbon offsets counters card */}
        <div className={`p-5 rounded-xl border relative overflow-hidden flex flex-col justify-between ${isDark ? 'bg-[#0e162b] border-[#c9a227]/20' : 'bg-white border-slate-200'}`}>
          <div>
            <h4 className="text-xs font-black text-[#00a651] tracking-wider uppercase mb-2">Carbon Footprint Live Counter</h4>
            <div className="text-2xl font-black text-[#00c863]">{1240 + state.ecoPoints * 0.45} kg CO₂ <span className="text-xs text-gray-400">Saved</span></div>
            <p className="text-[11px] text-[#abc0d8] font-bold mt-2">
              🌳 Today's carbon offset equals planting {treeValue} trees.
            </p>
          </div>
        </div>
      </div>

      {/* Sustainability QR Simulator Actions */}
      <div className={`p-5 rounded-xl border ${isDark ? 'bg-[#0e162b] border-[#c9a227]/10' : 'bg-white border-slate-200'}`}>
        <h4 className="text-xs font-black text-[#c9a227] tracking-wider uppercase mb-3">QR Check-in simulator</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Public Transit', pts: 30, code: 'TRANSIT' },
            { label: 'Recycling Station', pts: 50, code: 'RECYCLE' },
            { label: 'Water Refill Station', pts: 15, code: 'WATER' },
            { label: 'Sponsor green booth', pts: 20, code: 'SPONSOR' }
          ].map((action, i) => (
            <button
              key={i}
              onClick={() => handleEcoAction(action.pts)}
              className="py-3 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 text-center transition-all hover:scale-[1.01] shadow"
            >
              <div>{action.label}</div>
              <div className="text-[#00c863] text-[10px] mt-1">+{action.pts} pts</div>
            </button>
          ))}
        </div>
      </div>

      {/* AI Waste Segregation Assistant */}
      <div className={`p-5 rounded-xl border ${isDark ? 'bg-[#0e162b] border-[#c9a227]/10' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-2 mb-3">
          <h4 className="text-xs font-black text-[#c9a227] tracking-wider uppercase">AI Waste Segregation Assistant</h4>
          <GenAiBadge />
        </div>
        
        <form onSubmit={handleWasteSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Type trash description, e.g. plastic bottle, apple peel..."
            value={wasteInput}
            onChange={(e) => setWasteInput(sanitizeText(e.target.value))}
            className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-[#c9a227]"
          />
          <button type="submit" className="px-4 py-2 bg-green-600 text-white font-bold text-xs rounded-lg hover:bg-green-500 transition-all uppercase tracking-wider">
            Classify
          </button>
        </form>

        {wasteResult && (
          <div className="mt-3 p-3 bg-slate-950 border border-green-500/20 rounded-lg flex items-center justify-between gap-3 text-xs">
            <div>
              <div className="font-bold text-white mb-0.5">Bin Classification Mapping Result</div>
              <p className="text-gray-400 text-[11px]">{wasteResult.instruction}</p>
            </div>
            <span className={`px-3 py-1.5 rounded-lg text-black font-black uppercase text-[10px] tracking-wider ${
              wasteResult.bin === 'Green' ? 'bg-green-400' :
              wasteResult.bin === 'Blue' ? 'bg-blue-400' :
              wasteResult.bin === 'Brown' ? 'bg-amber-700 text-white' :
              'bg-slate-300'
            }`}>
              {wasteResult.bin} Bin
            </span>
          </div>
        )}
      </div>

      {/* Leaderboard and Rewards Redemption Panel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Reward Store */}
        <div className={`p-5 rounded-xl border ${isDark ? 'bg-[#0e162b] border-[#c9a227]/10' : 'bg-white border-slate-200'}`}>
          <h4 className="text-xs font-black text-[#c9a227] tracking-wider uppercase mb-3">Redeem Rewards Vouchers</h4>
          <div className="space-y-3">
            {[
              { id: '1', title: 'Free Halal Hot Dog Coupon', cost: 100, code: 'HDOG-FREE-2026' },
              { id: '2', title: '20% off Tournament Official Merchandise', cost: 150, code: 'MERCH-20-SIQ' }
            ].map((v) => (
              <div key={v.id} className="flex justify-between items-center text-xs border-b border-gray-700/20 pb-2.5 last:border-0 last:pb-0">
                <div>
                  <div className="font-bold">{v.title}</div>
                  <div className="text-[10px] text-gray-400">{v.cost} Eco Points required</div>
                </div>
                <button
                  onClick={() => handleRedeem(v.cost, v.code)}
                  className="px-3.5 py-1.5 bg-[#c9a227] text-[#001a4e] font-black rounded text-[10px] tracking-wider uppercase hover:bg-opacity-95"
                >
                  Redeem
                </button>
              </div>
            ))}
          </div>

          {showVoucher && (
            <div className="mt-4 p-4 bg-white border border-slate-200 rounded-lg text-black text-center space-y-3 animate-fade-in relative">
              <button onClick={() => setShowVoucher(false)} className="absolute top-2 right-2 text-slate-500 font-bold hover:text-black">✕</button>
              <h5 className="font-bold text-sm">Voucher Activated!</h5>
              <div className="font-mono text-lg font-black bg-slate-100 py-1.5 rounded tracking-widest">{voucherCode}</div>
              
              {/* Vouchers scannable barcode mock */}
              <div className="flex justify-center py-1">
                <svg className="w-32 h-8" viewBox="0 0 100 24" fill="none" stroke="#000" strokeWidth="2" role="presentation" aria-hidden="true">
                  <line x1="5" y1="2" x2="5" y2="22" strokeWidth="3" />
                  <line x1="12" y1="2" x2="12" y2="22" strokeWidth="1" />
                  <line x1="18" y1="2" x2="18" y2="22" strokeWidth="4" />
                  <line x1="28" y1="2" x2="28" y2="22" strokeWidth="2" />
                  <line x1="35" y1="2" x2="35" y2="22" strokeWidth="1" />
                  <line x1="45" y1="2" x2="45" y2="22" strokeWidth="3" />
                  <line x1="55" y1="2" x2="55" y2="22" strokeWidth="2" />
                  <line x1="65" y1="2" x2="65" y2="22" strokeWidth="4" />
                  <line x1="75" y1="2" x2="75" y2="22" strokeWidth="1" />
                  <line x1="85" y1="2" x2="85" y2="22" strokeWidth="3" />
                </svg>
              </div>
              <p className="text-[9px] text-slate-500">Scan at concession registers to redeem your voucher.</p>
            </div>
          )}
        </div>

        {/* Global Sustainability Leaderboard */}
        <div className={`p-5 rounded-xl border ${isDark ? 'bg-[#0e162b] border-[#c9a227]/10' : 'bg-white border-slate-200'}`}>
          <h4 className="text-xs font-black text-[#c9a227] tracking-wider uppercase mb-3">Green Fans Leaderboard</h4>
          <div className="space-y-2.5">
            {[
              { rank: 1, name: 'EcoPioneer2026', pts: 420, lvl: 5 },
              { rank: 2, name: 'GreenSteward_USA', pts: 380, lvl: 4 },
              { rank: 3, name: 'SustFan82', pts: 310, lvl: 4 },
              { rank: 4, name: 'EcoWarriorX', pts: 250, lvl: 3 },
              { rank: 5, name: 'TrophyGoldRecycle', pts: 180, lvl: 2 }
            ].map((usr) => (
              <div key={usr.rank} className="flex justify-between items-center text-xs font-mono pb-1 border-b border-gray-700/10 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#c9a227] w-4">{usr.rank}</span>
                  <span className="text-[var(--text-primary)] font-bold">{usr.name}</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-gray-400">Lvl {usr.lvl}</span>
                  <span className="text-[#00c863] font-bold">{usr.pts} pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}

// ============================================================================
// 7. SCREEN MODULE COMPONENT VIEW 3: FULL ORGANIZER dashboard (COMMAND CENTER)
// ============================================================================

function CommandCenterView({ state, dispatch, isDark, isAccess: _isAccess }: {
  readonly state: AppState;
  readonly dispatch: React.Dispatch<Action>;
  readonly isDark: boolean;
  readonly isAccess: boolean;
}) {
  const [matchSeconds, setMatchSeconds] = useState(4452); // Starts ~74th min
  const [evacConfirm, setEvacConfirm] = useState(false);
  const [evacActive, setEvacActive] = useState(false);

  // Live match clock loop
  useEffect(() => {
    const timer = setInterval(() => setMatchSeconds(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatMatchClock = (sec: number) => {
    const mm = Math.floor(sec / 60);
    const ss = sec % 60;
    return `${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
  };

  const openIncidents = state.incidents.filter(i => i.status !== 'Completed');
  const medicalCount = openIncidents.filter(i => i.severity === 'Critical' || i.severity === 'High').length;

  const handleStatusUpdate = (id: string, newStatus: Incident['status']) => {
    // Modify status dispatch directly
    dispatch({ type: 'TOGGLE_TASK', payload: { id, status: newStatus as any } });
  };

  const handleEvacTrigger = () => {
    setEvacConfirm(false);
    setEvacActive(true);
    // Broadcast emergency state
    dispatch({ type: 'RECEIVE_BROADCAST', payload: "[CRITICAL DISPATCH] EVACUATION PROTOCOL ACTIVE. Clear Gate A and route outbound flow through Gate C." });
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Dashboard Top Metric Bar */}
      <div className={`p-4 rounded-xl border flex items-center justify-between flex-wrap gap-4 ${isDark ? 'bg-[#0e162b] border-[#c9a227]/20' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <h3 className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">MetLife Match Clock</h3>
            <div className="text-xl font-mono font-black text-[#c9a227]">{formatMatchClock(matchSeconds)}</div>
          </div>
          <div>
            <h3 className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Live Attendance Ratio</h3>
            <div className="text-sm font-bold text-white">68,000 / 82,500 <span className="text-[10px] text-gray-400 font-normal">(82.4%)</span></div>
          </div>
          <div>
            <h3 className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Gate Security Status</h3>
            <span className="px-2 py-0.5 bg-[#00a651] text-white font-bold rounded text-[9px] uppercase tracking-wide">All Gates Operational</span>
          </div>
        </div>

        {/* Global Evacuation protocol button */}
        <button
          onClick={() => setEvacConfirm(true)}
          className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black text-xs rounded-xl transition-all shadow-md focus:ring-4 focus:ring-red-400 animate-pulse"
        >
          🚨 Initiate Evacuation
        </button>
      </div>

      {/* Emergency confirmation dialog modal */}
      {evacConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in" role="dialog" aria-modal="true" aria-label="Confirm Emergency Action">
          <div className="bg-[#0e162b] border border-red-500 p-6 rounded-xl max-w-sm w-full text-center space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-red-500 uppercase tracking-wider">Activate Stadium Evacuation Plan</h3>
            <p className="text-xs text-gray-300 leading-relaxed">This will execute automated crowd redirect signals, broadcast emergency warning banners, and assign volunteers to safety paths.</p>
            <div className="flex gap-3">
              <button onClick={() => setEvacConfirm(false)} className="flex-1 py-2 bg-slate-800 text-white font-bold rounded text-xs hover:bg-slate-700 transition-colors">Cancel</button>
              <button onClick={handleEvacTrigger} className="flex-1 py-2 bg-red-600 text-white font-bold rounded text-xs hover:bg-red-500 transition-colors">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Evacuation plan panel segment */}
      {evacActive && (
        <div className="p-5 border border-red-500 bg-red-950/20 rounded-xl space-y-3 animate-fade-in" role="alert">
          <h4 className="text-red-400 font-black text-sm uppercase tracking-widest flex items-center gap-2">🚨 [AI-Generated Evacuation Plan] — Execute Mode Live</h4>
          <p className="text-xs text-red-200">Recommended Sequenced Strategy: Open all Gate C routes immediately. Direct Concourse 200 staff volunteers to outer stairs. Projected clearance matrix: 18.5 minutes total.</p>
          <button onClick={() => setEvacActive(false)} className="px-3 py-1 bg-red-800 text-white text-[10px] font-bold rounded hover:bg-red-700">Dismiss Plan</button>
        </div>
      )}

      {/* AI predictive status and occupancy metrics details */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Crowd pulse rings card */}
        <div className="rounded-xl border border-slate-700/40 bg-slate-900/60 p-4 relative overflow-hidden flex flex-col justify-between min-h-[110px]">
          <div className="flex justify-between items-center mb-2 z-10">
            <span className="text-[9px] font-black uppercase text-[#6c829e] tracking-wider">Crowd Density</span>
            <span className="px-1.5 py-0.5 bg-amber-600 text-white font-black rounded text-[8px] tracking-wide uppercase">Warning</span>
          </div>
          <p className="font-display font-black text-3xl text-white z-10 mt-1">82%</p>
          <p className="text-[9px] text-[#6c829e] z-10">Live Overall Grid Occupancy</p>
          <CrowdPulseRing occupancy={82} />
        </div>

        {/* Incidents counter */}
        <div className="rounded-xl border border-slate-700/40 bg-slate-900/60 p-4 flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center gap-1 text-red-400 mb-2">
            <span className="text-[9px] font-black uppercase text-[#6c829e] tracking-wider">Active Alerts</span>
          </div>
          <p className="font-display font-black text-3xl text-red-400 mt-1">{openIncidents.length}</p>
          <p className="text-[9.5px] text-gray-400 font-semibold mt-1">
            {medicalCount} critical • 0 infrastructure
          </p>
        </div>

        {/* Volunteer active ratios */}
        <div className="rounded-xl border border-slate-700/40 bg-slate-900/60 p-4 flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center gap-1 text-[#c9a227] mb-2">
            <span className="text-[9px] font-black uppercase text-[#6c829e] tracking-wider">Staffing Levels</span>
          </div>
          <p className="font-display font-black text-3xl text-[#c9a227] mt-1">34 / 50</p>
          <p className="text-[9.5px] text-gray-400 font-semibold mt-1">
            8 Standby • 26 on shift assignments
          </p>
        </div>

        {/* Live wait-times diagnostic matrix */}
        <div className="rounded-xl border border-slate-700/40 bg-slate-900/60 p-4 flex flex-col justify-between min-h-[110px]">
          <span className="text-[9px] font-black uppercase text-[#6c829e] tracking-wider mb-2">Queue Wait Times</span>
          <div className="space-y-1.5">
            {[
              { gate: 'A', wait: '18.4 min', pct: 90, color: 'bg-red-500' },
              { gate: 'B', wait: '2.4 min',  pct: 20, color: 'bg-green-500' },
              { gate: 'C', wait: '6.1 min',  pct: 45, color: 'bg-blue-500' }
            ].map((g) => (
              <div key={g.gate} className="flex items-center gap-2 text-[8px] font-semibold text-gray-400">
                <span className="w-3">{g.gate}</span>
                <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden" role="presentation">
                  <div className={`h-full rounded-full ${g.color}`} style={{ width: `${g.pct}%` }} />
                </div>
                <span className="text-white text-right w-10">{g.wait}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* LSTM Forecast SVG area chart and AI Advisory panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Forecast Chart */}
        <div className={`md:col-span-2 p-5 rounded-xl border ${isDark ? 'bg-[#0e162b] border-[#c9a227]/10' : 'bg-white border-slate-200'}`}>
          <h4 className="text-xs font-black text-[#c9a227] tracking-wider uppercase mb-4">LSTM Crowd Surge Forecast (60 Min Projection)</h4>
          
          <div className="h-44 w-full flex items-center justify-center">
            {/* Custom pure SVG Area line chart projection mapping */}
            <svg className="w-full h-full overflow-visible" viewBox="0 0 200 100" preserveAspectRatio="none">
              <path d="M 10 90 Q 40 40 80 80 T 150 20 L 190 60 L 190 90 Z" fill="#c9a227" fillOpacity="0.1" stroke="#c9a227" strokeWidth="2" />
              <line x1="10" y1="90" x2="190" y2="90" stroke="#485a7e" strokeWidth="1" />
              <line x1="10" y1="10" x2="10" y2="90" stroke="#485a7e" strokeWidth="1" />
              <text x="100" y="98" fill="#abc0d8" fontSize="6" textAnchor="middle">Minutes from now (LSTM Forecasts)</text>
              <text x="5" y="50" fill="#abc0d8" fontSize="6" textAnchor="middle" transform="rotate(-90 5 50)">Occupancy (%)</text>
            </svg>
          </div>
        </div>

        {/* Command Advisor */}
        <div className={`md:col-span-1 p-5 rounded-xl border flex flex-col justify-between ${isDark ? 'bg-[#0e162b] border-[#c9a227]/10' : 'bg-white border-slate-200'}`}>
          <div>
            <h4 className="text-xs font-black text-[#c9a227] tracking-wider uppercase mb-2 flex items-center gap-1.5">
              <span>🎛️ Operations advisor</span> <GenAiBadge />
            </h4>
            <p className="text-xs text-gray-400 mb-4">Generates localized crowd redirect and steward deployment parameters.</p>
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg text-xs leading-relaxed text-slate-300">
              {getAiResponse('organizer', 'surge')}
            </div>
          </div>
          
          {/* Quick recommendations action prompt list */}
          <div className="space-y-1.5 mt-4">
            <div className="text-[10px] font-bold text-[#abc0d8] uppercase">Recommended Action:</div>
            <button className="w-full text-left py-1.5 px-3.5 bg-slate-800 hover:bg-slate-700 rounded text-xs text-white transition-colors">Reroute incoming flows to Gate C</button>
            <button className="w-full text-left py-1.5 px-3.5 bg-slate-800 hover:bg-slate-700 rounded text-xs text-white transition-colors">Broadcast exit advisories to Sec 200</button>
          </div>
        </div>
      </div>

      {/* Incident table log queue */}
      <div className={`p-5 rounded-xl border ${isDark ? 'bg-[#0e162b] border-[#c9a227]/10' : 'bg-white border-slate-200'}`}>
        <h4 className="text-xs font-black text-[#c9a227] tracking-wider uppercase mb-3">Steward Incident Queue Log</h4>
        
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left" aria-label="Incident logs table">
            <thead>
              <tr className="border-b border-gray-700/20 text-gray-400">
                <th scope="col" className="pb-2">ID</th>
                <th scope="col" className="pb-2">Description</th>
                <th scope="col" className="pb-2">Location</th>
                <th scope="col" className="pb-2">Severity</th>
                <th scope="col" className="pb-2">Status</th>
                <th scope="col" className="pb-2">Time</th>
                <th scope="col" className="pb-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {state.incidents.map((inc) => (
                <tr key={inc.id} className={`border-b border-gray-700/10 hover:bg-slate-800/10 transition-colors ${inc.severity === 'High' && inc.isNew ? 'animate-red-card' : ''}`}>
                  <td className="py-2.5 font-mono">{inc.id}</td>
                  <td className="py-2.5 max-w-[200px] truncate">{inc.description}</td>
                  <td className="py-2.5">{inc.location}</td>
                  <td className="py-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      inc.severity === 'Critical' || inc.severity === 'High' ? 'bg-red-900/30 text-red-400 border border-red-500/20' : 'bg-slate-800 text-gray-300'
                    }`}>
                      {inc.severity}
                    </span>
                  </td>
                  <td className="py-2.5 font-semibold text-amber-500">{inc.status}</td>
                  <td className="py-2.5 font-mono text-gray-400">{inc.timestamp}</td>
                  <td className="py-2.5 text-right">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => handleStatusUpdate(inc.id, 'In Progress')} className="px-2 py-1 bg-slate-800 text-white rounded text-[10px] hover:bg-slate-700">Assign</button>
                      <button onClick={() => handleStatusUpdate(inc.id, 'Completed')} className="px-2 py-1 bg-green-900/40 text-green-400 rounded text-[10px] hover:bg-green-900/60">Resolve</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

// ============================================================================
// 8. SCREEN MODULE COMPONENT VIEW 4: VOLUNTEER & FIELD STAFF PORTAL
// ============================================================================

function VolunteerPortalView({ state, dispatch, activeTab, setActiveTab, isDark, isAccess }: {
  readonly state: AppState;
  readonly dispatch: React.Dispatch<Action>;
  readonly activeTab: string;
  readonly setActiveTab: (t: string) => void;
  readonly isDark: boolean;
  readonly isAccess: boolean;
}) {
  const tabs = [
    { id: 'briefing', label: 'Briefing', icon: '📋' },
    { id: 'tasks', label: 'Shift Tasks', icon: '✔️' },
    { id: 'sop', label: 'SOP Manuals', icon: '❓' },
    { id: 'report', label: 'Report Incident', icon: '🚨' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Horizontal Nav Tabs */}
      <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Volunteer Portal Subnavigation Options">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === t.id
                ? (isAccess ? 'bg-white text-black border-2 border-black' : 'bg-[#c9a227] text-[#001a4e]')
                : (isAccess ? 'bg-black text-white border border-white' : isDark ? 'bg-slate-900 hover:bg-slate-800 text-gray-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700')
            }`}
            aria-current={activeTab === t.id ? 'page' : undefined}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </nav>

      {/* Dynamic Subview Frame */}
      <div className="min-h-[50vh]">
        {activeTab === 'briefing' && <VolunteerTabBriefing state={state} isDark={isDark} isAccess={isAccess} />}
        {activeTab === 'tasks' && <VolunteerTabTasks state={state} dispatch={dispatch} isDark={isDark} isAccess={isAccess} />}
        {activeTab === 'sop' && <VolunteerTabSop isDark={isDark} isAccess={isAccess} />}
        {activeTab === 'report' && <VolunteerTabReport dispatch={dispatch} isDark={isDark} isAccess={isAccess} />}
      </div>
    </div>
  );
}

// Subtab 4.A: AI Shift Briefing View
function VolunteerTabBriefing({ state: _state, isDark, isAccess: _isAccess }: { readonly state: AppState; readonly isDark: boolean; readonly isAccess: boolean }) {
  return (
    <div className="space-y-6">
      
      {/* Shift Overview briefing text card */}
      <div className={`p-5 rounded-xl border ${isDark ? 'bg-[#0e162b] border-[#c9a227]/10' : 'bg-white border-slate-200'}`}>
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-xs font-black text-[#c9a227] tracking-wider uppercase">AI Generated Shift Briefing</h4>
          <GenAiBadge />
        </div>
        <div className="space-y-4 text-xs leading-relaxed">
          <p>Assignment Target: <span className="font-bold text-white">Section 200 Concourse Portal</span></p>
          <p>Sector Occupancy Surge Metrics: Section 200 currently registers at 94% capacity. Locals routing signals deployed to push overflow to Gate C exits.</p>
          <p>Seeding Access Needs: Wheelchair registration identified at Row 12, Seat 4. Ensure egress clear of queue barricades.</p>
        </div>
      </div>

      {/* Location telemetry display */}
      <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#0e162b] border-slate-800' : 'bg-white border-slate-200'} text-xs font-mono space-y-1.5`}>
        <div className="font-bold text-[#c9a227]">BLE Position Coordinator</div>
        <div className="text-gray-400">Position grid tracking coordinates: <span className="text-white font-bold">X: 182 | Y: 74 (Sec 200 Portal)</span></div>
        <div className="text-gray-400">System check-in status: <span className="text-green-500 font-bold">Automatic BLE Sync Completed</span></div>
      </div>
    </div>
  );
}

// Subtab 4.B: Volunteer Checklist Tasks View
function VolunteerTabTasks({ state, dispatch, isDark, isAccess: _isAccess }: { readonly state: AppState; readonly dispatch: React.Dispatch<Action>; readonly isDark: boolean; readonly isAccess: boolean }) {
  const handleTaskToggle = (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'pending' ? 'in_progress' : currentStatus === 'in_progress' ? 'completed' : 'pending';
    dispatch({ type: 'TOGGLE_TASK', payload: { id, status: nextStatus } });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-[#abc0d8]">Assigned Task Checklist Board</h3>
      
      {state.tasks.map((task) => (
        <div
          key={task.id}
          className={`p-4 border rounded-xl flex items-center justify-between gap-4 transition-all ${
            task.status === 'completed' 
              ? 'border-green-500/20 bg-[#00a651]/5 opacity-80' 
              : isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                task.priority === 'High' ? 'bg-red-900/30 text-red-400' : 'bg-slate-800 text-slate-300'
              }`}>
                {task.priority} Priority
              </span>
              <span className="text-[10px] text-gray-400 font-mono font-bold">{task.id}</span>
            </div>
            <p className={`text-xs font-bold ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-white'}`}>
              {task.label}
            </p>
          </div>

          {/* Toggle status control button */}
          <button
            onClick={() => handleTaskToggle(task.id, task.status)}
            className="flex items-center justify-center p-1 rounded-full border border-slate-700 bg-slate-800 hover:bg-slate-700 focus:ring-0"
            aria-label={`Advance status for task ${task.id}`}
          >
            <WhistleAnimation active={task.status === 'completed'} />
          </button>
        </div>
      ))}
    </div>
  );
}

// Subtab 4.C: SOP Interactive Assistant chatbot RAG
function VolunteerTabSop({ isDark, isAccess: _isAccess }: { readonly isDark: boolean; readonly isAccess: boolean }) {
  const [messages, setMessages] = useState<{ id: string; sender: 'user' | 'ai'; text: string }[]>([
    { id: '1', sender: 'ai', text: '[SOP Help] Systems active. Enter keyword terms (e.g., lost child, medical aid, fire hazard) to pull real-time pgvector relevance scores and protocol listings.' }
  ]);
  const [inputVal, setInputVal] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const userMsg = { id: Date.now().toString(), sender: 'user' as const, text: inputVal };
    const replyText = getAiResponse('volunteer', inputVal);
    const aiReply = { id: (Date.now() + 1).toString(), sender: 'ai' as const, text: replyText };

    setMessages(prev => [...prev, userMsg, aiReply]);
    setInputVal('');
  };

  return (
    <div className={`rounded-xl border p-5 space-y-4 flex flex-col h-[420px] ${isDark ? 'bg-[#0e162b] border-[#c9a227]/10' : 'bg-white border-slate-200'}`}>
      <div className="flex items-center gap-2 border-b border-gray-700/20 pb-3">
        <h3 className="text-sm font-bold">Standard Operating Procedures Assistant</h3>
        <GenAiBadge />
      </div>

      {/* Message window */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs font-semibold leading-relaxed ${
              m.sender === 'user'
                ? 'bg-[#001a4e] text-white rounded-br-none'
                : 'bg-slate-800/60 border border-slate-700/50 text-[#f3f6fa] rounded-bl-none'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input controls form */}
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(sanitizeText(e.target.value))}
          placeholder="Type query terms, e.g. medical, lost child, fire..."
          className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-[#c9a227]"
        />
        <button type="submit" className="px-4 py-2 bg-[#c9a227] text-[#001a4e] font-black text-xs rounded-lg hover:bg-opacity-90 transition-all uppercase tracking-wider">
          Query
        </button>
      </form>
      
      {/* Collapsible prompt transparency inspector */}
      <details className="text-[9.5px] border-t border-gray-700/20 pt-2 text-gray-400 font-mono">
        <summary className="cursor-pointer font-bold text-amber-500/70 hover:text-amber-400">pgvector RAG Embeddings Inspector</summary>
        <div className="mt-2 space-y-1 bg-slate-950 p-2 rounded border border-slate-800">
          <div>Prompt Vector Space: <span className="text-white">{"{sop_database_embeddings}"}</span></div>
          <div>Retrieved Vector relevance score: <span className="text-green-400 font-bold">0.9124</span></div>
          <div>pgvector matched segment: <span className="text-white font-bold">sop_protocol_14a_lost_child</span></div>
        </div>
      </details>
    </div>
  );
}

// Subtab 4.D: Report Incident Validated Form
function VolunteerTabReport({ dispatch, isDark, isAccess: _isAccess }: { readonly dispatch: React.Dispatch<Action>; readonly isDark: boolean; readonly isAccess: boolean }) {
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [severity, setSeverity] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [successMsg, setSuccessMsg] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !location.trim()) {
      alert("Please fill in both the description and location fields before submitting!");
      return;
    }

    const payload: Incident = {
      id: `INC-${Math.floor(100 + Math.random() * 900)}`,
      description: sanitizeText(description),
      location: sanitizeText(location),
      severity,
      status: 'Pending',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isNew: true
    };

    dispatch({ type: 'ADD_INCIDENT', payload });
    setDescription('');
    setLocation('');
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);
  };

  return (
    <div className={`p-5 rounded-xl border ${isDark ? 'bg-[#0e162b] border-[#c9a227]/15' : 'bg-white border-slate-200'}`}>
      <h3 className="text-sm font-bold uppercase tracking-wider mb-2 text-[#c9a227]">Report New Operational Incident</h3>
      <p className="text-xs text-gray-400 mb-4">Alerts sent here directly propagate into central operations queues in real time.</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="inc-desc" className="block text-xs font-bold text-gray-300 mb-1">Incident description / Details</label>
          <textarea
            id="inc-desc"
            rows={3}
            placeholder="Describe what you observed (e.g. liquid spill, crowd backup)..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-[#c9a227]"
            required
          />
        </div>

        <div>
          <label htmlFor="inc-loc" className="block text-xs font-bold text-gray-300 mb-1">Specific location / Zone</label>
          <input
            id="inc-loc"
            type="text"
            placeholder="e.g. Gate A Escalator ramp, Section 212 entrance corridor"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-[#c9a227]"
            required
          />
        </div>

        <div>
          <label htmlFor="inc-sev" className="block text-xs font-bold text-gray-300 mb-1">Severity Rating</label>
          <select
            id="inc-sev"
            value={severity}
            onChange={(e) => setSeverity(e.target.value as any)}
            className="bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 outline-none focus:border-[#c9a227] w-48 cursor-pointer"
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg uppercase tracking-wider transition-colors shadow-md"
        >
          Submit to Command Center
        </button>

        {successMsg && (
          <div className="text-xs text-green-500 font-bold text-center">✓ Incident submitted successfully. Broadcasted to central logs.</div>
        )}
      </form>
    </div>
  );
}
