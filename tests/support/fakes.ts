import {
  NotificationEntity,
  PlainPassword,
} from "../../src/core/entities";
import { IDomainEvent } from "../../src/core/events";
import { InvalidToken } from "../../src/core/exceptions";
import {
  ICachePort,
  IClockPort,
  IEventPublisherPort,
  IIdGeneratorPort,
  IIssuedToken,
  ILoggerPort,
  INotificationSchedulerPort,
  INotificationSenderPort,
  IPasswordHasherPort,
  IRevokedTokenStorePort,
  ITokenPayload,
  ITokenServicePort,
  IVerifiedToken,
  LogContext,
} from "../../src/core/ports";

const ONE_HOUR_IN_MILLISECONDS = 60 * 60 * 1000;

export class FixedClock implements IClockPort {
  constructor(private readonly fixed = new Date("2026-01-01T12:00:00.000Z")) {}

  public now(): Date {
    return this.fixed;
  }
}

export class SequentialIdGenerator implements IIdGeneratorPort {
  private counter = 0;

  public generate(): string {
    this.counter += 1;

    return `id-${this.counter}`;
  }
}

export class FakePasswordHasher implements IPasswordHasherPort {
  public verifyCalls = 0;

  public async hash(password: PlainPassword): Promise<string> {
    return `hashed:${password.Value}`;
  }

  public async verify(
    password: PlainPassword,
    storedHash: string
  ): Promise<boolean> {
    this.verifyCalls += 1;

    return storedHash === `hashed:${password.Value}`;
  }

  public hashThatNeverMatches(): string {
    return "hashed:__inexistente__";
  }
}

export class FakeTokenService implements ITokenServicePort {
  private counter = 0;

  public sign(payload: ITokenPayload): IIssuedToken {
    this.counter += 1;

    const id = `jti-${this.counter}`;

    return {
      id,
      token: `token:${payload.sub}:${payload.email}:${id}`,
      expiresAt: new Date(Date.now() + ONE_HOUR_IN_MILLISECONDS),
    };
  }

  public verify(token: string): IVerifiedToken {
    const [prefix, sub, email, id] = token.split(":");

    if (prefix !== "token" || !sub || !email || !id) throw new InvalidToken();

    return {
      sub,
      email,
      id,
      expiresAt: new Date(Date.now() + ONE_HOUR_IN_MILLISECONDS),
    };
  }
}

export class SilentLogger implements ILoggerPort {
  public readonly lines: { level: string; message: string }[] = [];

  public debug(message: string): void {
    this.lines.push({ level: "debug", message });
  }

  public info(message: string): void {
    this.lines.push({ level: "info", message });
  }

  public warn(message: string): void {
    this.lines.push({ level: "warn", message });
  }

  public error(message: string): void {
    this.lines.push({ level: "error", message });
  }

  public child(_context: LogContext): ILoggerPort {
    return this;
  }
}

export class InMemoryCache implements ICachePort {
  public reads = 0;
  public writes = 0;

  private readonly entries = new Map<string, string>();

  public async get<TValue>(key: string): Promise<TValue | null> {
    this.reads += 1;

    const raw = this.entries.get(key);

    return raw === undefined ? null : (JSON.parse(raw) as TValue);
  }

  public async set<TValue>(key: string, value: TValue): Promise<void> {
    this.writes += 1;
    this.entries.set(key, JSON.stringify(value));
  }

  public async delete(key: string): Promise<void> {
    this.entries.delete(key);
  }

  public get Size(): number {
    return this.entries.size;
  }
}

export class BrokenCache implements ICachePort {
  public async get<TValue>(): Promise<TValue | null> {
    throw new Error("cache fora do ar");
  }

  public async set(): Promise<void> {
    throw new Error("cache fora do ar");
  }

  public async delete(): Promise<void> {
    throw new Error("cache fora do ar");
  }
}

export class RecordingEventPublisher implements IEventPublisherPort {
  public readonly published: IDomainEvent[] = [];

  public async publish(event: IDomainEvent): Promise<void> {
    this.published.push(event);
  }

  public Names(): string[] {
    return this.published.map((event) => event.name);
  }

  public Last(): IDomainEvent | undefined {
    return this.published.at(-1);
  }
}

export class BrokenEventPublisher implements IEventPublisherPort {
  public async publish(): Promise<void> {
    throw new Error("fila fora do ar");
  }
}

export class RecordingNotificationScheduler
  implements INotificationSchedulerPort
{
  public readonly scheduled: string[] = [];

  public async schedule(notificationId: string): Promise<void> {
    this.scheduled.push(notificationId);
  }

  public Drain(): string[] {
    const pending = [...this.scheduled];

    this.scheduled.length = 0;

    return pending;
  }
}

export class RecordingNotificationSender implements INotificationSenderPort {
  public readonly sent: NotificationEntity[] = [];

  public failWith: Error | null = null;

  public async send(notification: NotificationEntity): Promise<void> {
    if (this.failWith) throw this.failWith;

    this.sent.push(notification);
  }
}

export class InMemoryRevokedTokenStore implements IRevokedTokenStorePort {
  private readonly revoked = new Map<string, Date>();

  public async revoke(tokenId: string, expiresAt: Date): Promise<void> {
    if (expiresAt.getTime() <= Date.now()) return;

    this.revoked.set(tokenId, expiresAt);
  }

  public async isRevoked(tokenId: string): Promise<boolean> {
    const expiresAt = this.revoked.get(tokenId);

    if (!expiresAt) return false;
    if (expiresAt.getTime() <= Date.now()) {
      this.revoked.delete(tokenId);

      return false;
    }

    return true;
  }
}
