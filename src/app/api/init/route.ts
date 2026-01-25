import { NextResponse } from 'next/server';
import { getEmulator, SimhEmulator } from '@/lib/simh';

export async function POST() {
  try {
    // Stop any existing emulator
    const existingEmulator = getEmulator();
    if (existingEmulator) {
      existingEmulator.stop();
    }

    // Start a fresh emulator instance
    const emulator = new SimhEmulator('i650');
    const output = await emulator.start();

    // Store the emulator in globalThis
    const g = globalThis as unknown as { simhEmulator?: SimhEmulator };
    g.simhEmulator = emulator;

    return NextResponse.json({ output });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
