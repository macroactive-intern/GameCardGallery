"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Category = {
  id: string;
  name: string;
  splitNames: string[];
};

type Game = {
  id: string;
  name: string;
  slug: string;
  categories: Category[];
};

export type ActiveCategory = {
  id: string;
  name: string;
  gameName: string;
  splitNames: string[];
  pbSplitTimes: number[] | null;
  goldSplitTimes: number[] | null;
};

type Props = {
  initialGames: Game[];
  userId: string | null;
  onConfigure: (cat: ActiveCategory) => void;
};

export function CategoryPicker({ initialGames, userId, onConfigure }: Props) {
  const [games, setGames] = useState<Game[]>(initialGames);
  const [creating, setCreating] = useState(initialGames.length === 0);
  const [newGameName, setNewGameName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newSplitsRaw, setNewSplitsRaw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function fetchPb(categoryId: string) {
    if (!userId) return { pbSplitTimes: null, goldSplitTimes: null };
    const res = await fetch(`/api/speedrun/pb?categoryId=${categoryId}`);
    if (!res.ok) return { pbSplitTimes: null, goldSplitTimes: null };
    const data = await res.json();
    return {
      pbSplitTimes: (data.pbRun?.splitTimes as number[] | null) ?? null,
      goldSplitTimes: (data.goldTimes as number[] | null) ?? null,
    };
  }

  async function handleSelect(game: Game, category: Category) {
    const pb = await fetchPb(category.id);
    onConfigure({
      id: category.id,
      name: category.name,
      gameName: game.name,
      splitNames: category.splitNames,
      ...pb,
    });
  }

  async function handleCreate() {
    const splitNames = newSplitsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (!newGameName.trim() || !newCategoryName.trim() || splitNames.length === 0) {
      setError("Game name, category name, and at least one split are required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/speedrun/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameName: newGameName.trim(),
          categoryName: newCategoryName.trim(),
          splitNames,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create");
        return;
      }

      const gamesRes = await fetch("/api/speedrun/games");
      const updatedGames: Game[] = await gamesRes.json();
      setGames(updatedGames);
      setCreating(false);

      onConfigure({
        id: data.category.id,
        name: data.category.name,
        gameName: data.game.name,
        splitNames: data.category.splitNames as string[],
        pbSplitTimes: null,
        goldSplitTimes: null,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {!creating && (
        <>
          {games.length > 0 ? (
            <div className="space-y-3">
              {games.map((game) => (
                <Card key={game.id}>
                  <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-sm font-semibold">
                      {game.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2 pb-4">
                    {game.categories.map((cat) => (
                      <Button
                        key={cat.id}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelect(game, cat)}
                      >
                        {cat.name}
                        <span className="ml-1.5 text-xs opacity-50">
                          {cat.splitNames.length} splits
                        </span>
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No games yet. Create one to get started.
            </p>
          )}

          <Button variant="outline" onClick={() => setCreating(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New game / category
          </Button>
        </>
      )}

      {creating && (
        <Card>
          <CardHeader className="pb-3 pt-4">
            <CardTitle className="text-sm">Create game &amp; category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pb-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Game name</label>
              <Input
                value={newGameName}
                onChange={(e) => setNewGameName(e.target.value)}
                placeholder="e.g. Super Mario Bros."
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Category</label>
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g. Any%, 100%, Glitchless"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Splits</label>
              <Input
                value={newSplitsRaw}
                onChange={(e) => setNewSplitsRaw(e.target.value)}
                placeholder="Comma-separated, e.g. World 1, World 2, Bowser"
              />
              <p className="text-xs text-muted-foreground">
                Separate split names with commas
              </p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-2 pt-1">
              <Button onClick={handleCreate} disabled={loading}>
                {loading ? "Creating…" : "Create & start"}
              </Button>
              {games.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setCreating(false);
                    setError("");
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
