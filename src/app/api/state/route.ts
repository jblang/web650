import { NextResponse } from 'next/server';
import { getEmulator } from '@/lib/simh';

export async function GET() {
  try {
    const emulator = getEmulator();
    if (!emulator?.isRunning()) {
      return NextResponse.json({ error: 'Emulator not running' }, { status: 503 });
    }

    const registers = await emulator.examineState('STATE');
    return NextResponse.json({ registers });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[api/state] failed', {
      ref: 'STATE',
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
