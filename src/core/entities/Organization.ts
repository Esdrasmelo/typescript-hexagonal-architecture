import { FieldIsTooLong, NonProvidedField } from "../exceptions";
import { Slug } from "./value-objects";

const MAX_NAME_LENGTH = 120;

export interface IOrganizationProps {
  id: string;
  name: string;
  slug: Slug;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateOrganizationProps {
  id: string;
  name: string;
  slug: Slug;
  ownerId: string;
  now: Date;
}

export interface IOrganizationSnapshot {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export class OrganizationEntity {
  private constructor(private readonly props: IOrganizationProps) {}

  public static Create(input: ICreateOrganizationProps): OrganizationEntity {
    if (!input.ownerId) throw new NonProvidedField("ownerId");

    return new OrganizationEntity({
      id: input.id,
      name: OrganizationEntity.EnsureNameIsValid(input.name),
      slug: input.slug,
      ownerId: input.ownerId,
      createdAt: input.now,
      updatedAt: input.now,
    });
  }

  public static Restore(props: IOrganizationProps): OrganizationEntity {
    return new OrganizationEntity(props);
  }

  public static FromSnapshot(
    snapshot: IOrganizationSnapshot
  ): OrganizationEntity {
    return new OrganizationEntity({
      id: snapshot.id,
      name: snapshot.name,
      slug: Slug.Create(snapshot.slug),
      ownerId: snapshot.ownerId,
      createdAt: new Date(snapshot.createdAt),
      updatedAt: new Date(snapshot.updatedAt),
    });
  }

  public Rename(name: string, now: Date): OrganizationEntity {
    return new OrganizationEntity({
      ...this.props,
      name: OrganizationEntity.EnsureNameIsValid(name),
      updatedAt: now,
    });
  }

  public Snapshot(): IOrganizationSnapshot {
    return {
      id: this.props.id,
      name: this.props.name,
      slug: this.props.slug.Value,
      ownerId: this.props.ownerId,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }

  public get Id(): string {
    return this.props.id;
  }

  public get Name(): string {
    return this.props.name;
  }

  public get Slug(): Slug {
    return this.props.slug;
  }

  public get OwnerId(): string {
    return this.props.ownerId;
  }

  public get CreatedAt(): Date {
    return this.props.createdAt;
  }

  public get UpdatedAt(): Date {
    return this.props.updatedAt;
  }

  private static EnsureNameIsValid(name: string): string {
    const trimmed = typeof name === "string" ? name.trim() : "";

    if (!trimmed) throw new NonProvidedField("name");
    if (trimmed.length > MAX_NAME_LENGTH) {
      throw new FieldIsTooLong("name", MAX_NAME_LENGTH);
    }

    return trimmed;
  }
}
