export type LogContext = Record<
  string,
  string | number | boolean | null | undefined
>;

export interface ILoggerPort {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  child(context: LogContext): ILoggerPort;
}
