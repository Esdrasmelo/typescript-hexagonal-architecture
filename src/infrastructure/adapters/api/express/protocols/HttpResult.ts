export interface HttpResult<TBody> {
  statusCode: number;
  body: TBody;
}

export const ok = <T>(body: T): HttpResult<T> => ({ statusCode: 200, body });

export const created = <T>(body: T): HttpResult<T> => ({
  statusCode: 201,
  body,
});
