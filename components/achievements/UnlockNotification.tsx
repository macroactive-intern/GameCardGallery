"use client";

import { useEffect, useRef, useState } from "react";

type UnlockPayload = {
  achievement: { title: string };
  xpReward: number;
  levelledUp: boolean;
  newLevel?: number;
};

type ActiveEvent = UnlockPayload & { key: number };

export function UnlockNotification() {
  const [event, setEvent] = useState<ActiveEvent | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let counter = 0;
    const es = new EventSource("/api/achievements/stream");

    es.onmessage = (e: MessageEvent<string>) => {
      const data = JSON.parse(e.data) as { type?: string } & Partial<UnlockPayload>;
      if (data.type === "connected" || !data.achievement) return;

      if (timerRef.current) clearTimeout(timerRef.current);
      setEvent({ ...(data as UnlockPayload), key: ++counter });
      timerRef.current = setTimeout(() => setEvent(null), 5000);
    };

    es.onerror = () => es.close();

    return () => {
      es.close();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!event) return null;

  if (event.levelledUp) {
    return (
      <div
        key={event.key}
        className="animate-in zoom-in-95 fade-in fixed bottom-4 right-4 z-50 w-80 rounded-xl border-2 border-amber-400 bg-amber-50 p-5 shadow-2xl duration-300"
      >
        <div className="flex items-center gap-2">
          <span className="animate-bounce text-2xl">⭐</span>
          <p className="text-lg font-bold text-amber-700">
            Level Up! → {event.newLevel}
          </p>
        </div>
        <hr className="my-2 border-amber-200" />
        <p className="text-sm font-semibold text-amber-900">Achievement Unlocked</p>
        <p className="text-sm font-medium text-amber-800">{event.achievement.title}</p>
        <p className="text-sm text-amber-600">+{event.xpReward} XP</p>
      </div>
    );
  }

  return (
    <div
      key={event.key}
      className="animate-in slide-in-from-bottom-4 fade-in fixed bottom-4 right-4 z-50 w-72 rounded-lg border bg-card p-4 shadow-xl duration-300"
    >
      <p className="font-semibold text-card-foreground">Achievement Unlocked!</p>
      <p className="mt-1 text-sm font-medium">{event.achievement.title}</p>
      <p className="text-sm text-muted-foreground">+{event.xpReward} XP</p>
    </div>
  );
}
