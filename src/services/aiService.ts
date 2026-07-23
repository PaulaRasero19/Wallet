import { apiRequest } from "./apiClient";

export type AiBlock = {
  title: string;
  rows: string[];
};

export type AiChatResponse = {
  text: string;
  provider: "gemini" | "finflow";
  blocks: AiBlock[];
};

export type AiConversationMessage = { role: "assistant" | "user"; text: string };

export async function askFinFlowAi(message: string, history: AiConversationMessage[] = []) {
  return apiRequest<AiChatResponse>("/ai/chat", { body: { history: history.slice(-12), message }, method: "POST", requireAuth: true });
}
