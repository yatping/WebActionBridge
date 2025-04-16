export type ConnectionStatus = "connected" | "disconnected";
export type ActionStatus = "queued" | "in_progress" | "completed" | "failed";

export interface Action {
  id: string;
  code: string;
  status: ActionStatus;
  error?: string;
}

export interface Conversation {
  type: "user" | "agent" | "system";
  content: string;
  actions?: Action[];
}

export interface AgentResponse {
  content: string;
  actions: {
    id: string;
    code: string;
  }[];
}

export interface ActionResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface AgentFeedback {
  content: string;
  nextActions?: {
    id: string;
    code: string;
  }[];
}
