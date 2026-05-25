import { z } from "zod";

const currentYear = new Date().getFullYear();

export const gameSchema = z.object({
  slug: z.string(),
  title: z.string().min(2).max(80),
  platform: z.string().min(1),
  genre: z.string().min(1),
  tags: z.array(z.string()).max(8),
  rating: z
    .number()
    .min(1)
    .max(10)
    .refine((value) => Number.isInteger(value * 10), {
      message: "Rating must use at most one decimal place.",
    }),
  releaseYear: z.number().int().min(1970).max(currentYear),
  coverUrl: z.string().url(),
  description: z.string().min(20).max(500),
  featured: z.boolean().default(false),
});

export type Game = z.infer<typeof gameSchema>;

export type CreateGameInput = z.input<typeof gameSchema>;
export type UpdateGameInput = Partial<CreateGameInput>;
