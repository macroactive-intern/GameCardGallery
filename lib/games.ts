import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import {
  gameSchema,
  type CreateGameInput,
  type Game,
  type UpdateGameInput,
} from "./gameSchema";

type CreateGameData = Omit<CreateGameInput, "slug">;
type UpdateGameData = Omit<UpdateGameInput, "slug">;

const gamesFilePath = path.join(process.cwd(), "data", "games.json");

function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function sortFeaturedFirst(games: Game[]): Game[] {
  return games
    .map((game, index) => ({ game, index }))
    .sort((a, b) => {
      const featuredSort = Number(b.game.featured) - Number(a.game.featured);

      return featuredSort || a.index - b.index;
    })
    .map(({ game }) => game);
}

function assertUniqueSlugs(games: Game[]): void {
  const slugs = new Set<string>();

  for (const game of games) {
    if (slugs.has(game.slug)) {
      throw new Error(`Duplicate game slug: ${game.slug}`);
    }

    slugs.add(game.slug);
  }
}

function assertSlugAvailable(
  games: Game[],
  slug: string,
  currentSlug?: string,
): void {
  const duplicate = games.some(
    (game) => game.slug === slug && game.slug !== currentSlug,
  );

  if (duplicate) {
    throw new Error(`Game slug already exists: ${slug}`);
  }
}

function isFileNotFoundError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

async function readGames(): Promise<Game[]> {
  try {
    const file = await readFile(gamesFilePath, "utf8");
    const games = gameSchema.array().parse(JSON.parse(file));

    assertUniqueSlugs(games);

    return games;
  } catch (error) {
    if (isFileNotFoundError(error)) {
      return [];
    }

    throw error;
  }
}

async function writeGames(games: Game[]): Promise<void> {
  assertUniqueSlugs(games);

  await mkdir(path.dirname(gamesFilePath), { recursive: true });
  await writeFile(gamesFilePath, `${JSON.stringify(games, null, 2)}\n`, "utf8");
}

export async function getGames(): Promise<Game[]> {
  return sortFeaturedFirst(await readGames());
}

export async function getGameBySlug(slug: string): Promise<Game | null> {
  const games = await readGames();

  return games.find((game) => game.slug === slug) ?? null;
}

export async function createGame(data: CreateGameData): Promise<Game> {
  const games = await readGames();
  const slug = createSlug(data.title);

  assertSlugAvailable(games, slug);

  const game = gameSchema.parse({
    ...data,
    slug,
  });

  await writeGames([...games, game]);

  return game;
}

export async function updateGame(
  slug: string,
  data: UpdateGameData,
): Promise<Game | null> {
  const games = await readGames();
  const gameIndex = games.findIndex((game) => game.slug === slug);

  if (gameIndex === -1) {
    return null;
  }

  const currentGame = games[gameIndex];
  const nextSlug = data.title ? createSlug(data.title) : currentGame.slug;

  assertSlugAvailable(games, nextSlug, currentGame.slug);

  const updatedGame = gameSchema.parse({
    ...currentGame,
    ...data,
    slug: nextSlug,
  });

  const updatedGames = games.with(gameIndex, updatedGame);

  await writeGames(updatedGames);

  return updatedGame;
}

export async function deleteGame(slug: string): Promise<boolean> {
  const games = await readGames();
  const nextGames = games.filter((game) => game.slug !== slug);

  if (nextGames.length === games.length) {
    return false;
  }

  await writeGames(nextGames);

  return true;
}

export async function getRelatedGames(slug: string): Promise<Game[]> {
  const currentGame = await getGameBySlug(slug);

  if (!currentGame) {
    return [];
  }

  const games = await getGames();

  return games
    .filter(
      (game) => game.slug !== currentGame.slug && game.genre === currentGame.genre,
    )
    .slice(0, 4);
}
