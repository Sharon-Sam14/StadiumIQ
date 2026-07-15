import React, { useState, useCallback } from "react";
import {
  ClipboardList, AlertTriangle, HelpCircle, FileText, CheckCircle2,
  Clock, Zap, MapPin, Users, Check
} from "lucide-react";
import { AIBadge, SeverityBadge, StatusBadge } from "@/components/ui/Badge";
import { LoadingDots } from "@/components/ui/Skeleton";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import { WhistleAnimation } from "@/components/animations/WhistleAnimation";
import { sanitizeInput } from "@/utils/sanitize";
import { formatRelativeTime, generateId } from "@/utils/formatters";
import type { UseIncidentsReturn } from "@/hooks/useIncidents";
import type { RegisteredAccessibilityNeed } from "@/hooks/useAccessibilityNeeds";
import type { VolunteerTask, SOPChatMessage } from "@/types/volunteer";

// ============================================================
// VOLUNTEER PORTAL VIEW
// ============================================================

// ── Briefing Data ────────────────────────────────────────────
const SHIFT_BRIEFING_ITEMS = [
  {
    id: "brief-1",
    type: "surge",
    title: "Gate A Crowd Surge Alert",
    detail: "Gate A is at 92% capacity. Redirect all Section 200–250 fans to Gate B. Use radio Channel 4 for coordination.",
    severity: "high" as const,
  },
  {
    id: "brief-2",
    type: "info",
    title: "Halftime Vendor Advisory",
    detail: "Concourse 3 food vendor queues will peak at halftime. Guide fans to the West Concourse alternatives (Sections 112–115).",
    severity: "medium" as const,
  },
  {
    id: "brief-3",
    type: "info",
    title: "NJ Transit Post-Match Briefing",
    detail: "An extra 8 trains have been added post-match. Fans boarding at Gate C have shortest transit access. Begin guiding 10 minutes before final whistle.",
    severity: "low" as const,
  },
];

// ── Volunteer Tasks ─────────────────────────────────────────
const INITIAL_TASKS: VolunteerTask[] = [
  { id: "task-1", title: "Gate B Entry Management",     description: "Monitor Gate B occupancy and redirect overflow to Gate C when ≥80%.", priority: "urgent", status: "in_progress", zone: "Gate B",   assignedAt: new Date(Date.now() - 10 * 60000).toISOString() },
  { id: "task-2", title: "Section 200 Crowd Thinning",  description: "Guide fans away from aisle 12 (high congestion). Use alternative aisles 8 and 15.", priority: "high",   status: "pending",     zone: "Sec 200", assignedAt: new Date(Date.now() - 25 * 60000).toISOString() },
  { id: "task-3", title: "Eco Point QR Scan Support",   description: "Assist fans at the Green Zone recycling QR scan station in the North Plaza.", priority: "medium", status: "pending",     zone: "N. Plaza", assignedAt: new Date(Date.now() - 30 * 60000).toISOString() },
  { id: "task-4", title: "Accessibility Fan Escort",    description: "Escort wheelchair-user (Section 212) to their seat via Ramp B4.", priority: "high",   status: "pending",     zone: "Gate B Ramp", assignedAt: new Date(Date.now() - 5  * 60000).toISOString() },
];

