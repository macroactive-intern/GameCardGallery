"use client";

import { useEffect, useState } from "react";

type UnlockPayload = {
  achievement: { title: string };
  xpReward: number;
  levelledUp: boolean;
  newLevel?: number;
};

export function UnlockNotification() {
  const [event, setEvent] = useState<UnlockPayload | null>(null);

  useEffect(() => {
    const es = new EventSource("/api/achievements/stream");

    es.onmessage = (e: MessageEvent<string>) => {
      const data = JSON.parse(e.data) as { type?: string } & Partial<UnlockPayload>;
      if (data.type === "connected" || !data.achievement) return;
      setEvent(data as UnlockPayload);
      setTimeout(() => setEvent(null), 5000);
    };

    es.onerror = () => es.close();

    return () => es.close();
  }, []);

  if (!event) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-72 rounded-lg border bg-card p-4 shadow-xl">
      <p className="font-semibold text-card-foreground">Achievement Unlocked!</p>
      <p className="mt-1 text-sm font-medium">{event.achievement.title}</p>
      <p className="text-sm text-muted-foreground">+{event.xpReward} XP</p>
      {event.levelledUp && (
        <p className="mt-1 text-sm font-semibold text-primary">
          Level Up! → {event.newLevel}
        </p>
      )}
    </div>
  );
}
