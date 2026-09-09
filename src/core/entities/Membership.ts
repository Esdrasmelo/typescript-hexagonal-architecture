import { NonProvidedField } from "../exceptions";
import { MembershipRole } from "./value-objects";

export interface IMembershipProps {
  id: string;
  organizationId: string;
  userId: string;
  role: MembershipRole;
  invitedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateMembershipProps {
  id: string;
  organizationId: string;
  userId: string;
  role: MembershipRole;
  invitedBy?: string | null;
  now: Date;
}

export interface IMembershipSnapshot {
  id: string;
  organizationId: string;
  userId: string;
  role: string;
  invitedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export class MembershipEntity {
  private constructor(private readonly props: IMembershipProps) {}

  public static Create(input: ICreateMembershipProps): MembershipEntity {
    if (!input.organizationId) throw new NonProvidedField("organizationId");
    if (!input.userId) throw new NonProvidedField("userId");

    return new MembershipEntity({
      id: input.id,
      organizationId: input.organizationId,
      userId: input.userId,
      role: input.role,
      invitedBy: input.invitedBy ?? null,
      createdAt: input.now,
      updatedAt: input.now,
    });
  }

  public static Restore(props: IMembershipProps): MembershipEntity {
    return new MembershipEntity(props);
  }

  public static FromSnapshot(snapshot: IMembershipSnapshot): MembershipEntity {
    return new MembershipEntity({
      id: snapshot.id,
      organizationId: snapshot.organizationId,
      userId: snapshot.userId,
      role: MembershipRole.Create(snapshot.role),
      invitedBy: snapshot.invitedBy,
      createdAt: new Date(snapshot.createdAt),
      updatedAt: new Date(snapshot.updatedAt),
    });
  }

  public ChangeRole(role: MembershipRole, now: Date): MembershipEntity {
    return new MembershipEntity({ ...this.props, role, updatedAt: now });
  }

  public Snapshot(): IMembershipSnapshot {
    return {
      id: this.props.id,
      organizationId: this.props.organizationId,
      userId: this.props.userId,
      role: this.props.role.Value,
      invitedBy: this.props.invitedBy,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }

  public get Id(): string {
    return this.props.id;
  }

  public get OrganizationId(): string {
    return this.props.organizationId;
  }

  public get UserId(): string {
    return this.props.userId;
  }

  public get Role(): MembershipRole {
    return this.props.role;
  }

  public get InvitedBy(): string | null {
    return this.props.invitedBy;
  }

  public get CreatedAt(): Date {
    return this.props.createdAt;
  }

  public get UpdatedAt(): Date {
    return this.props.updatedAt;
  }
}