// ── SOP Response Trees ────────────────────────────────────────
const SOP_RESPONSES: Record<string, string> = {
  default: "Hello! I'm your StadiumIQ SOP Assistant. Ask me about crowd surge procedures, medical response, lost items, fire evacuation, or accessible fan assistance.",
  surge: `**Crowd Surge SOP (Ref: CS-03)**\n\n1. Radio Control Room on Channel 2 immediately.\n2. Halt entry to congested gate — hold fans at 15-metre buffer.\n3. Deploy at least 2 stewards to fan-redirect corridor.\n4. Activate Gate B/C redirect advisory (System → Fan App Broadcast).\n5. Log incident in StadiumIQ portal.\n6. If density exceeds 95%: escalate to Security Lead immediately.`,
  medical: `**Medical Emergency SOP (Ref: ME-01)**\n\n1. Call Stadium Medical: ext. 911 (or radio Channel 1).\n2. Clear a 3-metre radius around the patient.\n3. Do NOT move the person unless there is immediate danger.\n4. If trained in CPR — begin if patient is unresponsive and not breathing.\n5. Guide medical team from entry gate (Gate D medical entrance).\n6. Document in incident log with time, location, and patient condition.`,
  lost: `**Lost Child Protocol (Ref: LC-02)**\n\n1. Keep the child in your current location — do not transport.\n2. Radio Child Welfare Team on Channel 6 immediately.\n3. Collect: child's name, parent/guardian description, section number.\n4. Activate Lost Child announcement via Control Room (Channel 2).\n5. Do not leave the child unattended under any circumstances.\n6. Maintain calm and reassuring presence until parent is reunited.`,
  fire: `**Fire / Smoke Evacuation SOP (Ref: EV-01)**\n\n1. Activate nearest fire alarm pull station.\n2. Radio Control Room: "Code Red [your location]" on Channel 2.\n3. Begin calm, directed evacuation to nearest exit — do not rush.\n4. Prioritise mobility-impaired fans — use designated evacuation chairs.\n5. Do not use elevators.\n6. Assemble at Muster Points A, B, C (outer perimeter parking lot).\n7. Report all clear or missing persons to Incident Commander.`,
  accessibility: `**Accessible Fan Assistance Protocol (Ref: AF-04)**\n\n1. Greet the fan professionally and ask how you can assist.\n2. Do not assume the type of assistance required — ask directly.\n3. Wheelchair users: use Ramps B2, B4, D1 (all ADA compliant). Avoid stairs.\n4. Visually impaired: offer verbal guidance, avoid touching without consent first.\n5. Hearing impaired: communicate in writing via phone notepad if needed.\n6. Priority seating areas are in Sections 110–115 (ground level).\n7. Log accessibility assistance in portal for follow-up if needed.`,
};

function getSopResponse(query: string): string {
  const lower = query.toLowerCase();
  if (lower.includes("surge") || lower.includes("crowd") || lower.includes("crush") || lower.includes("gate")) return SOP_RESPONSES.surge;
  if (lower.includes("medical") || lower.includes("hurt") || lower.includes("injury") || lower.includes("cpr") || lower.includes("faint")) return SOP_RESPONSES.medical;
  if (lower.includes("lost") || lower.includes("child") || lower.includes("missing")) return SOP_RESPONSES.lost;
  if (lower.includes("fire") || lower.includes("smoke") || lower.includes("evacuat")) return SOP_RESPONSES.fire;
  if (lower.includes("wheelchair") || lower.includes("accessible") || lower.includes("disability") || lower.includes("impair")) return SOP_RESPONSES.accessibility;
  return SOP_RESPONSES.default;
}

// ── Sub-Components ────────────────────────────────────────────

