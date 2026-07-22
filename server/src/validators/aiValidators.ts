import { z } from "zod";

export const aiChatSchema = z.object({
  message: z.string().trim().min(1, "La pregunta es obligatoria.").max(1200)
});
