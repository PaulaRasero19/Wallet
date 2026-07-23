import { z } from "zod";

export const aiChatSchema = z.object({
  message: z.string().trim().min(1, "La pregunta es obligatoria.").max(1200),
  history: z.array(z.object({
    role: z.enum(["assistant", "user"]),
    text: z.string().trim().min(1).max(2000)
  })).max(12).default([])
});
