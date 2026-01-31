export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initializeEmulator, ConfigError } = await import('@/lib/simh');
    try {
      await initializeEmulator('i650');
    } catch (error) {
      if (error instanceof ConfigError) {
        console.error('⚠️', error.message);
      } else {
        console.error('Failed to initialize SIMH emulator:', error);
      }
      process.exit(1); // Exit the process with an error code
    }
  }
}
