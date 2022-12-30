import { HttpResponse } from "../../../core";
import { AuthService } from "../../../services/auth/Auth";
import { ILoginData } from "../../../services/auth/in";

export class AuthController {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  public Login(loginData: ILoginData): Promise<HttpResponse> {
    const login = this.authService.Login(loginData);

    return login;
  }
}
