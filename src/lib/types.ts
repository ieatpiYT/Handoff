export type ModelOption = { id: string; provider: string; name: string; label: string; accent: string };
export const MODELS: ModelOption[] = [
  { id: "gpt", provider: "openai", name: "gpt-4o", label: "GPT-4o", accent: "violet" },
  { id: "claude", provider: "anthropic", name: "claude-sonnet-4-20250514", label: "Claude Sonnet", accent: "orange" },
  { id: "gemini", provider: "google", name: "gemini-2.5-flash", label: "Gemini 2.5", accent: "blue" },
];
export type Project = { id: string; name: string; description: string; assistantId: string; createdAt: string };
export type Session = { id: string; projectId: string; participantName: string; modelProvider: string; modelName: string; threadId: string; startedAt: string; endedAt?: string };
export type Handoff = { id: string; projectId: string; sessionId: string; participantName: string; modelName: string; done: string[]; decided: string[]; inProgress: string[]; blockers: string[]; nextSteps: string[]; createdAt: string };
export type Message = { id: string; sessionId: string; role: "user" | "assistant"; content: string; modelName: string; createdAt: string };
export type Store = { projects: Project[]; sessions: Session[]; handoffs: Handoff[]; messages: Message[] };