// Briefing Tab
function BriefingTab({ registeredNeeds }: { registeredNeeds: RegisteredAccessibilityNeed[] }) {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-2">
        <AIBadge label="AI-Generated Briefing" />
        <span className="text-[10px] text-[var(--text-tertiary)]">Generated at shift start • personalized to Zone Sec 200</span>
      </div>

      {/* Volunteer Profile */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-[var(--brand-gold)]/20 border border-[var(--brand-gold)]/30 flex items-center justify-center text-[var(--brand-gold)] font-display font-bold text-base">
            AO
          </div>
          <div>
            <p className="font-bold text-sm text-[var(--text-primary)]">Amirah Okonkwo</p>
            <p className="text-[10px] text-[var(--text-tertiary)]">Section 200–212 Gate Steward • Shift: 18:00–23:30</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
            <MapPin className="w-3 h-3 text-[var(--brand-gold)]" aria-hidden="true" /> Zone: Gate B / Sec 200–212
          </div>
          <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
            <Clock className="w-3 h-3 text-[var(--brand-gold)]" aria-hidden="true" /> Radio: Channel 4
          </div>
          <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
            <Users className="w-3 h-3 text-[var(--brand-gold)]" aria-hidden="true" /> Languages: English, French, Arabic
          </div>
          <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
            <Zap className="w-3 h-3 text-[var(--brand-gold)]" aria-hidden="true" /> Supervisor: Team Lead C
          </div>
        </div>
      </div>

      {/* Briefing Items */}
      {SHIFT_BRIEFING_ITEMS.map((item) => (
        <div
          key={item.id}
          className={`rounded-xl border p-4 ${
            item.severity === "high" ? "border-red-500/30 bg-red-900/15" :
            item.severity === "medium" ? "border-yellow-500/30 bg-yellow-900/15" :
            "border-[var(--border-subtle)] bg-[var(--bg-surface)]"
          }`}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${
              item.severity === "high" ? "text-red-400" :
              item.severity === "medium" ? "text-yellow-400" : "text-green-400"
            }`} aria-hidden="true" />
            <p className="font-bold text-xs text-[var(--text-primary)]">{item.title}</p>
            <SeverityBadge severity={item.severity} />
          </div>
          <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">{item.detail}</p>
        </div>
      ))}

      {/* Accessibility Needs from Fan Portal */}
      {registeredNeeds.length > 0 && (
        <div className="rounded-xl border border-[var(--brand-gold)]/25 bg-[var(--brand-gold)]/5 p-4 animate-slide-up">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-3.5 h-3.5 text-[var(--brand-gold)]" aria-hidden="true" />
            <p className="font-bold text-xs text-[var(--text-primary)]">
              Fan Accessibility Needs — Your Section
            </p>
            <span className="text-[9px] text-[var(--brand-gold)] bg-[var(--brand-gold)]/15 border border-[var(--brand-gold)]/25 px-2 py-0.5 rounded-full font-bold">
              NEW
            </span>
          </div>
          <p className="text-[10px] text-[var(--text-secondary)] mb-2">
            Fan Carlos Mendes (Sec 212, Row 12) has registered the following accessibility needs:
          </p>
          {registeredNeeds.map((need) => (
            <div key={need.need} className="flex items-center gap-2 text-[10px] text-[var(--text-primary)] py-1">
              <Check className="w-3 h-3 text-[var(--brand-gold)] shrink-0" aria-hidden="true" />
              <span className="capitalize">{need.need.replace(/_/g, " ")}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Tasks Tab
function TasksTab() {
  const [tasks, setTasks] = useState<VolunteerTask[]>(INITIAL_TASKS);

  const updateTaskStatus = useCallback((id: string, status: VolunteerTask["status"]): void => {
    setTasks((prev) =>
      prev.map((t) => t.id === id ? { ...t, status } : t)
    );
  }, []);

  const PRIORITY_COLORS: Record<string, string> = {
    urgent: "text-red-400 border-red-500/30 bg-red-900/20",
    high:   "text-orange-400 border-orange-500/30 bg-orange-900/20",
    medium: "text-yellow-400 border-yellow-500/30 bg-yellow-900/20",
    low:    "text-green-400 border-green-500/30 bg-green-900/20",
  };

  return (
    <div className="space-y-3 animate-fade-in">
      {tasks.map((task) => (
        <div
          key={task.id}
          className={`rounded-xl border p-4 transition-all ${
            task.status === "completed"
              ? "border-[#00a651]/30 bg-[#00a651]/5 opacity-80"
              : "border-[var(--border-subtle)] bg-[var(--bg-surface)]"
          }`}
        >
          <div className="flex items-start gap-3">
            <button
              onClick={() => updateTaskStatus(task.id, task.status === "completed" ? "pending" : "completed")}
              className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                task.status === "completed"
                  ? "border-[#00a651] bg-[#00a651]"
                  : "border-[var(--border-strong)] hover:border-green-500"
              }`}
              aria-label={task.status === "completed" ? `Mark task '${task.title}' incomplete` : `Mark task '${task.title}' complete`}
            >
              <WhistleAnimation active={task.status === "completed"} />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className={`font-bold text-xs ${task.status === "completed" ? "line-through text-[var(--text-tertiary)]" : "text-[var(--text-primary)]"}`}>
                  {task.title}
                </p>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border capitalize ${PRIORITY_COLORS[task.priority]}`}>
                  {task.priority}
                </span>
                <StatusBadge status={task.status} />
              </div>
              <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">{task.description}</p>
              <div className="flex items-center gap-3 mt-2 text-[9px] text-[var(--text-tertiary)]">
                <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5" aria-hidden="true" /> {task.zone}</span>
                <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" aria-hidden="true" /> {formatRelativeTime(task.assignedAt)}</span>
              </div>
            </div>
          </div>
          {task.status !== "completed" && task.status !== "in_progress" && (
            <button
              onClick={() => updateTaskStatus(task.id, "in_progress")}
              className="mt-3 w-full py-2 rounded-lg border border-blue-500/30 text-blue-400 text-[10px] font-bold hover:bg-blue-500/10 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              aria-label={`Start task: ${task.title}`}
            >
              Start Task
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// SOP Help Tab
function SOPHelpTab() {
  const [messages, setMessages] = useState<SOPChatMessage[]>([{
    id: generateId("sop"),
    role: "assistant",
    text: SOP_RESPONSES.default,
    timestamp: new Date().toISOString(),
  }]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = useCallback((): void => {
    const raw = input.trim();
    if (!raw) return;
    const sanitized = sanitizeInput(raw, 200);
    if (!sanitized) return;

    setMessages((prev) => [...prev, {
      id: generateId("sop"),
      role: "user",
      text: sanitized,
      timestamp: new Date().toISOString(),
    }]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const response = getSopResponse(sanitized);
      setMessages((prev) => [...prev, {
        id: generateId("sop"),
        role: "assistant",
        text: response,
        timestamp: new Date().toISOString(),
      }]);
      setIsTyping(false);
    }, 800);
  }, [input]);

  return (
    <div className="flex flex-col gap-3 animate-fade-in" style={{ minHeight: "400px" }}>
      <div className="flex items-center gap-2">
        <HelpCircle className="w-4 h-4 text-[var(--brand-gold)]" aria-hidden="true" />
        <span className="font-bold text-xs text-[var(--text-primary)]">SOP AI Assistant</span>
        <AIBadge label="Retrieval-Augmented" />
      </div>

      {/* Quick SOP Buttons */}
      <div className="flex flex-wrap gap-1.5">
        {[
          { label: "Crowd Surge", query: "crowd surge" },
          { label: "Medical",     query: "medical emergency" },
          { label: "Lost Child",  query: "lost child" },
          { label: "Fire/Evac",  query: "fire evacuation" },
          { label: "Accessibility", query: "wheelchair accessibility" },
        ].map(({ label, query }) => (
          <button
            key={label}
            onClick={() => { setInput(query); }}
            className="px-2.5 py-1 rounded-full border border-[var(--border-subtle)] text-[10px] font-semibold text-[var(--text-secondary)] hover:border-[var(--border-strong)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            aria-label={`Ask about ${label} SOP`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto min-h-0" aria-label="SOP chat conversation" aria-live="polite">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}>
            <span className="text-[9px] text-[var(--text-tertiary)] px-1">{msg.role === "user" ? "You" : "SOP Assistant"}</span>
            <div className={`px-4 py-3 rounded-2xl text-xs leading-relaxed max-w-[95%] whitespace-pre-line ${
              msg.role === "user"
                ? "bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-[var(--text-primary)] rounded-br-sm"
                : "bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-bl-sm"
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex flex-col items-start gap-1">
            <span className="text-[9px] text-[var(--text-tertiary)] px-1">SOP Assistant</span>
            <div className="px-4 py-3 rounded-2xl rounded-bl-sm border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
              <LoadingDots />
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-auto">
        <input
          type="text"
          placeholder="Ask about any SOP procedure..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 h-10 px-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--brand-gold)] focus-visible:outline-none transition-colors"
          aria-label="Ask the SOP assistant a question"
          maxLength={200}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="px-4 h-10 rounded-xl bg-[var(--brand-gold)] text-black font-bold text-xs disabled:opacity-40 hover:opacity-90 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          aria-label="Send SOP question"
        >
          Ask
        </button>
      </div>
    </div>
  );
}

// Report Incident Tab
function ReportIncidentTab({ incidentHook }: { incidentHook: UseIncidentsReturn }) {
  const { addIncident } = incidentHook;
  const [form, setForm] = useState({
    description: "",
    category: "crowd" as const,
    severity: "medium" as const,
    zone: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submittedId, setSubmittedId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.description.trim()) errs.description = "Description is required";
    else if (form.description.trim().length < 10) errs.description = "Please provide at least 10 characters";
    if (!form.zone.trim()) errs.zone = "Zone is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = useCallback(async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!validate()) return;

    const sanitizedDescription = sanitizeInput(form.description, 500);
    const sanitizedZone = sanitizeInput(form.zone, 100);

    try {
      const newIncident = await addIncident({
        description: sanitizedDescription,
        category: form.category,
        severity: form.severity,
        zone: sanitizedZone,
        reportedBy: "volunteer",
      });

      setSubmittedId(newIncident.id);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setForm({ description: "", category: "crowd", severity: "medium", zone: "" });
      }, 4000);
    } catch (err) {
      console.error("Failed to submit incident:", err);
    }
  }, [form, addIncident]);

  return (
    <div className="animate-fade-in">
      {submitted ? (
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center justify-center py-12 text-center"
        >
          <div className="w-14 h-14 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-7 h-7 text-green-400" aria-hidden="true" />
          </div>
          <h3 className="font-display font-bold text-base text-[var(--text-primary)] mb-1">
            Incident Reported
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mb-1">
            Incident ID: <strong className="text-[var(--brand-gold)] font-mono">{submittedId}</strong>
          </p>
          <p className="text-xs text-[var(--text-tertiary)]">
            Visible in Command Center within seconds.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" aria-label="Report new incident form" noValidate>
          <div>
            <label htmlFor="incident-description" className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              id="incident-description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Describe what you observed..."
              rows={4}
              maxLength={500}
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--brand-gold)] focus-visible:outline-none resize-none transition-colors"
              aria-required="true"
              aria-describedby={errors.description ? "desc-error" : undefined}
            />
            {errors.description && (
              <p id="desc-error" className="text-[10px] text-red-400 mt-1" role="alert">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="incident-category" className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Category</label>
              <select
                id="incident-category"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as typeof form.category }))}
                className="w-full h-9 px-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-xs text-[var(--text-primary)] focus:border-[var(--brand-gold)] focus-visible:outline-none"
              >
                <option value="crowd">Crowd</option>
                <option value="medical">Medical</option>
                <option value="security">Security</option>
                <option value="infrastructure">Infrastructure</option>
                <option value="lost_item">Lost Item</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="incident-severity" className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Severity</label>
              <select
                id="incident-severity"
                value={form.severity}
                onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value as typeof form.severity }))}
                className="w-full h-9 px-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-xs text-[var(--text-primary)] focus:border-[var(--brand-gold)] focus-visible:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="incident-zone" className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              Zone / Location <span className="text-red-400">*</span>
            </label>
            <input
              id="incident-zone"
              type="text"
              value={form.zone}
              onChange={(e) => setForm((f) => ({ ...f, zone: e.target.value }))}
              placeholder="e.g. Gate A, Section 212, Concourse 3..."
              maxLength={100}
              className="w-full h-9 px-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--brand-gold)] focus-visible:outline-none transition-colors"
              aria-required="true"
              aria-describedby={errors.zone ? "zone-error" : undefined}
            />
            {errors.zone && (
              <p id="zone-error" className="text-[10px] text-red-400 mt-1" role="alert">{errors.zone}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-[var(--brand-gold)] text-black font-display font-bold text-sm hover:opacity-90 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-gold)]"
            aria-label="Submit incident report"
          >
            Submit to Command Center
          </button>
        </form>
      )}
    </div>
  );
}

