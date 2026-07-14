// ============================================================
// VOLUNTEER TYPES
// ============================================================

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";

export interface VolunteerTask {
  readonly id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  zone: string;
  assignedAt: string;
  dueAt?: string;
}

export type TaskAction =
  | { type: "UPDATE_STATUS"; payload: { id: string; status: TaskStatus } }
  | { type: "ADD_TASK"; payload: VolunteerTask };

export interface VolunteerProfile {
  readonly id: string;
  readonly name: string;
  readonly section: string;
  readonly role: string;
  readonly shiftStart: string;
  readonly shiftEnd: string;
  readonly languages: string[];
  readonly zone: string;
}

export interface ShiftBriefingItem {
  readonly id: string;
  readonly type: "surge" | "language" | "accessibility" | "info";
  readonly title: string;
  readonly detail: string;
  readonly severity?: "low" | "medium" | "high";
}

export interface SOPChatMessage {
  readonly id: string;
  readonly role: "user" | "assistant";
  readonly text: string;
  readonly contextChunks?: SOPContextChunk[];
  readonly timestamp: string;
}

export interface SOPContextChunk {
  readonly similarity: number;
  readonly content: string;
  readonly sourceDoc: string;
}
