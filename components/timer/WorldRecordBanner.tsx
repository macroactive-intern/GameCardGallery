"use client";

import { Trophy } from "lucide-react";

interface Props {
  isWR: boolean;
}

export function WorldRecordBanner({ isWR }: Props) {
  if (!isWR) return null;

  return (
    <div className="flex items-center justify-center gap-2 rounded-md bg-purple-500/10 px-4 py-3 text-purple-400 ring-1 ring-purple-500/30">
      <Trophy className="h-5 w-5 shrink-0" />
      <span className="text-sm font-semibold tracking-wide">
        New World Record!
      </span>
      <Trophy className="h-5 w-5 shrink-0" />
    </div>
  );
}
