export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initializeEmulator } = await import('@/lib/simh');
    try {
      await initializeEmulator('i650');
    } catch (error) {
      console.error('Failed to initialize SIMH emulator:', error);
    }
  }
}
