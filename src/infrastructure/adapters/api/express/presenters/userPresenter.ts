import { UserEntity } from "../../../../../core/entities";

export interface IUserResponse {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export const toUserResponse = (user: UserEntity): IUserResponse => ({
  id: user.Id,
  name: user.Name,
  email: user.Email.Value,
  created_at: user.CreatedAt.toISOString(),
  updated_at: user.UpdatedAt.toISOString(),
});

export const toUserResponseList = (users: UserEntity[]): IUserResponse[] =>
  users.map(toUserResponse);
