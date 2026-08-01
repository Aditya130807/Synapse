declare namespace Express {
  interface Request {
    user?: {
      sub: string;
    };
  }
}
