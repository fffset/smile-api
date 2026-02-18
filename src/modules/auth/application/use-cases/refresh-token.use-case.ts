import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import ms from 'ms';
import type { StringValue } from 'ms';
import { TOKEN_SERVICE, REFRESH_TOKEN_REPOSITORY } from '../../auth.tokens';
import { TokenServicePort } from '../../domain/ports/token-service.port';
import { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.interface';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import { USER_REPOSITORY } from '@/modules/user/user.tokens';
import { UserRepository } from '@/modules/user/domain/repositories/user.repository.interface';
import { InvalidCredentialsException } from '@/modules/user/domain/exceptions/invalid-credentials.exception';
import { UserNotFoundException } from '@/modules/user/domain/exceptions/user-not-found.exception';
import type { LoginResponse } from '../dto/login.response';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenServicePort,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
  ) {}

  async execute(token: string): Promise<LoginResponse> {
    const refreshToken = await this.refreshTokenRepository.findByToken(token);

    if (!refreshToken || !refreshToken.isValid()) {
      throw new InvalidCredentialsException();
    }

    const user = await this.userRepository.findById(refreshToken.getUserId());
    if (!user) {
      throw new UserNotFoundException(refreshToken.getUserId());
    }

    const payload = {
      sub: user.getId(),
      email: user.getEmail().getValue(),
      role: user.getRole(),
    };

    const newAccessToken = this.tokenService.generateAccessToken(payload);
    const newRefreshToken = this.tokenService.generateRefreshToken(payload);

    await this.refreshTokenRepository.revokeByToken(token);

    const refreshExpiration =
      this.configService.get<string>('JWT_REFRESH_EXPIRATION') ?? '7d';
    const now = new Date();
    const newRt = RefreshToken.create({
      id: uuidv4(),
      userId: user.getId(),
      token: newRefreshToken,
      expiresAt: new Date(Date.now() + ms(refreshExpiration as StringValue)),
      revokedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    await this.refreshTokenRepository.save(newRt);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }
}
