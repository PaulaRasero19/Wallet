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

export async function askFinFlowAi(message: string) {
  return apiRequest<AiChatResponse>("/ai/chat", { body: { message }, method: "POST", requireAuth: true });
}