// ── Volunteer Portal Container ────────────────────────────────

type VolunteerTab = "briefing" | "tasks" | "sop" | "report";

interface VolunteerTabDef {
  readonly id: VolunteerTab;
  readonly label: string;
  readonly shortLabel: string;
  readonly icon: React.ReactNode;
}

const VOL_TABS: readonly VolunteerTabDef[] = [
  { id: "briefing", label: "AI Briefing",      shortLabel: "Briefing",  icon: <FileText      className="w-4 h-4" aria-hidden="true" /> },
  { id: "tasks",    label: "My Tasks",          shortLabel: "Tasks",     icon: <ClipboardList className="w-4 h-4" aria-hidden="true" /> },
  { id: "sop",      label: "SOP Assistant",     shortLabel: "SOP",       icon: <HelpCircle    className="w-4 h-4" aria-hidden="true" /> },
  { id: "report",   label: "Report Incident",   shortLabel: "Report",    icon: <AlertTriangle className="w-4 h-4" aria-hidden="true" /> },
] as const;

interface VolunteerPortalProps {
  readonly incidentHook: UseIncidentsReturn;
  readonly registeredNeeds: RegisteredAccessibilityNeed[];
}

export const VolunteerPortal = React.memo(function VolunteerPortal({
  incidentHook,
  registeredNeeds,
}: VolunteerPortalProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<VolunteerTab>("briefing");

  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <nav
        className="sticky top-0 z-20 glass-strong border-b border-[var(--border-subtle)] shrink-0"
        aria-label="Volunteer Portal navigation"
      >
        <div className="flex" role="tablist">
          {VOL_TABS.map((tab) => (
            <button
              key={tab.id}
              id={`vol-tab-${tab.id}`}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`vol-panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex-1 flex flex-col items-center gap-1 py-3 px-1 text-[10px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-gold)] ${
                activeTab === tab.id
                  ? "text-[var(--brand-gold)]"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[var(--brand-gold)]" aria-hidden="true" />
              )}
            </button>
          ))}
        </div>
      </nav>

      <div className="flex-1 overflow-y-auto scroll-thin">
        <div className="max-w-2xl mx-auto px-4 py-5">
          <div id="vol-panel-briefing" role="tabpanel" aria-labelledby="vol-tab-briefing" hidden={activeTab !== "briefing"}>
            {activeTab === "briefing" && (
              <ErrorBoundary viewName="AI Briefing">
                <BriefingTab registeredNeeds={registeredNeeds} />
              </ErrorBoundary>
            )}
          </div>
          <div id="vol-panel-tasks" role="tabpanel" aria-labelledby="vol-tab-tasks" hidden={activeTab !== "tasks"}>
            {activeTab === "tasks" && (
              <ErrorBoundary viewName="Tasks">
                <TasksTab />
              </ErrorBoundary>
            )}
          </div>
          <div id="vol-panel-sop" role="tabpanel" aria-labelledby="vol-tab-sop" hidden={activeTab !== "sop"}>
            {activeTab === "sop" && (
              <ErrorBoundary viewName="SOP Assistant">
                <SOPHelpTab />
              </ErrorBoundary>
            )}
          </div>
          <div id="vol-panel-report" role="tabpanel" aria-labelledby="vol-tab-report" hidden={activeTab !== "report"}>
            {activeTab === "report" && (
              <ErrorBoundary viewName="Report Incident">
                <ReportIncidentTab incidentHook={incidentHook} />
              </ErrorBoundary>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
