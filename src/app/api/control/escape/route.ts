import { NextResponse } from 'next/server';
import { getEmulator } from '@/lib/simh';

export async function POST() {
  try {
    const emulator = getEmulator();
    if (!emulator?.isRunning()) {
      return NextResponse.json({ error: 'Emulator not running' }, { status: 503 });
    }
    emulator.sendEscape();
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
