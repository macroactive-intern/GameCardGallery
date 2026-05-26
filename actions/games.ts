"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  createGame,
  deleteGame,
  DuplicateSlugError,
  GameDataError,
  updateGame,
} from "@/lib/games";
import { gameSchema } from "@/lib/gameSchema";

const createGameActionSchema = gameSchema.omit({ slug: true }).strict();
const updateGameActionSchema = createGameActionSchema.partial().strict();
const slugSchema = z.string().trim().min(1);

type ActionResult = { success: true } | { error: string };

export type CreateGameActionInput = z.input<typeof createGameActionSchema>;
export type UpdateGameActionInput = z.input<typeof updateGameActionSchema>;

function revalidateGamePaths() {
  revalidatePath("/");
  revalidatePath("/games/[slug]", "page");
}

function getErrorMessage(error: unknown): string {
  if (error instanceof z.ZodError) {
    return "Invalid game data.";
  }

  if (error instanceof DuplicateSlugError) {
    return "A game with this title already exists.";
  }

  if (error instanceof GameDataError) {
    return "Unable to access game data.";
  }

  return "Something went wrong.";
}

export async function createGameAction(
  data: unknown,
): Promise<ActionResult> {
  let createdSlug = "";

  try {
    const validatedData = createGameActionSchema.parse(data);
    const game = await createGame(validatedData);

    createdSlug = game.slug;
    revalidateGamePaths();
  } catch (error) {
    return { error: getErrorMessage(error) };
  }

  redirect(`/games/${createdSlug}`);
}

export async function updateGameAction(
  slug: unknown,
  data: unknown,
): Promise<ActionResult> {
  try {
    const validatedSlug = slugSchema.parse(slug);
    const validatedData = updateGameActionSchema.parse(data);
    const updatedGame = await updateGame(validatedSlug, validatedData);

    if (!updatedGame) {
      return { error: "Game not found." };
    }

    revalidateGamePaths();

    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function deleteGameAction(slug: unknown): Promise<ActionResult> {
  try {
    const validatedSlug = slugSchema.parse(slug);
    const deletedGame = await deleteGame(validatedSlug);

    if (!deletedGame) {
      return { error: "Game not found." };
    }

    revalidateGamePaths();
  } catch (error) {
    return { error: getErrorMessage(error) };
  }

  redirect("/");
}
