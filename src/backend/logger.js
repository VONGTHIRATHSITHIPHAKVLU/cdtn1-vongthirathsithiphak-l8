const levels = { debug: 10, info: 20, warn: 30, error: 40 };
// Error messages can contain SQL values, credentials or customer input. Keep only
// diagnostic types/codes and source locations, never the raw message or stack header.
export function errorDetails(error, depth = 0, seen = new Set()) {
  if (depth >= 4 || seen.has(error)) return { type: 'TruncatedCause' };
  if (!(error instanceof Error)) return { type: 'NonErrorThrown' };
  seen.add(error);
  const type = ['Error','TypeError','RangeError','ReferenceError','SyntaxError','URIError','EvalError','AggregateError','AppError'].includes(error.name) ? error.name : 'Error';
  const code = typeof error.code === 'string' && /^(?:ERR_SQLITE_ERROR|ERR_SQLITE_CONSTRAINT_[A-Z_]+|ECONNREFUSED|ECONNRESET|ETIMEDOUT|ENOENT|EACCES|EIO|ENOSPC)$/.test(error.code) ? error.code : undefined;
  const stack = typeof error.stack === 'string' ? error.stack.split('\n').slice(1).flatMap(line => {
    // Retain only this project's source frames and Node internal frames.
    const location = line.match(/(?:[/\\])((?:src|scripts)[/\\][a-zA-Z0-9_./\\-]+:\d+:\d+)\)?$/)?.[1]
      || line.match(/(node:[a-zA-Z0-9_/-]+:\d+:\d+)\)?$/)?.[1];
    return location ? [location.replaceAll('\\','/')] : [];
  }).slice(0,12) : [];
  return { type, ...(code ? {code} : {}), stack, ...(error.cause !== undefined ? {cause:errorDetails(error.cause,depth+1,seen)} : {}) };
}
export function createLogger({ level = process.env.LOG_LEVEL || 'info', write = line => process.stdout.write(line) } = {}) {
  return (severity, message, context = {}) => {
    if (levels[severity] < (levels[level] ?? levels.info)) return;
    // Allowlist metadata; never serialize request bodies, headers or raw errors.
    const safe = Object.fromEntries(['requestId','method','route','status','durationMs','code','port'].filter(key => context[key] !== undefined).map(key => [key, context[key]]));
    if (context.error !== undefined) safe.error = errorDetails(context.error);
    write(JSON.stringify({ timestamp: new Date().toISOString(), level: severity, message, ...safe }) + '\n');
  };
}
export const logger = createLogger();
