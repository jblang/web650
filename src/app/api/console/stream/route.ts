import { NextRequest } from 'next/server';
import { onConsoleLine, onConsoleExit } from '@/lib/simh';

const encoder = new TextEncoder();

export const runtime = 'nodejs'; // ensure Node runtime for event stream
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const abortSignal = req.signal;

  let cleanup: (() => void) | undefined;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      const safeEnqueue = (payload: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(payload));
        } catch {
          closed = true;
          offLine();
          offExit();
        }
      };

      const send = (line: string) => {
        safeEnqueue(`data: ${JSON.stringify(line)}\n\n`);
      };

      const offLine = onConsoleLine(send);
      const offExit = onConsoleExit((code) => {
        if (closed) return;
        safeEnqueue(`event: exit\ndata: ${JSON.stringify({ code })}\n\n`);
        closed = true;
        controller.close();
        offLine();
        offExit();
      });

      safeEnqueue(': connected\n\n'); // comment to keep connection open
      safeEnqueue('retry: 1000\n\n'); // SSE retry suggestion

      const abortHandler = () => {
        closed = true;
        offLine();
        offExit();
      };
      abortSignal.addEventListener('abort', abortHandler);

      // Ensure cleanup if consumer cancels
      cleanup = () => {
        closed = true;
        offLine();
        offExit();
        abortSignal.removeEventListener('abort', abortHandler);
      };
    },
    cancel() {
      if (cleanup) cleanup();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}
