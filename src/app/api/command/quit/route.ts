import { NextResponse } from 'next/server';
import { getEmulator } from '@/lib/simh';

const DEFAULT_TIMEOUT_MS = 1000;

function parseTimeout(): number {
  const raw = process.env.SIMH_QUIT_TIMEOUT_MS;
  const parsed = raw ? Number(raw) : NaN;
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return DEFAULT_TIMEOUT_MS;
}

export async function POST() {
  try {
    const emulator = getEmulator();
    if (!emulator?.isRunning()) {
      return NextResponse.json({ error: 'Emulator not running' }, { status: 503 });
    }

    const timeoutMs = parseTimeout();
    await emulator.quit(timeoutMs);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
