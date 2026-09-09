import { MembershipRoleIsNotValid, NonProvidedField } from "../../exceptions";

export type MembershipRoleName = "owner" | "admin" | "member";

const RANK_BY_NAME: Record<MembershipRoleName, number> = {
  owner: 3,
  admin: 2,
  member: 1,
};

export class MembershipRole {
  public static readonly Owner = new MembershipRole("owner");
  public static readonly Admin = new MembershipRole("admin");
  public static readonly Member = new MembershipRole("member");

  private static readonly ALL = [
    MembershipRole.Owner,
    MembershipRole.Admin,
    MembershipRole.Member,
  ] as const;

  private constructor(public readonly Value: MembershipRoleName) {}

  public static Create(role: unknown): MembershipRole {
    if (typeof role !== "string" || role.trim().length === 0) {
      throw new NonProvidedField("role");
    }

    const normalized = role.trim().toLowerCase();
    const found = MembershipRole.ALL.find(
      (candidate) => candidate.Value === normalized
    );

    if (!found) {
      throw new MembershipRoleIsNotValid(
        MembershipRole.ALL.map((candidate) => candidate.Value)
      );
    }

    return found;
  }

  public get Rank(): number {
    return RANK_BY_NAME[this.Value];
  }

  public get IsOwner(): boolean {
    return this === MembershipRole.Owner;
  }

  public get CanManageMembers(): boolean {
    return this.Rank >= MembershipRole.Admin.Rank;
  }

  public OutranksOrEquals(other: MembershipRole): boolean {
    return this.Rank >= other.Rank;
  }

  public Equals(other: MembershipRole): boolean {
    return this.Value === other.Value;
  }

  public toString(): MembershipRoleName {
    return this.Value;
  }
}
