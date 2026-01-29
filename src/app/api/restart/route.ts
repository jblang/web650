import { NextResponse } from 'next/server';
import { attachConsoleBuffer, getEmulator, SimhEmulator } from '@/lib/simh';

const DEFAULT_TIMEOUT_MS = 1000;

function parseTimeout(): number {
  const raw = process.env.SIMH_QUIT_TIMEOUT_MS;
  const parsed = raw ? Number(raw) : NaN;
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return DEFAULT_TIMEOUT_MS;
}

export async function POST() {
  try {
    const existing = getEmulator();
    const timeoutMs = parseTimeout();

    if (existing?.isRunning()) {
      console.log('[restart] quitting existing emulator');
      await existing.quit(timeoutMs);
      console.log('[restart] quit complete');
    } else if (existing) {
      console.log('[restart] killing stale emulator');
      existing.kill();
    }

    const emulator = new SimhEmulator('i650');
    console.log('[restart] starting new emulator');
    attachConsoleBuffer(emulator);
    const output = await emulator.start();
    console.log('[restart] new emulator started');

    const g = globalThis as unknown as { simhEmulator?: SimhEmulator };
    g.simhEmulator = emulator;

    return NextResponse.json({ output });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
