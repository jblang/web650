const warningPattern = /localstorage-file/i;
const originalEmitWarning = process.emitWarning.bind(process);

process.emitWarning = ((warning, ...args) => {
  const message =
    typeof warning === 'string'
      ? warning
      : warning instanceof Error
      ? warning.message
      : String(warning);

  if (warningPattern.test(message)) {
    return;
  }

  return originalEmitWarning(warning as string, ...(args as [string?, string?]));
}) as typeof process.emitWarning;
