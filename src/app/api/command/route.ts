import { NextRequest, NextResponse } from 'next/server';
import { getEmulator } from '@/lib/simh';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { command, timeout, expectPrompt, appendCR } = body;

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

    const timeoutMs = typeof timeout === 'number' ? timeout : undefined;
    const output = await emulator.sendCommand(command, timeoutMs, expectPrompt, appendCR);

    return NextResponse.json({ output });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const isTimeout = message.includes('Timeout');
    return NextResponse.json(
      { error: message },
      { status: isTimeout ? 504 : 500 }
    );
  }
}
