"use client";

import Sidebar from "@/components/Sidebar";
import Card from "@/components/Card";
import { 
  Users, 
  AlertOctagon, 
  Leaf, 
  Sparkles, 
  Send, 
  Mic, 
  Clock, 
  TrendingUp
} from "lucide-react";
import clsx from "clsx";

export default function DashboardPage() {
  const alerts = [
    { id: "INC-12", title: "Crowd surge at Gate A", severity: "high", status: "active", time: "19:30" },
    { id: "INC-13", title: "Elevator 4 malfunction", severity: "medium", status: "assigned", time: "19:28" },
    { id: "INC-14", title: "Smart Bin overflow (Sec 204)", severity: "low", status: "active", time: "19:20" }
  ];

  return (
    <div className="min-h-screen bg-bg-base flex" id="dashboard-root">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main content grid */}
      <main className="flex-1 pl-[280px] min-h-screen flex flex-col">
        {/* TopBar metrics header */}
        <header className="h-[72px] border-b border-border-subtle bg-bg-surface/30 px-8 flex justify-between items-center z-10 backdrop-blur-md">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-gold" />
              <span className="font-outfit font-bold tracking-wider text-sm">MATCH CLOCK:</span>
              <span className="font-mono text-alert-warning font-bold bg-bg-base/70 px-2.5 py-1 rounded border border-border-subtle text-xs">74:12</span>
            </div>
            <div className="h-4 w-px bg-border-subtle" />
            <div className="flex items-center gap-2 text-xs">
              <span className="text-text-secondary font-medium">STADIUM ATTENDANCE:</span>
              <span className="font-bold text-text-primary bg-bg-surface px-2 py-0.5 rounded border border-border-subtle">78,412 / 82,500</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-brand-green-deep/30 px-3 py-1 rounded-full border border-brand-green-light/40 text-[10px] text-text-primary font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-alert-success animate-pulse" />
              All Gates Operational
            </div>
            <button 
              className="bg-alert-danger hover:bg-alert-danger/85 text-text-primary px-4 py-2 font-outfit font-bold text-xs rounded-sm transition-all duration-200 shadow-low focus:outline-none focus:ring-2 focus:ring-alert-danger focus:ring-offset-2 focus:ring-offset-bg-base"
              onClick={() => console.log("ALERT: EMERGENCY ACTIVATED")}
              aria-label="Activate Emergency Protocols"
            >
              EMERGENCY
            </button>
          </div>
        </header>

        {/* Dashboard Workspace */}
        <div className="p-8 space-y-8 flex-1">
          {/* Top banner highlighting AI-guided incident extraction */}
          <div className="glass-panel p-6 rounded-md bg-gradient-to-r from-brand-green-deep/30 via-bg-surface/60 to-bg-surface border border-brand-green-light/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 rounded-md bg-brand-gold/10 border border-brand-gold/30 flex items-center justify-center text-brand-gold shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-outfit font-bold text-base text-text-primary flex items-center gap-2">
                  StadiumIQ AI Co-pilot Active
                </h2>
                <p className="text-xs text-text-secondary mt-1">
                  Crowd surge warnings running. Real-time predictive analytics models suggest gate redirection recommendations.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] bg-brand-gold/10 border border-brand-gold/30 text-brand-gold px-2.5 py-1 rounded font-bold uppercase tracking-wider">
                LSTM Predictor Enabled
              </span>
            </div>
          </div>

          {/* Core metrics layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <Card title="Crowd Intelligence" isHoverable={false}>
              <div className="space-y-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-2xl font-outfit font-extrabold text-text-primary">92%</span>
                  <span className="text-xs font-bold text-alert-warning bg-alert-warning/10 px-2 py-0.5 rounded border border-alert-warning/20">ORANGE SURGE</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <TrendingUp className="w-4 h-4 text-alert-warning" />
                  <span>Surge threat warning: Gate A pathing</span>
                </div>
                <div className="h-1.5 w-full bg-bg-surface rounded-full overflow-hidden">
                  <div className="h-full bg-alert-warning rounded-full" style={{ width: "92%" }} />
                </div>
              </div>
            </Card>

            <Card title="Active Incidents" isHoverable={false}>
              <div className="space-y-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-2xl font-outfit font-extrabold text-text-primary">3</span>
                  <span className="text-xs font-bold text-alert-danger bg-alert-danger/10 px-2 py-0.5 rounded border border-alert-danger/20">HIGH RISK</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <AlertOctagon className="w-4 h-4 text-alert-danger" />
                  <span>2 medical, 1 infrastructure logs</span>
                </div>
                <div className="h-1.5 w-full bg-bg-surface rounded-full overflow-hidden">
                  <div className="h-full bg-alert-danger rounded-full" style={{ width: "60%" }} />
                </div>
              </div>
            </Card>

            <Card title="Volunteer Activity" isHoverable={false}>
              <div className="space-y-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-2xl font-outfit font-extrabold text-text-primary">342</span>
                  <span className="text-xs font-bold text-alert-success bg-alert-success/10 px-2 py-0.5 rounded border border-alert-success/20">87% Active</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <Users className="w-4 h-4 text-alert-success" />
                  <span>342 checked in, 48 on standby</span>
                </div>
                <div className="h-1.5 w-full bg-bg-surface rounded-full overflow-hidden">
                  <div className="h-full bg-alert-success rounded-full" style={{ width: "87%" }} />
                </div>
              </div>
            </Card>

            <Card title="Sustainability Load" isHoverable={false}>
              <div className="space-y-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-2xl font-outfit font-extrabold text-text-primary">1.4 MW</span>
                  <span className="text-xs font-bold text-alert-info bg-alert-info/10 px-2 py-0.5 rounded border border-alert-info/20">Normal Load</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <Leaf className="w-4 h-4 text-alert-success" />
                  <span>Waste bin levels: 62% average</span>
                </div>
                <div className="h-1.5 w-full bg-bg-surface rounded-full overflow-hidden">
                  <div className="h-full bg-alert-info rounded-full" style={{ width: "62%" }} />
                </div>
              </div>
            </Card>
          </div>

          {/* Central Workspace divided in two: Incident Feed on Left, AI Copilot Chat on Right */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Real-time incident logs queue */}
            <div className="xl:col-span-2 space-y-6">
              <Card title="Incident Queue Log">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse" aria-label="Current Incident Log">
                    <thead>
                      <tr className="border-b border-border-strong text-text-secondary text-[11px] font-bold tracking-wider uppercase bg-bg-surface/30">
                        <th className="py-3 px-4">ID</th>
                        <th className="py-3 px-4">Description</th>
                        <th className="py-3 px-4">Severity</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Reported</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle text-xs">
                      {alerts.map((alert) => (
                        <tr key={alert.id} className="hover:bg-bg-surface/10 transition-colors duration-150">
                          <td className="py-3 px-4 font-mono font-semibold text-brand-gold">{alert.id}</td>
                          <td className="py-3 px-4 text-text-primary">{alert.title}</td>
                          <td className="py-3 px-4">
                            <span className={clsx(
                              "px-2 py-0.5 rounded font-bold uppercase text-[10px] border",
                              alert.severity === "high" && "bg-alert-danger/10 text-alert-danger border-alert-danger/20",
                              alert.severity === "medium" && "bg-alert-warning/10 text-alert-warning border-alert-warning/20",
                              alert.severity === "low" && "bg-alert-success/10 text-alert-success border-alert-success/20"
                            )}>
                              {alert.severity}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-text-secondary capitalize">{alert.status}</td>
                          <td className="py-3 px-4 text-text-tertiary font-mono">{alert.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* AI Assistant Chat view panel */}
            <div className="xl:col-span-1">
              <Card title="AI Operations Advisor">
                <div className="flex flex-col h-[340px] justify-between">
                  {/* Mock Conversation Threads */}
                  <div className="space-y-3 overflow-y-auto pr-1 text-xs">
                    <div className="flex flex-col gap-1.5 items-end">
                      <span className="text-[9px] text-text-tertiary">Carlos Mendes (Ops)</span>
                      <div className="bg-bg-surface border border-border-strong text-text-primary p-3 rounded-md max-w-[85%]">
                        What is causing the crowd delay warnings at Gate A right now?
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 items-start">
                      <div className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
                        <span className="text-[9px] text-brand-gold font-bold">StadiumIQ AI</span>
                      </div>
                      <div className="bg-brand-green-deep/20 border border-brand-green-light/30 text-text-primary p-3 rounded-md max-w-[90%] space-y-2">
                        <p>Real-time telemetry reports a flow slowdown (Gate A check-in rate decreased by 35% over 5 minutes).</p>
                        <p className="font-semibold text-brand-gold">Suggested Action:</p>
                        <ul className="list-disc list-inside space-y-1 text-text-secondary">
                          <li>Reroute incoming fans via Gate B.</li>
                          <li>Open volunteer overflow channels.</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Message Input Box */}
                  <div className="mt-4 flex gap-2">
                    <div className="flex-1 bg-bg-base border border-border-subtle rounded-md flex items-center px-3 gap-2 focus-within:border-brand-gold transition-colors duration-200">
                      <input 
                        type="text"
                        placeholder="Ask AI Copilot..."
                        className="w-full bg-transparent border-none text-xs text-text-primary focus:outline-none h-9"
                        aria-label="Write operational query to AI"
                      />
                      <button className="text-text-secondary hover:text-text-primary" aria-label="Speak operational query">
                        <Mic className="w-4 h-4" />
                      </button>
                    </div>
                    <button 
                      className="bg-brand-gold hover:bg-brand-gold/90 text-bg-base p-2.5 rounded-md flex items-center justify-center transition-colors duration-150"
                      aria-label="Send message"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
