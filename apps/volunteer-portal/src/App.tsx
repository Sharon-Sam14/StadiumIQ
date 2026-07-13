import { useState, useEffect } from "react";
import { 
  ClipboardList, 
  BookOpen, 
  MessageSquare, 
  AlertTriangle, 
  User, 
  Sparkles, 
  CheckCircle, 
  Clock, 
  Send,
  AlertCircle
} from "lucide-react";
import clsx from "clsx";

export default function App() {
  const [activeTab, setActiveTab] = useState<"briefing" | "tasks" | "assistant" | "report">("briefing");
  const [tasks, setTasks] = useState([
    { id: 1, title: "Redirect Section 200 flow to Gate B", priority: "high", status: "in_progress" },
    { id: 2, title: "Deliver accessibility escort for Priya Sharma (Sec 212)", priority: "high", status: "pending" },
    { id: 3, title: "Distribute sustainability flyers at West Gate", priority: "low", status: "completed" }
  ]);
  const [chatMessage, setChatMessage] = useState("");
  const [chatLogs, setChatLogs] = useState([
    { role: "assistant", text: "Welcome to the Volunteer Assistant, Jake. Ask me any procedural question (e.g. 'procedure for lost child' or 'first aid protocol')." }
  ]);
  const [showInspector, setShowInspector] = useState(false);
  const [reportForm, setReportForm] = useState({ description: "", severity: "medium", type: "crowd" });
  const [activeBroadcast, setActiveBroadcast] = useState<{ title: string; message: string; severity: string } | null>(null);

  // BLE beacon node reference coordinates
  const beaconA = { id: "BCN-112-A", x: 10, y: 15 };
  const beaconB = { id: "BCN-112-B", x: 90, y: 15 };
  const beaconC = { id: "BCN-112-C", x: 50, y: 85 };

  // Jake Whitmore is stationed at Section 200 lobby grid (x: 52, y: 66)
  const userTrueX = 52.0;
  const userTrueY = 66.5;

  const distA = Math.sqrt((userTrueX - beaconA.x) ** 2 + (userTrueY - beaconA.y) ** 2);
  const distB = Math.sqrt((userTrueX - beaconB.x) ** 2 + (userTrueY - beaconB.y) ** 2);
  const distC = Math.sqrt((userTrueX - beaconC.x) ** 2 + (userTrueY - beaconC.y) ** 2);

  const getNoisyRSSI = (dist: number, seed: number) => {
    const rawRSSI = -20 * Math.log10(dist || 1) - 30;
    const noise = Math.sin(Date.now() / 2000 + seed) * 1.0;
    return Math.round(rawRSSI + noise);
  };

  const rssiA = getNoisyRSSI(distA, 1);
  const rssiB = getNoisyRSSI(distB, 2);
  const rssiC = getNoisyRSSI(distC, 3);

  const estDistA = 10 ** ((-30 - rssiA) / 20);
  const estDistB = 10 ** ((-30 - rssiB) / 20);
  const estDistC = 10 ** ((-30 - rssiC) / 20);

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

  const handleToggleTask = (id: number) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const nextStatus = t.status === "pending" ? "in_progress" : t.status === "in_progress" ? "completed" : "pending";
        return { ...t, status: nextStatus };
      }
      return t;
    }));
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    const userMsg = chatMessage;
    setChatLogs(prev => [...prev, { role: "user", text: userMsg }]);
    setChatMessage("");

    setTimeout(() => {
      let reply = "Checking procedural manuals. For general queries, please contact your section supervisor.";
      if (userMsg.toLowerCase().includes("child") || userMsg.toLowerCase().includes("lost")) {
        reply = "LOST CHILD PROTOCOL:\n1. Keep the child at your location; do not walk away.\n2. Contact Section Supervisor immediately.\n3. Log incident in portal under High severity.\n4. Do NOT broadcast child's name over public channels.";
      } else if (userMsg.toLowerCase().includes("medical") || userMsg.toLowerCase().includes("aid")) {
        reply = "MEDICAL EMERGENCY PROTOCOL:\n1. Check scene safety.\n2. Do not move the patient.\n3. Log incident as High/Critical immediately.\n4. Stand by to direct incoming medical volunteers to the coordinates.";
      }
      setChatLogs(prev => [...prev, { role: "assistant", text: reply }]);
    }, 700);
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportForm.description.trim()) return;
    console.log("Submitting incident:", reportForm);
    alert(`Incident logged successfully! Reference ID: INC-${Math.floor(Math.random() * 900) + 100}`);
    setReportForm({ description: "", severity: "medium", type: "crowd" });
  };

  return (
    <div className="min-h-screen bg-bg-base text-text-primary flex flex-col items-center justify-start pb-20 select-none">
      {/* Target device container for mobile preview representation */}
      <div className="w-full max-w-[480px] min-h-screen flex flex-col bg-bg-surface/20 border-x border-border-subtle relative">
        
        {/* Header */}
        <header className="h-16 px-4 border-b border-border-subtle flex justify-between items-center bg-bg-surface/50 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-sm bg-brand-green-light border border-brand-gold flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-brand-gold" />
            </div>
            <div>
              <span className="font-outfit font-extrabold text-sm tracking-wide">StaffIQ</span>
              <span className="text-[8px] bg-brand-gold/10 text-brand-gold px-1.5 py-0.5 rounded font-bold uppercase ml-2 tracking-wider">Volunteer</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden xs:block">
              <p className="text-[10px] font-bold text-text-primary">Jake Whitmore</p>
              <p className="text-[8px] text-text-secondary uppercase tracking-wider">Fan Services (Sec 200)</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-brand-green-light/30 border border-brand-gold/30 flex items-center justify-center">
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

        {/* Dynamic content rendering */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          
          {/* VIEW: BRIEFING */}
          {activeTab === "briefing" && (
            <div className="space-y-4 animate-fade-in">
              <div className="glass-panel p-5 rounded-md border border-brand-green-light/20 bg-gradient-to-br from-brand-green-deep/20 via-bg-surface/80 to-bg-surface">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-brand-gold" />
                  <h3 className="font-outfit font-extrabold text-xs tracking-wider text-brand-gold uppercase">Your AI Pre-Shift Brief</h3>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Jake, you are assigned to **Section 200 Concourse**. 
                </p>
                <ul className="list-disc list-inside space-y-2 text-xs text-text-secondary mt-3">
                  <li>**Surge Alert:** Gate A is bottlenecked. Proactively redirect incoming fans to Gate B.</li>
                  <li>**Languages:** Expect French & Wolof speakers from Match 82 attendees.</li>
                  <li>**Key Check:** Ensure wheelchair companion paths are clear at Section 212.</li>
                </ul>
                {/* BLE Indoor Triangulation Status */}
                <div className="mt-4 p-3 bg-bg-base/40 rounded border border-border-subtle/50 font-mono text-[9px] text-text-secondary flex justify-between items-center">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-alert-success animate-pulse shrink-0" />
                    BLE POSITION COORDINATOR
                  </span>
                  <span className="text-brand-gold font-bold">LOBBY: ({Math.round(triangulatedPos.x)}, {Math.round(triangulatedPos.y)})</span>
                </div>

                <div className="mt-4 pt-4 border-t border-border-subtle/50 flex justify-between items-center text-[10px] text-text-tertiary">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Shift started: 18:30</span>
                  <span>Briefing v1.4</span>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: TASKS */}
          {activeTab === "tasks" && (
            <div className="space-y-3 animate-fade-in">
              <h3 className="font-outfit font-bold text-xs uppercase tracking-wider text-text-secondary px-1">Your Shift Checklist</h3>
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div 
                    key={task.id}
                    onClick={() => handleToggleTask(task.id)}
                    className={clsx(
                      "glass-panel p-4 rounded-md border flex items-center justify-between cursor-pointer transition-all duration-200",
                      task.status === "completed" 
                        ? "border-alert-success/20 bg-alert-success/5 opacity-60" 
                        : "border-border-subtle hover:border-border-strong bg-bg-surface/30"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <CheckCircle className={clsx(
                          "w-5 h-5",
                          task.status === "completed" ? "text-alert-success" : "text-text-tertiary"
                        )} />
                      </div>
                      <div>
                        <p className={clsx("text-xs font-bold", task.status === "completed" && "line-through text-text-secondary")}>
                          {task.title}
                        </p>
                        <span className={clsx(
                          "text-[8px] px-1.5 py-0.5 rounded font-bold uppercase mt-1 inline-block",
                          task.priority === "high" ? "bg-alert-danger/10 text-alert-danger" : "bg-text-secondary/15 text-text-secondary"
                        )}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-text-tertiary uppercase">
                      {task.status === "in_progress" ? "Working" : task.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW: ASSISTANT */}
          {activeTab === "assistant" && (
            <div className="space-y-4 animate-fade-in flex flex-col h-[75vh]">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-text-secondary uppercase">Operational Q&A</span>
                <button 
                  className="text-[10px] text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded border border-brand-gold/30 flex items-center gap-1"
                  onClick={() => setShowInspector(!showInspector)}
                >
                  <Sparkles className="w-3 h-3" />
                  {showInspector ? "Hide Inspector" : "Show Inspector"}
                </button>
              </div>

              {showInspector && (
                <div className="glass-panel p-4 rounded-md border border-brand-gold/30 bg-brand-gold/5 text-[9px] font-mono space-y-2 max-h-[140px] overflow-y-auto">
                  <p className="text-brand-gold font-bold">SYSTEM PROMPT TEMPLATE:</p>
                  <p className="text-text-secondary">
                    "You are a stadium volunteer assistant. Retrieve standard operating procedures (SOPs) from pgvector."
                  </p>
                  <p className="text-brand-gold font-bold">RETRIEVED SOP CHUNKS (pgvector Cosine Sim):</p>
                  <p className="text-alert-success">
                    {"[0.914] 'SOP-22: Lost Child Protocol. Do not leave the spot. Notify supervisor. Log incident.'"}
                  </p>
                  <p className="text-text-tertiary">
                    {"[0.688] 'SOP-12: Concession line management controls.'"}
                  </p>
                </div>
              )}

              <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                {chatLogs.map((msg, index) => (
                  <div 
                    key={index}
                    className={clsx(
                      "flex flex-col gap-1",
                      msg.role === "user" ? "items-end" : "items-start"
                    )}
                  >
                    <span className="text-[9px] text-text-tertiary">
                      {msg.role === "user" ? "You" : "StaffIQ AI"}
                    </span>
                    <div className={clsx(
                      "p-3 rounded-md max-w-[85%] border whitespace-pre-line",
                      msg.role === "user" 
                        ? "bg-bg-surface border-border-strong text-text-primary" 
                        : "bg-brand-green-deep/20 border-brand-green-light/20 text-text-primary"
                    )}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2 border-t border-border-subtle/50 bg-bg-surface/10">
                <input 
                  type="text"
                  placeholder="Ask procedures (e.g. lost child)..."
                  className="flex-1 bg-bg-base border border-border-subtle rounded-md px-3 text-xs text-text-primary focus:outline-none focus:border-brand-gold h-10"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  aria-label="Ask volunteer guidelines"
                />
                <button 
                  className="bg-brand-gold hover:bg-brand-gold/90 text-bg-base px-3.5 rounded-md flex items-center justify-center transition-colors duration-150"
                  onClick={handleSendMessage}
                  aria-label="Submit query"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* VIEW: REPORT INCIDENT */}
          {activeTab === "report" && (
            <div className="space-y-4 animate-fade-in">
              <div className="glass-panel p-5 rounded-md border border-border-subtle bg-bg-surface/30">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-alert-danger" />
                  <h3 className="font-outfit font-extrabold text-xs uppercase tracking-wider">Report Operational Incident</h3>
                </div>
                
                <form onSubmit={handleSubmitReport} className="space-y-4">
                  <div>
                    <label className="block text-[10px] text-text-secondary uppercase mb-1 font-bold">Incident Type</label>
                    <select 
                      className="w-full bg-bg-base border border-border-subtle rounded-md px-3 h-10 text-xs text-text-primary focus:outline-none focus:border-brand-gold"
                      value={reportForm.type}
                      onChange={(e) => setReportForm({...reportForm, type: e.target.value})}
                      aria-label="Select incident category"
                    >
                      <option value="crowd">Crowd Control / Overcrowd</option>
                      <option value="medical">Medical / First Aid</option>
                      <option value="security">Security / Fights</option>
                      <option value="infrastructure">Elevator / Facility Outage</option>
                      <option value="lost_item">Lost & Found Item</option>
                      <option value="other">Other Incident</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-text-secondary uppercase mb-1 font-bold">Severity Level</label>
                    <select 
                      className="w-full bg-bg-base border border-border-subtle rounded-md px-3 h-10 text-xs text-text-primary focus:outline-none focus:border-brand-gold"
                      value={reportForm.severity}
                      onChange={(e) => setReportForm({...reportForm, severity: e.target.value})}
                      aria-label="Select incident severity"
                    >
                      <option value="low">Low (Standard Alert)</option>
                      <option value="medium">Medium (Requires Action)</option>
                      <option value="high">High (Immediate Response)</option>
                      <option value="critical">Critical (Life Safety / Fire)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-text-secondary uppercase mb-1 font-bold">Description & Location details</label>
                    <textarea 
                      className="w-full bg-bg-base border border-border-subtle rounded-md p-3 text-xs text-text-primary focus:outline-none focus:border-brand-gold h-24 resize-none"
                      placeholder="Specify landmarks, zone IDs, or ticket sections..."
                      value={reportForm.description}
                      onChange={(e) => setReportForm({...reportForm, description: e.target.value})}
                      required
                      aria-label="Write incident description"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-alert-danger hover:bg-alert-danger/90 text-text-primary font-outfit font-bold text-xs py-3 rounded-md transition-all duration-150 shadow-low"
                  >
                    Log Incident to Command Center
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>

        {/* Floating Bottom Nav drawer */}
        <nav 
          className="h-16 border-t border-border-subtle bg-bg-surface/75 backdrop-blur-md flex justify-around items-center sticky bottom-0 z-20"
          aria-label="Portal Navigation Tabs"
        >
          <button 
            className={clsx("flex flex-col items-center gap-1 text-[9px] font-semibold transition-colors duration-150", activeTab === "briefing" ? "text-brand-gold" : "text-text-secondary")}
            onClick={() => setActiveTab("briefing")}
            aria-label="Briefing tab"
          >
            <BookOpen className="w-5 h-5" />
            <span>Briefing</span>
          </button>
          <button 
            className={clsx("flex flex-col items-center gap-1 text-[9px] font-semibold transition-colors duration-150", activeTab === "tasks" ? "text-brand-gold" : "text-text-secondary")}
            onClick={() => setActiveTab("tasks")}
            aria-label="Tasks checklist tab"
          >
            <ClipboardList className="w-5 h-5" />
            <span>Tasks</span>
          </button>
          <button 
            className={clsx("flex flex-col items-center gap-1 text-[9px] font-semibold transition-colors duration-150", activeTab === "assistant" ? "text-brand-gold" : "text-text-secondary")}
            onClick={() => setActiveTab("assistant")}
            aria-label="SOP Assistant Q&A tab"
          >
            <MessageSquare className="w-5 h-5" />
            <span>SOP Help</span>
          </button>
          <button 
            className={clsx("flex flex-col items-center gap-1 text-[9px] font-semibold transition-colors duration-150", activeTab === "report" ? "text-brand-gold" : "text-text-secondary")}
            onClick={() => setActiveTab("report")}
            aria-label="Log incident alert tab"
          >
            <AlertTriangle className="w-5 h-5" />
            <span>Report</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
