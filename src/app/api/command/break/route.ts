import { NextResponse } from 'next/server';
import { getEmulator } from '@/lib/simh';

export async function GET() {
  try {
    const emulator = getEmulator();
    if (!emulator?.isRunning()) {
      return NextResponse.json({ error: 'Emulator not running' }, { status: 503 });
    }
    const breaks = await emulator.getBreakpoints();
    return NextResponse.json({ breakpoints: breaks });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Clear all breakpoints
export async function DELETE() {
  try {
    const emulator = getEmulator();
    if (!emulator?.isRunning()) {
      return NextResponse.json({ error: 'Emulator not running' }, { status: 503 });
    }

    await emulator.sendCommand('NOBREAK 0-9999', { expectResponse: false });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
