import { NextRequest, NextResponse } from 'next/server';
import { getEmulator } from '@/lib/simh';

type Params = { params: { address: string } } | { params: Promise<{ address: string }> };

async function unwrapParams(input: Params): Promise<{ address: string }> {
  const { params } = input;
  if (params instanceof Promise) return params;
  return params;
}

export async function PUT(_req: NextRequest, paramsWrapper: Params) {
  try {
    const { address } = await unwrapParams(paramsWrapper);
    const emulator = getEmulator();
    if (!emulator?.isRunning()) {
      return NextResponse.json({ error: 'Emulator not running' }, { status: 503 });
    }
    const trimmed = address?.trim();
    if (!trimmed) {
      return NextResponse.json({ error: 'address is required' }, { status: 400 });
    }
    await emulator.sendCommand(`BREAK ${trimmed}`, { expectResponse: false });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, paramsWrapper: Params) {
  try {
    const { address } = await unwrapParams(paramsWrapper);
    const emulator = getEmulator();
    if (!emulator?.isRunning()) {
      return NextResponse.json({ error: 'Emulator not running' }, { status: 503 });
    }
    const trimmed = address?.trim();
    if (!trimmed) {
      return NextResponse.json({ error: 'address is required' }, { status: 400 });
    }
    await emulator.sendCommand(`NOBREAK ${trimmed}`, { expectResponse: false });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
