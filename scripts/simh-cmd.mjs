#!/usr/bin/env node

import { createNodeSimhRuntime } from './simh-node-runtime.mjs';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: npm run simh:cmd -- "<SIMH command>"');
  process.exit(1);
}

const command = args.join(' ').trim();
if (!command) {
  console.error('SIMH command must be non-empty');
  process.exit(1);
}

try {
  const runtime = await createNodeSimhRuntime();
  const output = await runtime.runCommand(command);
  if (output.trim().length > 0) {
    process.stdout.write(`${output}\n`);
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
}
