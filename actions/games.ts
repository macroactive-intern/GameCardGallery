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
import {
  createGameSchema,
  updateGameSchema,
} from "@/lib/gameSchema";

const slugSchema = z.string().trim().min(1);

type ActionResult = { success: true } | { error: string };

export type CreateGameActionInput = z.input<typeof createGameSchema>;
export type UpdateGameActionInput = z.input<typeof updateGameSchema>;

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
    const game = await createGame(data);

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
    const updatedGame = await updateGame(validatedSlug, data);

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
