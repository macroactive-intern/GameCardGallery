import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const redirectMock = vi.fn((path: string) => {
  throw new Error(`REDIRECT:${path}`);
});
const revalidatePathMock = vi.fn();
const createGameMock = vi.fn();
const updateGameMock = vi.fn();
const deleteGameMock = vi.fn();

class MockDuplicateSlugError extends Error {}
class MockGameDataError extends Error {}

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("@/lib/games", () => ({
  createGame: createGameMock,
  updateGame: updateGameMock,
  deleteGame: deleteGameMock,
  DuplicateSlugError: MockDuplicateSlugError,
  GameDataError: MockGameDataError,
}));

describe("game server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("delegates create validation to lib/games and redirects to the new detail page", async () => {
    const { createGameAction } = await import("./games");
    const payload = { title: "Test Game" };

    createGameMock.mockResolvedValueOnce({ slug: "test-game" });

    await expect(createGameAction(payload)).rejects.toThrow(
      "REDIRECT:/games/test-game",
    );
    expect(createGameMock).toHaveBeenCalledWith(payload);
    expect(revalidatePathMock).toHaveBeenCalledWith("/");
    expect(revalidatePathMock).toHaveBeenCalledWith("/games/[slug]", "page");
  });

  it("returns a safe duplicate-title error from create", async () => {
    const { createGameAction } = await import("./games");

    createGameMock.mockRejectedValueOnce(new MockDuplicateSlugError());

    await expect(createGameAction({ title: "Duplicate" })).resolves.toEqual({
      error: "A game with this title already exists.",
    });
  });

  it("returns invalid data for malformed update slugs", async () => {
    const { updateGameAction } = await import("./games");

    await expect(updateGameAction("", {})).resolves.toEqual({
      error: "Invalid game data.",
    });
    expect(updateGameMock).not.toHaveBeenCalled();
  });

  it("returns not found when update cannot find the game", async () => {
    const { updateGameAction } = await import("./games");

    updateGameMock.mockResolvedValueOnce(null);

    await expect(updateGameAction("missing-game", {})).resolves.toEqual({
      error: "Game not found.",
    });
  });

  it("redirects home after successful delete", async () => {
    const { deleteGameAction } = await import("./games");

    deleteGameMock.mockResolvedValueOnce(true);

    await expect(deleteGameAction("test-game")).rejects.toThrow("REDIRECT:/");
    expect(deleteGameMock).toHaveBeenCalledWith("test-game");
  });

  it("returns safe errors for malformed delete slugs and file failures", async () => {
    const { deleteGameAction, createGameAction } = await import("./games");

    await expect(deleteGameAction("")).resolves.toEqual({
      error: "Invalid game data.",
    });

    createGameMock.mockRejectedValueOnce(new MockGameDataError());

    await expect(createGameAction({ title: "Test" })).resolves.toEqual({
      error: "Unable to access game data.",
    });
  });

  it("maps zod errors to a generic safe message", async () => {
    const { createGameAction } = await import("./games");

    createGameMock.mockRejectedValueOnce(new z.ZodError([]));

    await expect(createGameAction({})).resolves.toEqual({
      error: "Invalid game data.",
    });
  });
});
