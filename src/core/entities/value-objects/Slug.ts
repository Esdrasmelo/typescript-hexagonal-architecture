import { NonProvidedField, SlugIsNotValid } from "../../exceptions";

const SLUG_SHAPE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MIN_SLUG_LENGTH = 3;
const MAX_SLUG_LENGTH = 48;
const DIACRITICS = /\p{Diacritic}/gu;
const NON_SLUG_CHARACTERS = /[^a-z0-9]+/g;
const EDGE_HYPHENS = /^-+|-+$/g;

export class Slug {
  private constructor(public readonly Value: string) {}

  public static Create(slug: unknown): Slug {
    const provided = Slug.EnsureProvided(slug);
    const normalized = provided.trim().toLowerCase();

    Slug.EnsureShapeIsValid(normalized);

    return new Slug(normalized);
  }

  public static FromText(text: unknown): Slug {
    return Slug.Create(Slug.Normalize(Slug.EnsureProvided(text)));
  }

  public Equals(other: Slug): boolean {
    return this.Value === other.Value;
  }

  public toString(): string {
    return this.Value;
  }

  private static Normalize(text: string): string {
    return text
      .normalize("NFD")
      .replace(DIACRITICS, "")
      .toLowerCase()
      .replace(NON_SLUG_CHARACTERS, "-")
      .replace(EDGE_HYPHENS, "")
      .slice(0, MAX_SLUG_LENGTH)
      .replace(EDGE_HYPHENS, "");
  }

  private static EnsureProvided(slug: unknown): string {
    if (typeof slug !== "string" || slug.trim().length === 0) {
      throw new NonProvidedField("slug");
    }

    return slug;
  }

  private static EnsureShapeIsValid(slug: string): void {
    if (
      slug.length < MIN_SLUG_LENGTH ||
      slug.length > MAX_SLUG_LENGTH ||
      !SLUG_SHAPE.test(slug)
    ) {
      throw new SlugIsNotValid();
    }
  }
}
