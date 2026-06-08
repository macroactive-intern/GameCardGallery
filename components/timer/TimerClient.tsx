"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { useTimerStore } from "@/store/timerStore";
import { useTimer } from "@/hooks/useTimer";
import { useSplits } from "@/hooks/useSplits";
import { useHotkeys } from "@/hooks/useHotkeys";
import { loadPbs, computeFinalStats, type FinalStats, type Split } from "@/lib/timer/splits";
import { TimerDisplay } from "./TimerDisplay";
import { SplitTable } from "./SplitTable";
import { HotkeyHints } from "./HotkeyHints";
import { RunSummary } from "./RunSummary";
import { WorldRecordBanner } from "./WorldRecordBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ── Shared types ─────────────────────────────────────────────────────────────

type Category = { id: string; name: string; splitNames: string[] };
type Game = { id: string; name: string; slug: string; categories: Category[] };

interface ActiveConfig {
  game: string;
  category: string;
  initialSplits: Split[];
  pbMs: number | null;
  pbSegments: Array<number | null>;
}

// ── Setup form ────────────────────────────────────────────────────────────────

function SetupForm({
  games,
  userId,
  onStart,
}: {
  games: Game[];
  userId: string | null;
  onStart: (config: ActiveConfig) => void;
}) {
  const [gameName, setGameName] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [splitsInput, setSplitsInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const matchedGame = games.find(
    (g) => g.name.toLowerCase() === gameName.toLowerCase(),
  );
  const matchedCategory = matchedGame?.categories.find(
    (c) => c.name.toLowerCase() === categoryName.toLowerCase(),
  );

  useEffect(() => {
    if (matchedCategory) {
      setSplitsInput(matchedCategory.splitNames.join(", "));
    }
  }, [matchedCategory]);

  async function handleStart() {
    const splitNames = splitsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (!gameName.trim()) { setError("Game name is required."); return; }
    if (!categoryName.trim()) { setError("Category is required."); return; }
    if (splitNames.length === 0) { setError("At least one split is required."); return; }

    setLoading(true);
    setError("");

    try {
      if (!matchedCategory) {
        const res = await fetch("/api/speedrun/games", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gameName: gameName.trim(),
            categoryName: categoryName.trim(),
            splitNames,
          }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok && res.status !== 409) {
          setError(data.error ?? "Failed to create game / category");
          return;
        }
      }

      let pbMs: number | null = null;
      let pbSegments: Array<number | null> = [];

      if (userId) {
        const pbRes = await fetch(
          `/api/runs?game=${encodeURIComponent(gameName.trim())}&category=${encodeURIComponent(categoryName.trim())}`,
        );
        if (pbRes.ok) {
          const runs = (await pbRes.json()) as Array<{ totalMs: number; splits: unknown }>;
          const pb = loadPbs(runs);
          pbMs = pb.bestTotalMs;
          pbSegments = pb.bestSegments;
        }
      }

      const initialSplits: Split[] = splitNames.map((name, i) => ({
        name,
        elapsed: null,
        segmentMs: null,
        pbSegmentMs: pbSegments[i] ?? null,
        deltaMs: null,
        isGold: false,
      }));

      onStart({ game: gameName.trim(), category: categoryName.trim(), initialSplits, pbMs, pbSegments });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Set up your run</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick an existing category or create a new one.
        </p>
      </div>

      {games.length > 0 && (
        <div className="space-y-3">
          {games.map((game) => (
            <Card key={game.id} className="overflow-hidden">
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="text-sm font-semibold">{game.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2 pb-3">
                {game.categories.map((cat) => (
                  <Button
                    key={cat.id}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setGameName(game.name);
                      setCategoryName(cat.name);
                      setSplitsInput(cat.splitNames.join(", "));
                    }}
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
      )}

      <Card>
        <CardHeader className="pb-3 pt-4">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Plus className="h-4 w-4" />
            Custom / new
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pb-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Game</label>
            <Input
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              placeholder="e.g. Super Mario Bros."
              list="timer-game-list"
            />
            <datalist id="timer-game-list">
              {games.map((g) => (
                <option key={g.id} value={g.name} />
              ))}
            </datalist>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Category</label>
            <Input
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g. Any%, 100%, Glitchless"
              list="timer-category-list"
            />
            <datalist id="timer-category-list">
              {(matchedGame?.categories ?? []).map((c) => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Splits</label>
            <Input
              value={splitsInput}
              onChange={(e) => setSplitsInput(e.target.value)}
              placeholder="World 1, World 2, Bowser"
            />
            <p className="text-xs text-muted-foreground">Comma-separated split names</p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            onClick={handleStart}
            disabled={loading || !gameName.trim() || !categoryName.trim() || !splitsInput.trim()}
            className="w-full"
          >
            {loading ? "Setting up…" : "Start Timer"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Timer view ────────────────────────────────────────────────────────────────

function TimerView({
  userId,
  config,
  onReset,
}: {
  userId: string | null;
  config: ActiveConfig;
  onReset: () => void;
}) {
  const [finalStats, setFinalStats] = useState<FinalStats | null>(null);
  const [savedIsWR, setSavedIsWR] = useState(false);
  const finishedRef = useRef(false);

  const setGame = useTimerStore((s) => s.setGame);
  const setCategory = useTimerStore((s) => s.setCategory);
  const setSplits = useTimerStore((s) => s.setSplits);
  const status = useTimerStore((s) => s.status);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setGame(config.game);
    setCategory(config.category);
    setSplits(config.initialSplits);
  }, []); // intentionally empty — config is stable for this view's lifetime

  useEffect(() => {
    if (status === "finished" && !finishedRef.current) {
      finishedRef.current = true;
      const { splits } = useTimerStore.getState();
      setFinalStats(computeFinalStats(splits, config.pbMs));
    }
  }, [status, config.pbMs]);

  const timerActions = useTimer();
  // useSplits wired for programmatic use; hotkey flow goes through store directly
  useSplits(timerActions, config.pbSegments, config.pbMs);
  const { hotkeys, remap } = useHotkeys(timerActions);

  function handleReset() {
    timerActions.reset();
    onReset();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={handleReset}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Change
        </Button>
        <div className="text-sm">
          <span className="font-medium">{config.game}</span>
          <span className="mx-1.5 text-muted-foreground">·</span>
          <span className="text-muted-foreground">{config.category}</span>
        </div>
      </div>

      {savedIsWR && <WorldRecordBanner isWR />}

      <div className="flex items-center justify-center py-8">
        <TimerDisplay />
      </div>

      <SplitTable />

      <HotkeyHints hotkeys={hotkeys} remap={remap} />

      {status === "finished" && finalStats && (
        <RunSummary
          stats={finalStats}
          userId={userId}
          game={config.game}
          category={config.category}
          onReset={handleReset}
          onSaved={(isWR) => setSavedIsWR(isWR)}
        />
      )}
    </div>
  );
}

// ── Root client shell ─────────────────────────────────────────────────────────

export function TimerClient({
  userId,
  initialGames,
}: {
  userId: string | null;
  initialGames: Game[];
}) {
  const [config, setConfig] = useState<ActiveConfig | null>(null);

  if (!config) {
    return (
      <SetupForm games={initialGames} userId={userId} onStart={setConfig} />
    );
  }

  return (
    <TimerView
      key={`${config.game}__${config.category}`}
      userId={userId}
      config={config}
      onReset={() => setConfig(null)}
    />
  );
}
