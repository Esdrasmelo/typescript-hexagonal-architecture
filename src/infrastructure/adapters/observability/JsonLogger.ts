import { ILoggerPort, LogContext } from "../../../core/ports";

export type LogLevel = "debug" | "info" | "warn" | "error";

const SEVERITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export interface IJsonLoggerOptions {
  level: LogLevel;
  service: string;
  context?: LogContext;
}

export class JsonLogger implements ILoggerPort {
  constructor(private readonly options: IJsonLoggerOptions) {}

  public debug(message: string, context?: LogContext): void {
    this.Write("debug", message, context);
  }

  public info(message: string, context?: LogContext): void {
    this.Write("info", message, context);
  }

  public warn(message: string, context?: LogContext): void {
    this.Write("warn", message, context);
  }

  public error(message: string, context?: LogContext): void {
    this.Write("error", message, context);
  }

  public child(context: LogContext): ILoggerPort {
    return new JsonLogger({
      ...this.options,
      context: { ...this.options.context, ...context },
    });
  }

  private Write(
    level: LogLevel,
    message: string,
    context?: LogContext
  ): void {
    if (SEVERITY[level] < SEVERITY[this.options.level]) return;

    const line = JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      service: this.options.service,
      message,
      ...this.options.context,
      ...context,
    });

    const stream = level === "error" ? process.stderr : process.stdout;

    stream.write(`${line}\n`);
  }
}
