import { requireAuth } from "@/lib/auth/session";
import { achievementEmitter } from "@/lib/achievements/emitter";

export async function GET() {
  const session = await requireAuth();
  const userId = session.user.id;

  const encoder = new TextEncoder();

  let cleanup: () => void;

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
        );
      };

      send({ type: "connected" });

      const handler = (data: unknown) => send(data);
      achievementEmitter.on(`unlock:${userId}`, handler);
      cleanup = () => achievementEmitter.off(`unlock:${userId}`, handler);
    },
    cancel() {
      cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
