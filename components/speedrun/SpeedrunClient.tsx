"use client";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useTimerStore } from "@/lib/speedrun/store";
import { useTimerRaf } from "@/lib/speedrun/useTimerRaf";
import { CategoryPicker, type ActiveCategory } from "./CategoryPicker";
import { TimerDisplay } from "./TimerDisplay";
import { SplitList } from "./SplitList";
import { Controls } from "./Controls";
import { RunSummary } from "./RunSummary";
import { Button } from "@/components/ui/button";

type Game = {
  id: string;
  name: string;
  slug: string;
  categories: { id: string; name: string; splitNames: string[] }[];
};

type Props = {
  userId: string | null;
  initialGames: Game[];
};

export function SpeedrunClient({ userId, initialGames }: Props) {
  useTimerRaf();

  const configure = useTimerStore((s) => s.actions.configure);
  const status = useTimerStore((s) => s.status);

  const [activeCategory, setActiveCategory] = useState<ActiveCategory | null>(
    null,
  );

  function handleConfigure(cat: ActiveCategory) {
    setActiveCategory(cat);
    configure(cat.splitNames, cat.pbSplitTimes, cat.goldSplitTimes);
  }

  function handleBack() {
    configure([], null, null);
    setActiveCategory(null);
  }

  if (!activeCategory) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Select game &amp; category</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a game and category to start timing, or create a new one.
          </p>
        </div>
        <CategoryPicker
          initialGames={initialGames}
          userId={userId}
          onConfigure={handleConfigure}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Change
        </Button>
        <div className="text-sm">
          <span className="font-medium">{activeCategory.gameName}</span>
          <span className="mx-1.5 text-muted-foreground">·</span>
          <span className="text-muted-foreground">{activeCategory.name}</span>
        </div>
      </div>

      <div className="flex items-center justify-center py-8">
        <TimerDisplay />
      </div>

      <SplitList />
      <Controls />

      {status === "finished" && (
        <RunSummary
          userId={userId}
          categoryId={activeCategory.id}
          categoryName={activeCategory.name}
          gameName={activeCategory.gameName}
        />
      )}
    </div>
  );
}
