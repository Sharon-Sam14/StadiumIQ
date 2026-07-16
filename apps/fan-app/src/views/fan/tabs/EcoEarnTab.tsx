import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import {
  Leaf,
  Trophy,
  QrCode,
  Gift,
  Activity,
  Search,
  TreePine,
} from "lucide-react";
import { AIBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { classifyWaste } from "@/utils/wasteClassifier";
import { sanitizeInput } from "@/utils/sanitize";
import {
  calcTreeEquivalence,
  getXPLevel,
  getXPProgress,
} from "@/utils/formatters";
import { GoalCelebration } from "@/components/animations/GoalCelebration";
import type { EcoTransaction } from "@/types/fan";
import type { UseEcoPointsReturn } from "@/hooks/useEcoPoints";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/utils/firebase";

// ============================================================
// ECO EARN TAB — Sustainability & Gamification
// ============================================================

const ECO_MISSIONS = [
  {
    id: "mission-1",
    title: "Public Transit Commuter",
    description: "Arrive via subway or shuttle bus.",
    points: 30,
  },
  {
    id: "mission-2",
    title: "Recycling Master",
    description: "Recycle at a smart bin station.",
    points: 50,
  },
  {
    id: "mission-3",
    title: "Hydration Station Hero",
    description: "Refill at a water station.",
    points: 15,
  },
  {
    id: "mission-4",
    title: "Sponsor Explorer",
    description: "Visit 2+ sponsor experience tents.",
    points: 40,
  },
  {
    id: "mission-5",
    title: "Zero Plastic Pledge",
    description: "Skip single-use plastic today.",
    points: 25,
  },
];

const ECO_REWARDS = [
  {
    id: "r1",
    title: "Free Organic Concession Hotdog",
    description: "Redeem at Section 112 Concessions.",
    pointCost: 80,
  },
  {
    id: "r2",
    title: "20% Off Merchandise Voucher",
    description: "20% off at any official FIFA merch store.",
    pointCost: 150,
  },
  {
    id: "r3",
    title: "Free NJ Transit Ride",
    description: "Valid for one post-match train ride.",
    pointCost: 50,
  },
  {
    id: "r4",
    title: "VIP Eco Lounge Access",
    description: "30-min access to the Green Zone Lounge.",
    pointCost: 200,
  },
];

const LEADERBOARD = [
  { rank: 1, name: "Amara Diallo", country: "SEN", ecoPoints: 420, fanXP: 840 },
  { rank: 2, name: "Ji-Ho Kim", country: "KOR", ecoPoints: 385, fanXP: 770 },
  {
    rank: 3,
    name: "Carlos Mendes",
    country: "BRA",
    ecoPoints: 310,
    fanXP: 620,
  },
  {
    rank: 4,
    name: "Fatima Al-Rashidi",
    country: "MAR",
    ecoPoints: 275,
    fanXP: 550,
  },
  { rank: 5, name: "Lena Müller", country: "GER", ecoPoints: 240, fanXP: 480 },
];

const LIVE_METRICS = {
  wasteSavedKg: 1424.8,
  carbonOffsetKg: 2950.4,
  waterRefills: 4390,
  transitCheckins: 6810,
};

const ACTION_TYPES: {
  type: EcoTransaction["type"];
  label: string;
  points: number;
  icon: string;
}[] = [
  { type: "transit", label: "Public Transit", points: 30, icon: "🚇" },
  { type: "recycling", label: "Recycling Bin", points: 50, icon: "♻" },
  { type: "water_refill", label: "Water Refill", points: 15, icon: "💧" },
  { type: "sponsor_booth", label: "Sponsor Booth", points: 20, icon: "★" },
];

interface EcoEarnTabProps {
  readonly ecoHook: UseEcoPointsReturn;
}

export const EcoEarnTab = React.memo(function EcoEarnTab({
  ecoHook,
}: EcoEarnTabProps): React.JSX.Element {
  const { balance, addPoints, spendPoints, completeMission } = ecoHook;

  const [isLoading, setIsLoading] = useState(true);
  const [wasteInput, setWasteInput] = useState("");
  const [wasteResult, setWasteResult] = useState<ReturnType<
    typeof classifyWaste
  > | null>(null);
  const [activeVoucher, setActiveVoucher] = useState<{
    title: string;
    code: string;
  } | null>(null);
  const [checkinFeedback, setCheckinFeedback] = useState<string | null>(null);
  const [liveMetrics, setLiveMetrics] = useState(LIVE_METRICS);
  const [celebrationActive, setCelebrationActive] = useState(false);
  const [priceDropActive, setPriceDropActive] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  // Increment live metrics every 8s
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveMetrics((prev) => ({
        wasteSavedKg: parseFloat(
          (prev.wasteSavedKg + Math.random() * 0.8).toFixed(1),
        ),
        carbonOffsetKg: parseFloat(
          (prev.carbonOffsetKg + Math.random() * 1.2).toFixed(1),
        ),
        waterRefills: prev.waterRefills + Math.floor(Math.random() * 3),
        transitCheckins: prev.transitCheckins + Math.floor(Math.random() * 2),
      }));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const treeEquivalence = useMemo(
    () => calcTreeEquivalence(liveMetrics.carbonOffsetKg),
    [liveMetrics.carbonOffsetKg],
  );

  const xpLevel = useMemo(() => getXPLevel(balance.fanXP), [balance.fanXP]);
  const xpProgress = useMemo(
    () => getXPProgress(balance.fanXP),
    [balance.fanXP],
  );

  const prevLevelRef = useRef(xpLevel.label);

  useEffect(() => {
    if (xpLevel.label !== prevLevelRef.current) {
      setCelebrationActive(true);
      prevLevelRef.current = xpLevel.label;
    }
  }, [xpLevel.label]);

  const handleCheckin = useCallback(
    (type: EcoTransaction["type"], label: string, points: number): void => {
      addPoints(type);
      setCheckinFeedback(`Check-in: ${label} — +${points} Eco Points earned!`);
      setTimeout(() => setCheckinFeedback(null), 3000);
    },
    [addPoints],
  );

  const handleWasteClassify = useCallback((): void => {
    const sanitized = sanitizeInput(wasteInput, 100);
    if (!sanitized) return;
    const result = classifyWaste(sanitized);
    setWasteResult(result);
  }, [wasteInput]);

  const handleRedeemReward = useCallback(
    (id: string, title: string, cost: number): void => {
      const success = spendPoints(cost, id);
      if (success) {
        const code = `VOUCH-${Math.random().toString(36).toUpperCase().slice(2, 8)}`;
        setActiveVoucher({ title, code });
      } else {
        setCheckinFeedback(
          `Not enough Eco Points. You need ${cost} points to redeem this reward.`,
        );
        setTimeout(() => setCheckinFeedback(null), 3500);
      }
    },
    [spendPoints],
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* 6. Level Up Goal celebration component */}
      <GoalCelebration
        active={celebrationActive}
        onComplete={() => setCelebrationActive(false)}
      />
      {/* Feedback Toast */}
      {checkinFeedback && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl border border-green-500/30 bg-green-900/30 px-4 py-3 text-xs font-semibold text-green-300 animate-slide-up"
        >
          {checkinFeedback}
        </div>
      )}

      {/* GenAI Dynamic Pricing Simulation Controls */}
      <Card title="GenAI Concessions Pricing Simulator">
        <div className="space-y-3">
          <p className="text-[10px] text-[var(--text-tertiary)]">
            Simulate a background GenAI telemetry agent monitoring concession
            overstock risks. Turning on the simulator issues a PRICE_DROP
            directive to lower points cost and redirect event traffic.
          </p>
          <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-elevated)]/50 border border-[var(--border-subtle)]">
            <span className="text-xs font-semibold text-[var(--text-primary)]">
              Simulate Concession Overstock (AI Price Drop)
            </span>
            <button
              onClick={async () => {
                const nextState = !priceDropActive;
                setPriceDropActive(nextState);
                try {
                  const callOptimiser = httpsCallable(
                    functions,
                    "autonomicConcessionOptimiser",
                  );
                  await callOptimiser({ overstockAlert: nextState });
                } catch (err) {
                  console.error("AI Price Drop error:", err);
                }
              }}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                priceDropActive
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-[var(--brand-gold)] text-black hover:opacity-90"
              }`}
            >
              {priceDropActive ? "STOP SIMULATOR" : "START SIMULATOR"}
            </button>
          </div>
          {priceDropActive && (
            <div className="rounded-xl border border-red-500/30 bg-red-950/20 px-4 py-3 text-[11px] font-semibold text-red-400 animate-pulse flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-ping shrink-0" />
              <span>
                <strong>⚡ AI PRICE_DROP Directive Active:</strong> MetLife
                Stadium Section 112 organic hotdog inventory surplus detected.
                Points cost optimized by 50% (80p → 40p) to reduce food waste!
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Voucher Modal */}
      {activeVoucher && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Reward voucher"
        >
          <div className="bg-[var(--bg-surface)] border border-[var(--brand-gold)]/30 rounded-2xl p-6 max-w-sm w-full text-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-gold)]">
              Voucher Redeemed!
            </span>
            <h3 className="font-display font-bold text-base mt-3 mb-4 text-[var(--text-primary)]">
              {activeVoucher.title}
            </h3>
            <div
              className="w-36 h-36 bg-white rounded-xl mx-auto flex items-center justify-center p-3 mb-4"
              aria-label="Voucher QR code"
            >
              <QrCode
                className="w-full h-full text-black opacity-80"
                aria-hidden="true"
              />
            </div>
            <p className="font-mono text-xs text-[var(--brand-gold)] font-bold mb-2">
              {activeVoucher.code}
            </p>
            <p className="text-[10px] text-[var(--text-tertiary)] mb-4">
              Scan at any concession or merchandise point to claim.
            </p>
            <button
              onClick={() => setActiveVoucher(null)}
              className="w-full py-2.5 rounded-xl bg-[var(--brand-gold)] text-black font-bold text-sm hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              aria-label="Close voucher"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Eco Points + XP Level */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center gap-1.5 text-[var(--brand-gold)] mb-2">
            <Leaf className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="text-[9px] font-bold uppercase tracking-wider">
              Eco Points
            </span>
          </div>
          <p className="font-display font-black text-3xl text-[var(--text-primary)]">
            {balance.ecoPoints}
          </p>
          <p className="text-[9px] text-[var(--text-tertiary)] mt-1">
            Ready to redeem
          </p>
        </Card>

        <Card>
          <div
            className="flex items-center gap-1.5 mb-2"
            style={{ color: xpLevel.color }}
          >
            <Trophy className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="text-[9px] font-bold uppercase tracking-wider">
              {xpLevel.label} Level
            </span>
          </div>
          <p className="font-display font-black text-3xl text-[var(--text-primary)]">
            {balance.fanXP}
          </p>
          <div className="mt-2">
            <div
              className="h-1.5 rounded-full bg-[var(--bg-elevated)] overflow-hidden"
              role="progressbar"
              aria-valuenow={xpProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`XP progress: ${xpProgress}%`}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${xpProgress}%`,
                  backgroundColor: xpLevel.color,
                }}
              />
            </div>
            <p className="text-[9px] text-[var(--text-tertiary)] mt-1">
              {xpProgress}% to next level
            </p>
          </div>
        </Card>
      </div>

      {/* Carbon Footprint Counter */}
      <div className="rounded-xl border border-green-500/25 bg-green-900/10 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-400" aria-hidden="true" />
            <span className="text-xs font-bold text-[var(--text-primary)]">
              Carbon Footprint Saved Today
            </span>
          </div>
          <AIBadge label="AI-Estimated" />
        </div>
        <p className="font-display font-black text-4xl text-green-400 mb-1">
          {liveMetrics.carbonOffsetKg.toFixed(1)}{" "}
          <span className="text-xl">kg CO₂</span>
        </p>
        <p className="text-xs text-[var(--text-secondary)]">
          Baseline: same-scale event without eco programme would emit{" "}
          <strong className="text-red-400">~8,200 kg</strong> more.
        </p>
        <div className="flex items-center gap-2 mt-2 p-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
          <TreePine
            className="w-4 h-4 text-green-400 shrink-0"
            aria-hidden="true"
          />
          <p className="text-xs text-[var(--text-secondary)]">
            Today's offset equals planting{" "}
            <strong className="text-green-400">{treeEquivalence} trees</strong>{" "}
            (at 21.77 kg CO₂ absorbed per tree/year)
          </p>
        </div>
      </div>

      {/* QR Check-in Simulator */}
      <Card title="QR Check-in Simulator" headerRight={<AIBadge />}>
        <p className="text-[10px] text-[var(--text-secondary)] mb-3">
          Scan stations to earn Eco Points. Tap any action below to simulate a
          QR scan.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {ACTION_TYPES.map(({ type, label, points, icon }) => (
            <button
              key={type}
              onClick={() => handleCheckin(type, label, points)}
              className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:-translate-y-0.5 transition-all text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-gold)]"
              aria-label={`Check in at ${label} to earn ${points} Eco Points`}
            >
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {icon} {label}
              </span>
              <span className="text-xs font-bold text-[var(--brand-gold)]">
                +{points}p
              </span>
            </button>
          ))}
        </div>
      </Card>

      {/* AI Waste Segregation */}
      <Card title="AI Waste Segregation Assistant" headerRight={<AIBadge />}>
        <p className="text-[10px] text-[var(--text-secondary)] mb-3">
          Describe your waste item to get bin routing instructions.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. plastic cup, soda can, food scrap..."
            value={wasteInput}
            onChange={(e) => setWasteInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleWasteClassify()}
            className="flex-1 h-9 px-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--brand-gold)] focus-visible:outline-none transition-colors"
            aria-label="Describe your waste item for sorting guidance"
            maxLength={100}
          />
          <button
            onClick={handleWasteClassify}
            className="px-4 h-9 rounded-lg bg-[var(--brand-gold)] text-black font-bold text-xs hover:opacity-90 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-gold)]"
            aria-label="Classify this waste item"
          >
            <Search className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
        {wasteResult && (
          <div
            className="mt-3 p-3 rounded-lg border animate-slide-up"
            style={{
              borderColor: wasteResult.binColor + "50",
              backgroundColor: wasteResult.binColor + "15",
            }}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: wasteResult.binColor }}
                aria-hidden="true"
              />
              <span className="text-xs font-bold text-[var(--text-primary)]">
                {wasteResult.binLabel}
              </span>
            </div>
            <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
              {wasteResult.instruction}
            </p>
            <p className="text-[10px] text-[var(--text-tertiary)] mt-1.5 italic">
              {wasteResult.ecoNote}
            </p>
          </div>
        )}
      </Card>

      {/* Daily Sustainability Missions */}
      <Card title="Daily Sustainability Missions">
        <div className="space-y-2">
          {ECO_MISSIONS.map((mission) => {
            const completed = balance.completedMissions.includes(mission.id);
            return (
              <label
                key={mission.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                  completed
                    ? "border-green-500/30 bg-green-900/15 opacity-70"
                    : "border-[var(--border-subtle)] hover:border-[var(--border-strong)]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={completed}
                  onChange={() => !completed && completeMission(mission.id)}
                  disabled={completed}
                  className="w-4 h-4 accent-[var(--brand-gold)] cursor-pointer"
                  aria-label={`${mission.title}: ${mission.description}`}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-xs font-semibold ${completed ? "line-through text-[var(--text-tertiary)]" : "text-[var(--text-primary)]"}`}
                  >
                    {mission.title}
                  </p>
                  <p className="text-[10px] text-[var(--text-tertiary)] truncate">
                    {mission.description}
                  </p>
                </div>
                <span className="text-[10px] font-bold text-[var(--brand-gold)] bg-[var(--brand-gold)]/10 border border-[var(--brand-gold)]/20 px-2 py-0.5 rounded-full">
                  +{mission.points}p
                </span>
              </label>
            );
          })}
        </div>
      </Card>

      {/* Leaderboard */}
      <Card title="Eco Fan Leaderboard">
        <div className="space-y-1.5">
          {LEADERBOARD.map((entry) => (
            <div
              key={entry.rank}
              className={`flex items-center gap-3 p-2.5 rounded-lg ${
                entry.name === "Carlos Mendes"
                  ? "bg-[var(--brand-gold)]/10 border border-[var(--brand-gold)]/20"
                  : "bg-[var(--bg-elevated)]/50"
              }`}
            >
              <span
                className={`font-display font-black text-sm w-5 text-center ${
                  entry.rank === 1
                    ? "text-[var(--brand-gold)]"
                    : "text-[var(--text-tertiary)]"
                }`}
              >
                #{entry.rank}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                  {entry.name}
                  {entry.name === "Carlos Mendes" && (
                    <span className="text-[9px] text-[var(--brand-gold)] ml-1">
                      (You)
                    </span>
                  )}
                </p>
                <p className="text-[9px] text-[var(--text-tertiary)]">
                  {entry.country}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-[var(--brand-gold)]">
                  {entry.ecoPoints}p
                </p>
                <p className="text-[9px] text-[var(--text-tertiary)]">
                  {entry.fanXP} XP
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Redeem Rewards Store */}
      <Card
        title="Redeem Rewards Store"
        headerRight={
          <span className="text-xs text-[var(--brand-gold)] font-bold">
            {balance.ecoPoints} pts available
          </span>
        }
      >
        <div className="space-y-3">
          {ECO_REWARDS.map((reward) => {
            const isOrganicHotdog = reward.id === "r1";
            const actualCost =
              isOrganicHotdog && priceDropActive ? 40 : reward.pointCost;
            const canAfford = balance.ecoPoints >= actualCost;
            return (
              <div
                key={reward.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border-subtle)]"
              >
                <Gift
                  className="w-4 h-4 text-[var(--brand-gold)] shrink-0"
                  aria-hidden="true"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[var(--text-primary)]">
                    {reward.title}
                  </p>
                  <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
                    {reward.description}
                  </p>
                </div>
                <button
                  onClick={() =>
                    handleRedeemReward(reward.id, reward.title, actualCost)
                  }
                  disabled={!canAfford}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-[var(--brand-gold)] text-black font-bold text-[10px] disabled:opacity-35 disabled:cursor-not-allowed hover:opacity-90 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-gold)]"
                  aria-label={`Redeem ${reward.title} for ${actualCost} Eco Points${!canAfford ? " (insufficient points)" : ""}`}
                >
                  {actualCost}p
                </button>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Live Impact Telemetry */}
      <Card
        title="MetLife Stadium Live Impact"
        headerRight={<AIBadge label="AI-Estimated" />}
      >
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label: "Waste Saved",
              value: `${liveMetrics.wasteSavedKg.toFixed(1)} kg`,
              color: "text-green-400",
            },
            {
              label: "Carbon Offset",
              value: `${liveMetrics.carbonOffsetKg.toFixed(1)} kg`,
              color: "text-blue-400",
            },
            {
              label: "Water Refills",
              value: liveMetrics.waterRefills.toLocaleString(),
              color: "text-cyan-400",
            },
            {
              label: "Transit Rides",
              value: liveMetrics.transitCheckins.toLocaleString(),
              color: "text-[var(--text-primary)]",
            },
          ].map(({ label, value, color }) => (
            <div key={label} className="p-3 bg-[var(--bg-elevated)] rounded-lg">
              <p className="text-[9px] text-[var(--text-tertiary)] uppercase font-semibold mb-1">
                {label}
              </p>
              <p
                className={`font-display font-bold text-lg ${color} animate-fade-in`}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
          <TreePine
            className="w-3.5 h-3.5 text-green-400 shrink-0"
            aria-hidden="true"
          />
          <p className="text-[10px] text-[var(--text-secondary)]">
            Today's carbon offset equals planting{" "}
            <strong className="text-green-400">{treeEquivalence} trees</strong>{" "}
            (AI-estimated at 21.77 kg CO₂ per tree/year)
          </p>
        </div>
      </Card>
    </div>
  );
});
