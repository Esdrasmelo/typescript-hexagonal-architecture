import {
  IEventRecorderPort,
  IRevokedTokenStorePort,
} from "../../ports";
import { IUseCase } from "../UseCase";

export interface ILogoutInput {
  actorId: string;
  tokenId: string;
  expiresAt: Date;
  requestId?: string | null;
}

export class LogoutUseCase implements IUseCase<ILogoutInput, void> {
  constructor(
    private readonly revokedTokenStore: IRevokedTokenStorePort,
    private readonly eventRecorder: IEventRecorderPort
  ) {}

  public async Execute(input: ILogoutInput): Promise<void> {
    await this.revokedTokenStore.revoke(input.tokenId, input.expiresAt);

    await this.eventRecorder.record({
      name: "user.logged-out",
      resource: { type: "user", id: input.actorId },
      actorId: input.actorId,
      requestId: input.requestId,
      metadata: { tokenId: input.tokenId },
    });
  }
}
