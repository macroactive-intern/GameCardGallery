import { afterEach, describe, expect, it, vi } from "vitest";

import { createGameSchema } from "./gameSchema";

const validGameInput = {
  title: "  Astral Forge  ",
  platform: "  PC  ",
  genre: "  Strategy  ",
  tags: [" space ", " tactical "],
  rating: 8.7,
  releaseYear: 2026,
  coverUrl: " https://picsum.photos/seed/schema-test/800/600 ",
  description:
    "  Command an orbital foundry and outmaneuver rivals across the stars.  ",
  featured: false,
};

describe("createGameSchema", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("trims string fields and tags", () => {
    const parsedGame = createGameSchema.parse(validGameInput);

    expect(parsedGame.title).toBe("Astral Forge");
    expect(parsedGame.platform).toBe("PC");
    expect(parsedGame.genre).toBe("Strategy");
    expect(parsedGame.tags).toEqual(["space", "tactical"]);
    expect(parsedGame.coverUrl).toBe(
      "https://picsum.photos/seed/schema-test/800/600",
    );
    expect(parsedGame.description).toBe(
      "Command an orbital foundry and outmaneuver rivals across the stars.",
    );
  });

  it("rejects ratings with more than one decimal place", () => {
    expect(() =>
      createGameSchema.parse({
        ...validGameInput,
        rating: 8.75,
      }),
    ).toThrow();
  });

  it("rejects more than 8 tags", () => {
    expect(() =>
      createGameSchema.parse({
        ...validGameInput,
        tags: ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine"],
      }),
    ).toThrow();
  });

  it("rejects cover URLs from unconfigured image hosts", () => {
    expect(() =>
      createGameSchema.parse({
        ...validGameInput,
        coverUrl: "https://example.com/game-cover.jpg",
      }),
    ).toThrow();
  });

  it("checks release year against the current year at parse time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T12:00:00Z"));

    expect(() =>
      createGameSchema.parse({
        ...validGameInput,
        releaseYear: 2027,
      }),
    ).toThrow();

    vi.setSystemTime(new Date("2027-01-01T12:00:00Z"));

    expect(
      createGameSchema.parse({
        ...validGameInput,
        releaseYear: 2027,
      }).releaseYear,
    ).toBe(2027);
  });
});
