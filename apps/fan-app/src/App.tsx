import { useState, useEffect } from "react";
import { 
  Home, 
  MapPin, 
  MessageSquare, 
  Ticket, 
  Sparkles, 
  Compass, 
  User, 
  ChevronRight, 
  Send, 
  AlertTriangle, 
  Languages,
  Leaf,
  Award,
  QrCode,
  Gift,
  Trophy,
  Activity
} from "lucide-react";
import clsx from "clsx";

interface EcoBalance {
  ecoPoints: number;
  fanXP: number;
  transactions: any[];
  badges: any[];
}

interface ChatMessage {
  role: string;
  text: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"home" | "navigate" | "assistant" | "ticket" | "eco">("home");
  
  // Phase 8 Sustainability & Gamification State
  const [ecoBalance, setEcoBalance] = useState<EcoBalance>({
    ecoPoints: 240,
    fanXP: 480,
    transactions: [],
    badges: []
  });
  const [challenges, setChallenges] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    wasteSavedKg: 1424.8,
    carbonOffsetKg: 2950.4,
    waterRefills: 4390,
    transitRides: 6810
  });

  const [sortingInput, setSortingInput] = useState("");
  const [sortingOutput, setSortingOutput] = useState("");
  const [activeVoucher, setActiveVoucher] = useState<{ title: string; code: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [chatMessage, setChatMessage] = useState("");
  const [chatLogs, setChatLogs] = useState<ChatMessage[]>([
    { role: "assistant", text: "Welcome to MetLife Stadium! I am your StadiumIQ AI Assistant. How can I help you today?" }
  ]);
  const [showInspector, setShowInspector] = useState(false);
  const [activeBroadcast, setActiveBroadcast] = useState<{ title: string; message: string; severity: string } | null>(null);
  const [walkProgress, setWalkProgress] = useState(25); // 25% along the wayfinding track

  // Coordinates of reference beacons (MetLife Lobby grid)
  const beaconA = { id: "BCN-112-A", x: 10, y: 15, name: "Gate A Beacon" };
  const beaconB = { id: "BCN-112-B", x: 90, y: 15, name: "Gate B Beacon" };
  const beaconC = { id: "BCN-112-C", x: 50, y: 85, name: "Sec 212 Beacon" };

  // Calculate coordinates along Bezier wayfinding curve: Gate B (92, 50) -> Concourse (60, 75) -> Your Seat (30, 55)
  const t = walkProgress / 100;
  const userTrueX = (1 - t) * (1 - t) * 92 + 2 * (1 - t) * t * 60 + t * t * 30;
  const userTrueY = (1 - t) * (1 - t) * 50 + 2 * (1 - t) * t * 75 + t * t * 55;

  // Real physical distance to beacons
  const distA = Math.sqrt((userTrueX - beaconA.x) ** 2 + (userTrueY - beaconA.y) ** 2);
  const distB = Math.sqrt((userTrueX - beaconB.x) ** 2 + (userTrueY - beaconB.y) ** 2);
  const distC = Math.sqrt((userTrueX - beaconC.x) ** 2 + (userTrueY - beaconC.y) ** 2);

  // Convert distance to RSSI with a simulated sine wave noise
  const getNoisyRSSI = (dist: number, seed: number) => {
    const rawRSSI = -20 * Math.log10(dist || 1) - 30; // A = -30 dBm at 1m in 100x100 relative grid
    const noise = Math.sin(Date.now() / 1500 + seed) * 1.5;
    return Math.round(rawRSSI + noise);
  };

  const rssiA = getNoisyRSSI(distA, 1);
  const rssiB = getNoisyRSSI(distB, 2);
  const rssiC = getNoisyRSSI(distC, 3);

  // Convert noisy RSSI back to estimated distance
  const estDistA = 10 ** ((-30 - rssiA) / 20);
  const estDistB = 10 ** ((-30 - rssiB) / 20);
  const estDistC = 10 ** ((-30 - rssiC) / 20);

  // Trilaterate 3 distance circles to get calculated (x, y)
  const triangulate = (
    x1: number, y1: number, d1: number,
    x2: number, y2: number, d2: number,
    x3: number, y3: number, d3: number
  ) => {
    const A_coeff = 2 * (x3 - x1);
    const B_coeff = 2 * (y3 - y1);
    const C_coeff = d1 * d1 - d3 * d3 - x1 * x1 + x3 * x3 - y1 * y1 + y3 * y3;

    const D_coeff = 2 * (x3 - x2);
    const E_coeff = 2 * (y3 - y2);
    const F_coeff = d2 * d2 - d3 * d3 - x2 * x2 + x3 * x3 - y2 * y2 + y3 * y3;

    const det = A_coeff * E_coeff - B_coeff * D_coeff;
    if (Math.abs(det) < 0.001) {
      return { x: (x1 + x2 + x3) / 3, y: (y1 + y2 + y3) / 3 };
    }
    const calcX = (C_coeff * E_coeff - B_coeff * F_coeff) / det;
    const calcY = (A_coeff * F_coeff - C_coeff * D_coeff) / det;
    return {
      x: Math.max(5, Math.min(95, calcX)),
      y: Math.max(5, Math.min(95, calcY))
    };
  };

  const triangulatedPos = triangulate(
    beaconA.x, beaconA.y, estDistA,
    beaconB.x, beaconB.y, estDistB,
    beaconC.x, beaconC.y, estDistC
  );

  useEffect(() => {
    // Establish WebSocket alerts connection
    const ws = new WebSocket("ws://localhost:3002");
    
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "SAFETY_BROADCAST") {
          setActiveBroadcast({
            title: payload.title,
            message: payload.message,
            severity: payload.severity
          });
        }
      } catch (err) {
        console.error("WebSocket message parsing failed:", err);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  // --- PHASE 8: SUSTAINABILITY & GAMIFICATION HANDLERS ---
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchEcoData = () => {
    fetch("http://localhost:3002/api/v1/sustainability/points/balance")
      .then(res => res.json())
      .then(envelope => {
        if (envelope.success && envelope.data) {
          setEcoBalance({
            ecoPoints: envelope.data.ecoPoints,
            fanXP: envelope.data.fanXP,
            transactions: envelope.data.transactions,
            badges: envelope.data.badges
          });
        }
      })
      .catch(err => console.warn("Eco points API fallback enabled:", err.message));

    fetch("http://localhost:3002/api/v1/sustainability/challenges")
      .then(res => res.json())
      .then(envelope => {
        if (envelope.success && envelope.data) {
          setChallenges(envelope.data);
        }
      })
      .catch(err => console.warn("Challenges API fallback enabled:", err.message));

    fetch("http://localhost:3002/api/v1/sustainability/rewards")
      .then(res => res.json())
      .then(envelope => {
        if (envelope.success && envelope.data) {
          setRewards(envelope.data);
        }
      })
      .catch(err => console.warn("Rewards API fallback enabled:", err.message));

    fetch("http://localhost:3002/api/v1/sustainability/leaderboard")
      .then(res => res.json())
      .then(envelope => {
        if (envelope.success && envelope.data) {
          setLeaderboard(envelope.data);
        }
      })
      .catch(err => console.warn("Leaderboard API fallback enabled:", err.message));

    fetch("http://localhost:3002/api/v1/sustainability/metrics")
      .then(res => res.json())
      .then(envelope => {
        if (envelope.success && envelope.data) {
          setMetrics(envelope.data);
        }
      })
      .catch(err => console.warn("Metrics API fallback enabled:", err.message));
  };

  useEffect(() => {
    if (activeTab === "eco") {
      fetchEcoData();
    }
  }, [activeTab]);

  const handleQrCheckin = (type: "transit" | "sponsor" | "water" | "recycling") => {
    fetch("http://localhost:3002/api/v1/sustainability/qr/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        qrCode: `QR-SIM-${type.toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`,
        locationType: type
      })
    })
      .then(res => res.json())
      .then(envelope => {
        if (envelope.success && envelope.data) {
          triggerToast(`Check-in Success! Earned +${envelope.data.pointsEarned} Eco Points & +${envelope.data.xpEarned} XP!`);
          fetchEcoData();
        }
      })
      .catch(err => {
        console.warn("QR checkin failed, running simulated award offline:", err.message);
        const mockAwards = {
          transit: { pts: 30, desc: "Public Transit Commute" },
          sponsor: { pts: 20, desc: "Sponsor Booth Check-in" },
          water: { pts: 15, desc: "Water Refill Station Check-in" },
          recycling: { pts: 50, desc: "Waste Recycling Station Log" }
        };
        const award = mockAwards[type];
        setEcoBalance((prev: EcoBalance) => ({
          ...prev,
          ecoPoints: prev.ecoPoints + award.pts,
          fanXP: prev.fanXP + award.pts * 2
        }));
        triggerToast(`Check-in Success! Earned +${award.pts} Eco Points (Offline Fallback)`);
      });
  };

  const handleWasteSortingCheck = () => {
    if (!sortingInput.trim()) return;
    const waste = sortingInput.toLowerCase();
    let instruction = "Eco Waste Guide: Please throw this in the Obsidian General Waste bin.";
    if (waste.includes("bottle") || waste.includes("plastic") || waste.includes("cup")) {
      instruction = "Recycle: Place in the GREEN recycling bin. Earn +50 Eco Points on scan!";
    } else if (waste.includes("can") || waste.includes("aluminum") || waste.includes("soda")) {
      instruction = "Recycle: Place in the SILVER can bin. Earn +50 Eco Points on scan!";
    } else if (waste.includes("cardboard") || waste.includes("box") || waste.includes("paper")) {
      instruction = "Recycle: Place in the BLUE paper bin. Earn +50 Eco Points on scan!";
    } else if (waste.includes("food") || waste.includes("apple") || waste.includes("organic") || waste.includes("hotdog")) {
      instruction = "Compost: Place in the BROWN compost/organic bin. Reduces landfill carbon emissions.";
    }
    setSortingOutput(instruction);
  };

  const handleRedeemReward = (rewardId: string, title: string) => {
    fetch("http://localhost:3002/api/v1/sustainability/rewards/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rewardId })
    })
      .then(res => res.json())
      .then(envelope => {
        if (envelope.success && envelope.data) {
          setActiveVoucher({
            title,
            code: envelope.data.voucherCode
          });
          fetchEcoData();
        } else {
          triggerToast(envelope.error?.message || "Redemption failed.");
        }
      })
      .catch(err => {
        console.warn("Redemption API failed, running simulated redemption:", err.message);
        setActiveVoucher({
          title,
          code: `VOUCH-MOCK-${Math.random().toString(36).substring(3, 9).toUpperCase()}`
        });
        triggerToast("Redeemed successfully (Offline Fallback)");
      });
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    const userMsg = chatMessage;
    setChatLogs((prev: ChatMessage[]) => [...prev, { role: "user", text: userMsg }]);
    setChatMessage("");

    // Simulate AI response based on query keywords
    setTimeout(() => {
      let reply = "I'm checking that for you in the stadium database.";
      if (userMsg.toLowerCase().includes("halal") || userMsg.toLowerCase().includes("food")) {
        reply = "The nearest halal concession is 'Halal Bites' located in the West Concourse near Section 112. Walking distance is approximately 4 minutes from your current location.";
      } else if (userMsg.toLowerCase().includes("gate") || userMsg.toLowerCase().includes("crowd")) {
        reply = "Gate A is currently experiencing high congestion (92% occupancy). I recommend using Gate B, which is clear and has an estimated wait time of under 3 minutes.";
      }
      setChatLogs((prev: ChatMessage[]) => [...prev, { role: "assistant", text: reply }]);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-bg-base text-text-primary flex flex-col items-center justify-start pb-20 select-none">
      {/* Target device shell for mobile testing, wraps nicely on desktop */}
      <div className="w-full max-w-[480px] min-h-screen flex flex-col bg-bg-surface/20 border-x border-border-subtle relative">
        {/* Toast Alert overlay */}
        {toastMessage && (
          <div className="absolute top-4 left-4 right-4 bg-brand-green-deep/95 border border-brand-gold/40 text-text-primary px-4 py-3 rounded-md text-xs font-semibold shadow-lg backdrop-blur-md flex items-center justify-between z-50 animate-bounce">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-[10px] uppercase font-bold text-brand-gold hover:text-text-primary">Dismiss</button>
          </div>
        )}

        {/* Voucher Modal overlay */}
        {activeVoucher && (
          <div className="absolute inset-0 bg-bg-base/85 flex items-center justify-center p-6 z-50 backdrop-blur-sm">
            <div className="glass-panel p-6 rounded-md border border-brand-gold/30 bg-bg-surface max-w-[320px] w-full text-center">
              <span className="text-[10px] bg-brand-gold/15 text-brand-gold px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                Voucher Redeemed!
              </span>
              <h4 className="font-outfit font-bold text-sm mt-3">{activeVoucher.title}</h4>
              
              <div className="w-36 h-36 bg-white p-2 rounded-sm my-4 mx-auto flex items-center justify-center border">
                <div className="w-full h-full border border-bg-base border-dashed flex flex-col items-center justify-center text-bg-base">
                  <span className="text-[8px] font-mono font-bold">SCAN VOUCHER</span>
                  <QrCode className="w-16 h-16 my-1 text-brand-green-deep" />
                  <span className="text-[8px] font-mono font-bold">{activeVoucher.code}</span>
                </div>
              </div>

              <p className="text-[10px] text-text-secondary">Scan this code at concessions/tickets to claim your reward.</p>
              
              <button 
                onClick={() => setActiveVoucher(null)}
                className="mt-4 bg-brand-gold hover:bg-brand-gold/90 text-bg-base text-xs font-bold py-2 px-4 rounded-md w-full transition-colors duration-150"
              >
                Close Voucher
              </button>
            </div>
          </div>
        )}
        {/* Header */}
        <header className="h-16 px-4 border-b border-border-subtle flex justify-between items-center bg-bg-surface/50 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-sm bg-brand-green-deep border border-brand-gold flex items-center justify-center">
              <Compass className="w-4 h-4 text-brand-gold" />
            </div>
            <div>
              <span className="font-outfit font-extrabold text-sm tracking-wide">StadiumIQ</span>
              <span className="text-[8px] bg-brand-gold/10 text-brand-gold px-1.5 py-0.5 rounded font-bold uppercase ml-2 tracking-wider">PWA</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 rounded-full hover:bg-bg-elevated text-text-secondary hover:text-text-primary transition-colors duration-150">
              <Languages className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-full bg-brand-green-deep/30 border border-brand-gold/30 flex items-center justify-center">
              <User className="w-4 h-4 text-brand-gold" />
            </div>
          </div>
        </header>

        {activeBroadcast && (
          <div className={clsx(
            "p-3 text-xs text-text-primary flex flex-col gap-1 border-b z-30 sticky top-16",
            activeBroadcast.severity === "high" && "bg-alert-danger/25 border-alert-danger/45 text-text-primary",
            activeBroadcast.severity === "medium" && "bg-alert-warning/25 border-alert-warning/45 text-text-primary",
            activeBroadcast.severity === "low" && "bg-alert-success/25 border-alert-success/45 text-text-primary"
          )}>
            <div className="flex justify-between items-center font-bold">
              <span className="flex items-center gap-1.5 uppercase">
                <AlertTriangle className="w-3.5 h-3.5 text-brand-gold animate-pulse" />
                {activeBroadcast.title}
              </span>
              <button 
                onClick={() => setActiveBroadcast(null)}
                className="text-text-secondary hover:text-text-primary text-[10px] font-bold"
              >
                Dismiss
              </button>
            </div>
            <p className="text-text-secondary">{activeBroadcast.message}</p>
          </div>
        )}

        {/* Content Views */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          
          {/* VIEW: HOME */}
          {activeTab === "home" && (
            <div className="space-y-4 animate-fade-in">
              {/* Alert banner for high crowd occupancy */}
              <div className="glass-panel p-4 rounded-md border border-alert-warning/30 bg-alert-warning/5 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-alert-warning shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-alert-warning">Surge Advisory: Gate A Congestion</p>
                  <p className="text-text-secondary mt-1">Gate A is at 92% capacity. AI directs all section 200 ticketholders to Gate B for faster entry.</p>
                </div>
              </div>

              {/* Digital Ticket summary widget */}
              <div 
                className="glass-panel p-5 rounded-md relative overflow-hidden bg-gradient-to-br from-brand-green-deep/20 via-bg-surface/80 to-bg-surface border border-brand-green-light/20 cursor-pointer"
                onClick={() => setActiveTab("ticket")}
              >
                <div className="absolute right-[-10px] top-[-10px] w-24 h-24 rounded-full bg-brand-gold/5 border border-brand-gold/5" />
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] bg-brand-gold/15 text-brand-gold px-2 py-0.5 rounded font-bold uppercase tracking-wider">FIFA World Cup 2026</span>
                    <h3 className="font-outfit font-extrabold text-base mt-2">ROUND OF 16</h3>
                    <p className="text-[10px] text-text-secondary mt-0.5">METLIFE STADIUM — MATCH 82</p>
                  </div>
                  <Ticket className="w-6 h-6 text-brand-gold" />
                </div>
                <div className="grid grid-cols-3 gap-2 mt-5 border-t border-border-subtle/50 pt-4 text-center">
                  <div>
                    <p className="text-[9px] text-text-secondary uppercase">SEC</p>
                    <p className="text-sm font-outfit font-bold text-text-primary">212</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-text-secondary uppercase">ROW</p>
                    <p className="text-sm font-outfit font-bold text-text-primary">12</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-text-secondary uppercase">SEAT</p>
                    <p className="text-sm font-outfit font-bold text-text-primary">4</p>
                  </div>
                </div>
              </div>

              {/* Wayfinding directions trigger widget */}
              <div 
                className="glass-panel p-4.5 rounded-md flex justify-between items-center hover:bg-bg-elevated/20 transition-all duration-200 cursor-pointer border border-border-subtle"
                onClick={() => setActiveTab("navigate")}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold">A11y Indoor Navigation</p>
                    <p className="text-[10px] text-text-secondary">Find toilets, snacks, and access paths</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-text-tertiary" />
              </div>

              {/* AI assistant guide widget */}
              <div 
                className="glass-panel p-4.5 rounded-md flex justify-between items-center hover:bg-bg-elevated/20 transition-all duration-200 cursor-pointer border border-border-subtle"
                onClick={() => setActiveTab("assistant")}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded bg-brand-green-deep/30 flex items-center justify-center text-brand-gold">
                    <Sparkles className="w-4 h-4 text-brand-gold" />
                  </div>
                  <div>
                    <p className="text-xs font-bold">Multilingual AI Concierge</p>
                    <p className="text-[10px] text-text-secondary">Instant answers in 50+ languages</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-text-tertiary" />
              </div>
            </div>
          )}

          {/* VIEW: NAVIGATE */}
          {activeTab === "navigate" && (
            <div className="space-y-4 animate-fade-in">
              <div className="glass-panel p-4 rounded-md border border-border-subtle">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-outfit font-bold text-xs">DIAGRAMMATIC VENUE PATH</h3>
                  <span className="text-[9px] bg-alert-success/10 border border-alert-success/20 text-alert-success px-2 py-0.5 rounded font-bold uppercase">Gate B Route Clear</span>
                </div>
                
                {/* SVG Stadium Map representation */}
                <div className="w-full aspect-square rounded-sm bg-bg-base/70 border border-border-subtle relative flex items-center justify-center overflow-hidden">
                  <svg className="w-full h-full max-w-[280px]" viewBox="0 0 100 100">
                    {/* Outer Stadium boundary */}
                    <ellipse cx="50" cy="50" rx="42" ry="32" fill="none" stroke="#242D36" strokeWidth="1" />
                    {/* Inner Stadium ring */}
                    <ellipse cx="50" cy="50" rx="32" ry="22" fill="none" stroke="#242D36" strokeWidth="1" />
                    {/* Arena Field */}
                    <ellipse cx="50" cy="50" rx="20" ry="12" fill="#0C3A2B" fillOpacity="0.2" stroke="#1E6B52" strokeWidth="1" />
                    
                    {/* Gate A (Red congestion marker) */}
                    <circle cx="8" cy="50" r="2.5" fill="#EF4444" />
                    <text x="5" y="44" fill="#9AA8B6" fontSize="3" fontFamily="Outfit">Gate A (92%)</text>
                    
                    {/* Gate B (Green path marker) */}
                    <circle cx="92" cy="50" r="2.5" fill="#10B981" />
                    <text x="76" y="44" fill="#9AA8B6" fontSize="3" fontFamily="Outfit">Gate B (12%)</text>

                    {/* Reference Beacons (Blue nodes) */}
                    <circle cx={beaconA.x} cy={beaconA.y} r="2" fill="#3B82F6" />
                    <circle cx={beaconB.x} cy={beaconB.y} r="2" fill="#3B82F6" />
                    <circle cx={beaconC.x} cy={beaconC.y} r="2" fill="#3B82F6" />
                    
                    {/* Navigation Path highlight (Gold dashed line) */}
                    <path d="M 92 50 Q 75 75 50 65 Q 40 60 30 55" fill="none" stroke="#D4AF37" strokeWidth="1" strokeDasharray="2,2" />
                    <circle cx="30" cy="55" r="2" fill="#D4AF37" />
                    <text x="32" y="58" fill="#D4AF37" fontSize="3" fontWeight="bold" fontFamily="Outfit">Your Seat</text>

                    {/* True User position guide (Subtle grey dot) */}
                    <circle cx={userTrueX} cy={userTrueY} r="1.5" fill="#586A7A" />

                    {/* Estimated Triangulated Position (Pulsating gold node) */}
                    <circle cx={triangulatedPos.x} cy={triangulatedPos.y} r="3.5" fill="#10B981" />
                    <circle 
                      cx={triangulatedPos.x} 
                      cy={triangulatedPos.y} 
                      r="7" 
                      fill="none" 
                      stroke="#10B981" 
                      strokeWidth="0.5" 
                      className="animate-ping" 
                      style={{ 
                        transformOrigin: `${triangulatedPos.x}px ${triangulatedPos.y}px`,
                        animationDuration: "2s"
                      }} 
                    />
                  </svg>
                </div>

                {/* Simulator Walk progress slider */}
                <div className="mt-4 p-3 bg-bg-base/40 rounded border border-border-subtle flex flex-col gap-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-text-secondary uppercase">Simulator: Walk to Seat</span>
                    <span className="font-mono text-brand-gold font-bold">{walkProgress}% Completed</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={walkProgress} 
                    onChange={(e) => setWalkProgress(Number(e.target.value))}
                    className="w-full accent-brand-gold bg-bg-surface h-1 rounded-full cursor-pointer appearance-none"
                  />
                </div>

                {/* BLE Telemetry Diagnostic Table */}
                <div className="mt-4 border border-border-subtle rounded-md overflow-hidden bg-bg-surface/5">
                  <div className="bg-bg-surface/30 p-2 border-b border-border-subtle flex justify-between items-center text-[10px] font-bold">
                    <span className="text-text-primary uppercase">BLE RSSI TRILATERATION MATRIX</span>
                    <span className="text-brand-gold font-mono text-[9px]">Pos: ({Math.round(triangulatedPos.x)}, {Math.round(triangulatedPos.y)})</span>
                  </div>
                  <div className="p-3 text-[10px] space-y-2 font-mono">
                    <div className="flex justify-between border-b border-border-subtle pb-1 font-bold text-text-secondary">
                      <span>BEACON ID</span>
                      <span>RSSI</span>
                      <span>EST DIST</span>
                    </div>
                    <div className="flex justify-between text-text-primary">
                      <span>{beaconA.id} (Gate A)</span>
                      <span className="text-alert-danger">{rssiA} dBm</span>
                      <span>{estDistA.toFixed(1)}m</span>
                    </div>
                    <div className="flex justify-between text-text-primary">
                      <span>{beaconB.id} (Gate B)</span>
                      <span className="text-alert-success">{rssiB} dBm</span>
                      <span>{estDistB.toFixed(1)}m</span>
                    </div>
                    <div className="flex justify-between text-text-primary">
                      <span>{beaconC.id} (Sec 212)</span>
                      <span className="text-alert-info">{rssiC} dBm</span>
                      <span>{estDistC.toFixed(1)}m</span>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-text-secondary mt-3 text-center">
                  Triangulating indoor position via local Bluetooth Low Energy (BLE) beacons.
                </p>
              </div>
            </div>
          )}

          {/* VIEW: ASSISTANT */}
          {activeTab === "assistant" && (
            <div className="space-y-4 animate-fade-in flex flex-col h-[75vh]">
              {/* Toggleable AI Prompt Inspector for hackathon review */}
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-text-secondary uppercase">GenAI Thread</span>
                <button 
                  className="text-[10px] text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded border border-brand-gold/30 flex items-center gap-1"
                  onClick={() => setShowInspector(!showInspector)}
                >
                  <Sparkles className="w-3 h-3" />
                  {showInspector ? "Hide Prompt Inspector" : "Show Prompt Inspector"}
                </button>
              </div>

              {showInspector && (
                <div className="glass-panel p-4 rounded-md border border-brand-gold/30 bg-brand-gold/5 text-[9px] font-mono space-y-2 max-h-[140px] overflow-y-auto">
                  <p className="text-brand-gold font-bold">SYSTEM PROMPT TEMPLATE:</p>
                  <p className="text-text-secondary">
                    "You are a helpful World Cup assistant. Use pgvector retrieved chunks to answer in the fan's locale."
                  </p>
                  <p className="text-brand-gold font-bold">RETRIEVED VECTOR CONTEXTS (pgvector Cosine Sim):</p>
                  <p className="text-alert-success">
                    {"[0.892] 'Halal Bites: Sec 112 West Concourse, vegetarian option, halal certified'"}
                  </p>
                  <p className="text-text-tertiary">
                    {"[0.721] 'Gate A is located next to ticketing lobby, experiencing high crowd density'"}
                  </p>
                </div>
              )}

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                {chatLogs.map((msg: { role: string; text: string }, index: number) => (
                  <div 
                    key={index}
                    className={clsx(
                      "flex flex-col gap-1",
                      msg.role === "user" ? "items-end" : "items-start"
                    )}
                  >
                    <span className="text-[9px] text-text-tertiary">
                      {msg.role === "user" ? "You" : "StadiumIQ AI"}
                    </span>
                    <div className={clsx(
                      "p-3 rounded-md max-w-[85%] border",
                      msg.role === "user" 
                        ? "bg-bg-surface border-border-strong text-text-primary" 
                        : "bg-brand-green-deep/20 border-brand-green-light/20 text-text-primary"
                    )}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Input Panel */}
              <div className="flex gap-2 pt-2 border-t border-border-subtle/50 bg-bg-surface/10">
                <input 
                  type="text"
                  placeholder="Ask food, paths, rules..."
                  className="flex-1 bg-bg-base border border-border-subtle rounded-md px-3 text-xs text-text-primary focus:outline-none focus:border-brand-gold h-10"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  aria-label="Ask assistant a question"
                />
                <button 
                  className="bg-brand-gold hover:bg-brand-gold/90 text-bg-base px-3.5 rounded-md flex items-center justify-center transition-colors duration-150"
                  onClick={handleSendMessage}
                  aria-label="Submit message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* VIEW: TICKET */}
          {activeTab === "ticket" && (
            <div className="space-y-4 animate-fade-in flex flex-col items-center justify-center pt-8">
              <div className="glass-panel p-6 rounded-md border border-brand-gold/20 bg-bg-surface text-center max-w-[280px] w-full">
                <span className="text-[10px] bg-brand-gold/15 text-brand-gold px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                  Verified Ticket
                </span>
                
                {/* Mock QR Code container */}
                <div className="w-44 h-44 bg-white p-3 rounded-sm my-6 mx-auto flex items-center justify-center border border-border-subtle">
                  <div className="w-full h-full border border-bg-base border-dashed flex items-center justify-center text-bg-base text-[9px] font-mono font-bold">
                    [ STADIUMIQ QR CORE CODE ]
                  </div>
                </div>

                <div className="text-xs">
                  <h4 className="font-outfit font-bold text-sm">Carlos Mendes</h4>
                  <p className="text-text-secondary mt-1">MetLife Stadium — Row 12, Seat 4</p>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: ECO */}
          {activeTab === "eco" && (
            <div className="space-y-4 animate-fade-in text-xs">
              
              {/* Header Eco Balance Cards (Points + XP) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-panel p-4 rounded-md border border-brand-gold/20 bg-bg-surface flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-brand-gold">
                    <Leaf className="w-4 h-4" />
                    <span className="font-bold uppercase tracking-wider text-[9px]">Eco Points</span>
                  </div>
                  <span className="text-2xl font-outfit font-extrabold text-text-primary mt-2">{ecoBalance.ecoPoints}</span>
                  <span className="text-[9px] text-text-secondary mt-1">Ready for redemption</span>
                </div>

                <div className="glass-panel p-4 rounded-md border border-brand-green-light/20 bg-bg-surface flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-alert-success">
                    <Trophy className="w-4 h-4" />
                    <span className="font-bold uppercase tracking-wider text-[9px]">Fan XP Level</span>
                  </div>
                  <span className="text-2xl font-outfit font-extrabold text-text-primary mt-2">{ecoBalance.fanXP} XP</span>
                  <div className="w-full bg-bg-base h-1 rounded-full overflow-hidden mt-1.5">
                    <div className="bg-alert-success h-full" style={{ width: `${Math.min(100, (ecoBalance.fanXP / 1000) * 100)}%` }} />
                  </div>
                </div>
              </div>

              {/* QR Code Check-in Simulator */}
              <div className="glass-panel p-4 rounded-md border border-border-subtle bg-bg-surface">
                <h4 className="font-outfit font-bold text-xs flex items-center gap-2 text-text-primary">
                  <QrCode className="w-4 h-4 text-brand-gold" />
                  QR Check-in Simulator (Earn Points)
                </h4>
                <p className="text-text-secondary mt-1 text-[10px]">
                  Scan codes at bins, refill stations, sponsor booths, or transit to redeem points instantly.
                </p>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button 
                    onClick={() => handleQrCheckin("transit")}
                    className="bg-bg-base hover:bg-bg-elevated border border-border-subtle p-2.5 rounded text-left flex items-center justify-between transition-all"
                  >
                    <span>🚇 Public Transit</span>
                    <span className="text-brand-gold font-bold">+30p</span>
                  </button>
                  <button 
                    onClick={() => handleQrCheckin("recycling")}
                    className="bg-bg-base hover:bg-bg-elevated border border-border-subtle p-2.5 rounded text-left flex items-center justify-between transition-all"
                  >
                    <span>♻️ Recycling Bin</span>
                    <span className="text-brand-gold font-bold">+50p</span>
                  </button>
                  <button 
                    onClick={() => handleQrCheckin("water")}
                    className="bg-bg-base hover:bg-bg-elevated border border-border-subtle p-2.5 rounded text-left flex items-center justify-between transition-all"
                  >
                    <span>💧 Water Refill</span>
                    <span className="text-brand-gold font-bold">+15p</span>
                  </button>
                  <button 
                    onClick={() => handleQrCheckin("sponsor")}
                    className="bg-bg-base hover:bg-bg-elevated border border-border-subtle p-2.5 rounded text-left flex items-center justify-between transition-all"
                  >
                    <span>🎪 Sponsor Booth</span>
                    <span className="text-brand-gold font-bold">+20p</span>
                  </button>
                </div>
              </div>

              {/* AI Waste Segregation Assistant */}
              <div className="glass-panel p-4 rounded-md border border-brand-green-light/25 bg-brand-green-deep/5">
                <h4 className="font-outfit font-bold text-xs flex items-center gap-2 text-text-primary">
                  <Sparkles className="w-4 h-4 text-brand-gold" />
                  AI Waste Segregation Assistant
                </h4>
                <p className="text-text-secondary mt-1 text-[10px]">
                  Unsure where to discard waste? Ask the AI to route you to the correct recycling station.
                </p>
                <div className="flex gap-2 mt-3">
                  <input 
                    type="text" 
                    placeholder="e.g. plastic cup, soda can, hotdog paper" 
                    value={sortingInput}
                    onChange={(e) => setSortingInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleWasteSortingCheck()}
                    className="flex-1 bg-bg-base border border-border-subtle rounded px-3 text-xs text-text-primary focus:outline-none focus:border-brand-gold h-9"
                  />
                  <button 
                    onClick={handleWasteSortingCheck}
                    className="bg-brand-gold hover:bg-brand-gold/90 text-bg-base px-3.5 rounded text-xs font-bold transition-all"
                  >
                    Sort
                  </button>
                </div>
                {sortingOutput && (
                  <div className="mt-3 p-3 bg-bg-base/60 rounded border border-brand-green-light/20 text-brand-gold font-bold text-[10px]">
                    {sortingOutput}
                  </div>
                )}
              </div>

              {/* Daily Challenges */}
              <div className="glass-panel p-4 rounded-md border border-border-subtle bg-bg-surface">
                <h4 className="font-outfit font-bold text-xs flex items-center gap-2 text-text-primary">
                  <Activity className="w-4 h-4 text-alert-success" />
                  Daily Sustainability Missions
                </h4>
                <div className="space-y-2.5 mt-3">
                  {(challenges.length > 0 ? challenges : [
                    { id: "1", title: "Public Transit Commuter", description: "Use subway or shuttle bus to get to MetLife Stadium.", pointsValue: 30 },
                    { id: "2", title: "Recycling Master", description: "Recycle 0.5kg of waste at a smart bin.", pointsValue: 40 },
                    { id: "3", title: "Sponsor Booth Explorer", description: "Visit 3 sponsor experience tents.", pointsValue: 50 }
                  ]).map((chal) => (
                    <div key={chal.id} className="p-3 bg-bg-base/40 border border-border-subtle rounded flex justify-between items-center">
                      <div>
                        <p className="font-bold text-text-primary">{chal.title}</p>
                        <p className="text-text-secondary text-[10px] mt-0.5">{chal.description}</p>
                      </div>
                      <span className="text-[10px] font-bold text-brand-gold bg-brand-gold/10 border border-brand-gold/20 px-2 py-1 rounded">
                        +{chal.pointsValue}p
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Achievements & Unlocked Badges */}
              <div className="glass-panel p-4 rounded-md border border-border-subtle bg-bg-surface">
                <h4 className="font-outfit font-bold text-xs flex items-center gap-2 text-text-primary">
                  <Award className="w-4 h-4 text-brand-gold" />
                  My Achievement Badges
                </h4>
                <div className="flex gap-3 overflow-x-auto py-2.5 mt-1 select-none">
                  {(ecoBalance.badges.length > 0 ? ecoBalance.badges : [
                    { title: "Green Champion", icon: "award", description: "Earned 100+ points" },
                    { title: "Zero Waste Hero", icon: "recycle", description: "Recycled 2kg+ waste" }
                  ]).map((badge, idx) => (
                    <div key={idx} className="bg-bg-base/50 border border-border-subtle p-3 rounded text-center shrink-0 w-24">
                      <div className="w-10 h-10 rounded-full bg-brand-gold/15 flex items-center justify-center mx-auto text-brand-gold border border-brand-gold/30">
                        <Award className="w-5 h-5" />
                      </div>
                      <p className="font-bold text-text-primary text-[10px] mt-2 truncate">{badge.title}</p>
                      <p className="text-[8px] text-text-tertiary mt-0.5 truncate">{badge.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Leaderboard Standings */}
              <div className="glass-panel p-4 rounded-md border border-border-subtle bg-bg-surface">
                <h4 className="font-outfit font-bold text-xs flex items-center gap-2 text-text-primary">
                  <Trophy className="w-4 h-4 text-brand-gold" />
                  Eco Fan Leaderboard Standings
                </h4>
                <div className="space-y-2 mt-3 font-mono text-[10px]">
                  {(leaderboard.length > 0 ? leaderboard : [
                    { id: "l1", userName: "Amara Diallo", xpPoints: 310, ecoPoints: 160 },
                    { id: "l2", userName: "Eco Fan", xpPoints: 240, ecoPoints: 120 },
                    { id: "l3", userName: "John Doe", xpPoints: 190, ecoPoints: 95 }
                  ]).map((user, idx) => (
                    <div key={user.id || idx} className="flex justify-between items-center p-2 bg-bg-base/20 border-b border-border-subtle/50">
                      <span className="flex items-center gap-2">
                        <span className="font-bold text-brand-gold">#{idx + 1}</span>
                        <span className="text-text-primary font-sans">{user.userName}</span>
                      </span>
                      <span className="text-text-secondary">{user.xpPoints} XP / <span className="text-brand-gold">{user.ecoPoints}p</span></span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Concession Vouchers & Rewards Store */}
              <div className="glass-panel p-4 rounded-md border border-border-subtle bg-bg-surface">
                <h4 className="font-outfit font-bold text-xs flex items-center gap-2 text-text-primary">
                  <Gift className="w-4 h-4 text-brand-gold" />
                  Redeem Rewards Store
                </h4>
                <div className="space-y-3 mt-3">
                  {(rewards.length > 0 ? rewards : [
                    { id: "r1", title: "Free Organic Concession Hotdog", description: "Redeem at Section 112 Concessions.", pointCost: 80 },
                    { id: "r2", title: "20% Off Merchandise Ticket", description: "Get a 20% discount on official FIFA merch.", pointCost: 150 },
                    { id: "r3", title: "Free Subway Ride Voucher", description: "Valid for one transit trip.", pointCost: 50 }
                  ]).map((reward) => (
                    <div key={reward.id} className="p-3 bg-bg-base/40 border border-border-subtle rounded flex justify-between items-center">
                      <div className="flex-1 pr-3">
                        <p className="font-bold text-text-primary">{reward.title}</p>
                        <p className="text-text-secondary text-[10px] mt-0.5">{reward.description}</p>
                      </div>
                      <button 
                        onClick={() => handleRedeemReward(reward.id, reward.title)}
                        className="bg-brand-gold hover:bg-brand-gold/90 text-bg-base font-bold text-[10px] px-3 py-1.5 rounded transition-all shrink-0"
                      >
                        Redeem ({reward.pointCost}p)
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sustainability Telemetry Impact Metrics */}
              <div className="glass-panel p-4 rounded-md border border-border-subtle bg-bg-surface">
                <h4 className="font-outfit font-bold text-xs flex items-center gap-2 text-text-primary">
                  <Activity className="w-4 h-4 text-brand-gold" />
                  MetLife Sustainability Live Impact
                </h4>
                <div className="grid grid-cols-2 gap-3 mt-3 text-[10px]">
                  <div className="p-3 bg-bg-base/30 border border-border-subtle rounded">
                    <p className="text-text-secondary uppercase text-[8px] font-bold">Waste Saved</p>
                    <p className="text-lg font-outfit font-extrabold text-alert-success mt-1">{metrics.wasteSavedKg.toFixed(1)} kg</p>
                  </div>
                  <div className="p-3 bg-bg-base/30 border border-border-subtle rounded">
                    <p className="text-text-secondary uppercase text-[8px] font-bold">Carbon Offset</p>
                    <p className="text-lg font-outfit font-extrabold text-alert-info mt-1">{metrics.carbonOffsetKg.toFixed(1)} kg</p>
                  </div>
                  <div className="p-3 bg-bg-base/30 border border-border-subtle rounded">
                    <p className="text-text-secondary uppercase text-[8px] font-bold">Water Refills</p>
                    <p className="text-lg font-outfit font-extrabold text-brand-gold mt-1">{metrics.waterRefills} Refills</p>
                  </div>
                  <div className="p-3 bg-bg-base/30 border border-border-subtle rounded">
                    <p className="text-text-secondary uppercase text-[8px] font-bold">Transit Rides</p>
                    <p className="text-lg font-outfit font-extrabold text-text-primary mt-1">{metrics.transitRides} check-ins</p>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Floating Bottom Nav Drawer */}
        <nav 
          className="h-16 border-t border-border-subtle bg-bg-surface/75 backdrop-blur-md flex justify-around items-center sticky bottom-0 z-20"
          aria-label="PWA tab links"
        >
          <button 
            className={clsx("flex flex-col items-center gap-1 text-[9px] font-semibold transition-colors duration-150", activeTab === "home" ? "text-brand-gold" : "text-text-secondary")}
            onClick={() => setActiveTab("home")}
            aria-label="Home tab"
          >
            <Home className="w-5 h-5" />
            <span>Home</span>
          </button>
          <button 
            className={clsx("flex flex-col items-center gap-1 text-[9px] font-semibold transition-colors duration-150", activeTab === "navigate" ? "text-brand-gold" : "text-text-secondary")}
            onClick={() => setActiveTab("navigate")}
            aria-label="Navigation map tab"
          >
            <MapPin className="w-5 h-5" />
            <span>Navigate</span>
          </button>
          <button 
            className={clsx("flex flex-col items-center gap-1 text-[9px] font-semibold transition-colors duration-150", activeTab === "assistant" ? "text-brand-gold" : "text-text-secondary")}
            onClick={() => setActiveTab("assistant")}
            aria-label="AI Concierge assistant tab"
          >
            <MessageSquare className="w-5 h-5" />
            <span>Assistant</span>
          </button>
          <button 
            className={clsx("flex flex-col items-center gap-1 text-[9px] font-semibold transition-colors duration-150", activeTab === "eco" ? "text-brand-gold" : "text-text-secondary")}
            onClick={() => setActiveTab("eco")}
            aria-label="Eco Rewards tab"
          >
            <Leaf className="w-5 h-5" />
            <span>Eco Earn</span>
          </button>
          <button 
            className={clsx("flex flex-col items-center gap-1 text-[9px] font-semibold transition-colors duration-150", activeTab === "ticket" ? "text-brand-gold" : "text-text-secondary")}
            onClick={() => setActiveTab("ticket")}
            aria-label="Digital Ticket tab"
          >
            <Ticket className="w-5 h-5" />
            <span>Ticket</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
