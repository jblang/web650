const os = require("os");
const { exec } = require("child_process");

// This is necessary to fix a bug in node-pty that causes the following error on startup:
//
// Error: Failed to spawn: posix_spawnp failed.
//     at <unknown> (src/lib/simh.ts:161:16)
//     at new Promise (<anonymous>)
//     at SimhEmulator.start (src/lib/simh.ts:150:12)
//     at initializeEmulator (src/lib/simh.ts:608:24)
//     at Module.register (src/instrumentation.ts:5:13)
//
// The issue is that the spawn-helper binary in node-pty is not marked as executable.
if (os.platform() !== "win32") {
  const command = "chmod +x $(find node_modules/node-pty -name spawn-helper)";
  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.error(`Error during postinstall: ${err.message}`);
      // Don't fail the install, just log the error
    }
    if (stderr) {
      console.error(`Stderr during postinstall: ${stderr}`);
    }
    if (stdout) {
      console.log(`Postinstall script output: ${stdout}`);
    }
  });
} else {
  console.log("Skipping postinstall script on Windows.");
}
