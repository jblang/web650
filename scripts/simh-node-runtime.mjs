import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');

export async function createNodeSimhRuntime(options = {}) {
  const outputLines = options.outputLines ?? [];
  const onOutputLine = options.onOutputLine ?? null;
  const require = createRequire(import.meta.url);
  const modulePath = path.join(publicDir, 'i650.js');
  const createModule = require(modulePath);

  const wasmModule = await createModule({
    noInitialRun: true,
    print: (text) => {
      outputLines.push(text);
      if (onOutputLine) onOutputLine(text);
    },
    printErr: (text) => {
      outputLines.push(text);
      if (onOutputLine) onOutputLine(text);
    },
    stdin: () => null,
    locateFile: (fileName) => path.join(publicDir, fileName),
  });

  const rcResult = wasmModule.ccall('simh_init', 'number', [], []);
  const rc = typeof rcResult === 'number' ? rcResult : await rcResult;
  if (rc !== 0) {
    throw new Error(`simh_init failed with code ${rc}`);
  }

  await wasmModule.ccall('simh_set_yield_enabled', 'void', ['number'], [0]);

  return {
    wasmModule,
    outputLines,
    async runCommand(command) {
      const normalized = command.trim();
      if (!normalized) {
        throw new TypeError('SIMH command must be non-empty');
      }
      const before = outputLines.length;
      await wasmModule.ccall('simh_cmd', 'number', ['string'], [normalized]);
      return outputLines.slice(before).join('\n');
    },
  };
}
