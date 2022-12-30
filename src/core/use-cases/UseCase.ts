import { HttpResponse } from "../protocols/http-response";

export interface IUseCase {
    Execute: (data: any) => Promise<HttpResponse>;
}