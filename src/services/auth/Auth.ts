import { NextFunction, Request, Response } from "express";
import {
  FindUserByEmailUseCase,
  HttpResponse,
  UserEntity,
  internalServerErrorResponse,
  okResponse,
  unauthorizedRequestResponse,
} from "../../core";
import {
  BadJwtTokenFormat,
  ErrorValidatingToken,
  InvalidPassword,
  TokenNotProvided,
} from "../exceptions";
import { ILoginData } from "./in";
import jwt from "jsonwebtoken";

export class AuthService {
  private findUserByEmailUseCase: FindUserByEmailUseCase;

  constructor(findUserByEmailUseCase: FindUserByEmailUseCase) {
    this.findUserByEmailUseCase = findUserByEmailUseCase;
  }

  private async IsPasswordValid(
    storedPassword: string,
    providedPassword: string
  ): Promise<boolean> {
    const isPasswordValid = UserEntity.ComparePassword(
      storedPassword,
      providedPassword
    );

    if (!isPasswordValid) return false;

    return true;
  }

  public GenerateJwtToken(payload: any): string {
    const private_key = String(process.env.SECRET_TOKEN_KEY);
    const token = jwt.sign(payload, private_key, {
      expiresIn: "1d",
    });

    return token;
  }

  public async Login(loginData: ILoginData): Promise<HttpResponse> {
    const { email, password } = loginData;
    const userPassword = await this.findUserByEmailUseCase.Execute(email);

    const isPasswordValid = await this.IsPasswordValid(
      userPassword.body.password,
      password
    );

    if (userPassword.body instanceof Error) {
      return userPassword;
    }
    if (!isPasswordValid) {
      return unauthorizedRequestResponse(new InvalidPassword());
    }

    const token = this.GenerateJwtToken({
      email: userPassword.body.email,
      id: userPassword.body.id,
    });

    return okResponse({
      body: {
        token,
      },
    });
  }

  public static ValidateJwtToken(token: string) {
    try {
      const secretTokenKey = String(process.env.SECRET_TOKEN_KEY);

      const providedToken = token.split("Bearer ")[1];

      const verifyProvidedToken = jwt.verify(providedToken, secretTokenKey);

      return verifyProvidedToken;
    } catch (error) {
      return internalServerErrorResponse(new ErrorValidatingToken());
    }
  }
}
