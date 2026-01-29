import { NextRequest, NextResponse } from 'next/server';
import { getEmulator } from '@/lib/simh';

type Params = { params: { ref: string } } | { params: Promise<{ ref: string }> };

async function unwrapParams(input: Params): Promise<{ ref: string }> {
  const { params } = input;
  if (params instanceof Promise) {
    return params;
  }
  return params;
}

export async function GET(_req: NextRequest, paramsWrapper: Params) {
  try {
    const { ref } = await unwrapParams(paramsWrapper);
    const emulator = getEmulator();
    if (!emulator?.isRunning()) {
      return NextResponse.json({ error: 'Emulator not running' }, { status: 503 });
    }

    const registers = await emulator.examineState(ref);
    return NextResponse.json({ registers });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, paramsWrapper: Params) {
  try {
    const { ref } = await unwrapParams(paramsWrapper);
    const emulator = getEmulator();
    if (!emulator?.isRunning()) {
      return NextResponse.json({ error: 'Emulator not running' }, { status: 503 });
    }

    const body: unknown = await request.json();
    const value = typeof body === 'object' && body && 'value' in body ? (body as { value?: unknown }).value : undefined;
    if (typeof value !== 'string') {
      return NextResponse.json({ error: 'value must be a string' }, { status: 400 });
    }

    await emulator.depositState(ref, value);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
