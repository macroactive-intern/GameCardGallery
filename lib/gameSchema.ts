import { z } from "zod";

const currentYear = new Date().getFullYear();

export const gameSchema = z
  .object({
    slug: z.string().trim().min(1),
    title: z
      .string()
      .trim()
      .min(2)
      .max(80)
      .regex(/[a-z0-9]/i, {
        message: "Title must include at least one letter or number.",
      }),
    platform: z.string().trim().min(1),
    genre: z.string().trim().min(1),
    tags: z.array(z.string().trim().min(1)).max(8),
    rating: z
      .number()
      .finite()
      .min(1)
      .max(10)
      .refine((value) => Number.isInteger(value * 10), {
        message: "Rating must use at most one decimal place.",
      }),
    releaseYear: z.number().int().min(1970).max(currentYear),
    coverUrl: z.string().trim().url(),
    description: z.string().trim().min(20).max(500),
    featured: z.boolean().default(false),
  })
  .strict();

export const createGameSchema = gameSchema.omit({ slug: true });
export const updateGameSchema = createGameSchema.partial();

export type Game = z.infer<typeof gameSchema>;

export type CreateGameInput = z.input<typeof createGameSchema>;
export type UpdateGameInput = z.input<typeof updateGameSchema>;
