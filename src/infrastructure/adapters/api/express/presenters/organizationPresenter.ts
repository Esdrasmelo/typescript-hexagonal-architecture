import { MembershipRole, OrganizationEntity } from "../../../../../core/entities";
import { IMemberView } from "../../../../../core/use-cases";

export interface IOrganizationResponse {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface IOrganizationDetailResponse extends IOrganizationResponse {
  role: string;
}

export interface IMemberResponse {
  user_id: string;
  name: string;
  email: string;
  role: string;
  invited_by: string | null;
  created_at: string;
}

export const toOrganizationResponse = (
  organization: OrganizationEntity
): IOrganizationResponse => ({
  id: organization.Id,
  name: organization.Name,
  slug: organization.Slug.Value,
  owner_id: organization.OwnerId,
  created_at: organization.CreatedAt.toISOString(),
  updated_at: organization.UpdatedAt.toISOString(),
});

export const toOrganizationResponseList = (
  organizations: readonly OrganizationEntity[]
): IOrganizationResponse[] => organizations.map(toOrganizationResponse);

export const toOrganizationDetailResponse = (
  organization: OrganizationEntity,
  role: MembershipRole
): IOrganizationDetailResponse => ({
  ...toOrganizationResponse(organization),
  role: role.Value,
});

export const toMemberResponse = ({
  membership,
  user,
}: IMemberView): IMemberResponse => ({
  user_id: user.Id,
  name: user.Name,
  email: user.Email.Value,
  role: membership.Role.Value,
  invited_by: membership.InvitedBy,
  created_at: membership.CreatedAt.toISOString(),
});

export const toMemberResponseList = (
  members: readonly IMemberView[]
): IMemberResponse[] => members.map(toMemberResponse);
