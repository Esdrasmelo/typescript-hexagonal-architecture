import { InternalServerError } from "../exceptions";

export type HttpResponse = {
  statusCode: number;
  body?: any;
};

export type HttpRequest = {
  body?: any;
};

export const okResponse = (data: any): HttpResponse => ({
  statusCode: 200,
  body: data,
});

export const createdResponse = (data: any): HttpResponse => ({
  statusCode: 201,
  body: data,
});

export const notFoundResponse = (error: Error): HttpResponse => ({
  statusCode: 404,
  body: error,
});

export const badRequestResponse = (error: Error): HttpResponse => ({
  statusCode: 400,
  body: error,
});

export const internalServerErrorResponse = (error?: Error): HttpResponse => ({
  statusCode: 500,
  body: error || new InternalServerError(),
});

export const unauthorizedRequestResponse = (error: Error): HttpResponse => ({
  statusCode: 401,
  body: error,
});
