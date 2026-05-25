import { z } from "zod";

export const gameSchema = z.object({
  slug: z.string(),
  title: z.string(),
});

export type GameInput = z.infer<typeof gameSchema>;
