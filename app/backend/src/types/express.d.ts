declare namespace Express {
  interface Request {
    user?: {
      sub: string;
    };
    validatedQuery?: Record<string, unknown>;
  }
}
