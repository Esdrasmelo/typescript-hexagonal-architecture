export interface IUseCase<TInput, TOutput> {
  Execute(input: TInput): Promise<TOutput>;
}

export interface IUseCaseWithoutInput<TOutput> {
  Execute(): Promise<TOutput>;
}
