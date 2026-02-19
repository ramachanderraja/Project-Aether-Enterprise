export function formatToolError(toolName: string, error: unknown): string {
  const message =
    error instanceof Error ? error.message : String(error);
  return `Error executing tool "${toolName}": ${message}`;
}
