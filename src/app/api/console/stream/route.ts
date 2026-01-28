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
      const send = (line: string) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(line)}\n\n`));
      };

      const offLine = onConsoleLine(send);
      const offExit = onConsoleExit((code) => {
        controller.enqueue(encoder.encode(`event: exit\ndata: ${JSON.stringify({ code })}\n\n`));
        controller.close();
      });

      controller.enqueue(encoder.encode(': connected\n\n')); // comment to keep connection open
      controller.enqueue(encoder.encode('retry: 1000\n\n')); // SSE retry suggestion

      const abortHandler = () => {
        offLine();
        offExit();
      };
      abortSignal.addEventListener('abort', abortHandler);

      // Ensure cleanup if consumer cancels
      cleanup = () => {
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
