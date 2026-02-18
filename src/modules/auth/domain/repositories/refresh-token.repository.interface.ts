import type { RefreshToken } from '../entities/refresh-token.entity';

export abstract class RefreshTokenRepository {
  abstract findByToken(token: string): Promise<RefreshToken | null>;
  abstract save(refreshToken: RefreshToken): Promise<void>;
  abstract revokeByToken(token: string): Promise<void>;
}
