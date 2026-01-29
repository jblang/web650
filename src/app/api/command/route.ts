import { NextRequest, NextResponse } from 'next/server';
import { getEmulator } from '@/lib/simh';

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { command, appendCR, expectResponse } = body as {
      command?: unknown;
      appendCR?: unknown;
      expectResponse?: unknown;
    };

    if (typeof command !== 'string') {
      return NextResponse.json(
        { error: 'Command must be a string' },
        { status: 400 }
      );
    }

    const emulator = getEmulator();

    if (!emulator?.isRunning()) {
      return NextResponse.json(
        { error: 'Emulator not running' },
        { status: 503 }
      );
    }

    const output = await emulator.sendCommand(command, {
      appendCR,
      // Default to stream-only responses to avoid duplicate output (SSE already delivers lines).
      expectResponse: expectResponse !== undefined ? expectResponse : false,
    });

    return NextResponse.json({ output });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
