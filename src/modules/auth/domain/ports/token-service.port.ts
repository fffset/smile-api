export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export abstract class TokenServicePort {
  abstract generateAccessToken(payload: JwtPayload): string;
  abstract generateRefreshToken(payload: JwtPayload): string;
  abstract verifyAccessToken(token: string): JwtPayload;
}
