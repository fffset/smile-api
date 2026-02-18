import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import ms from 'ms';
import type { StringValue } from 'ms';
import { TOKEN_SERVICE, REFRESH_TOKEN_REPOSITORY } from '../../auth.tokens';
import { TokenServicePort } from '../../domain/ports/token-service.port';
import { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.interface';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import { USER_REPOSITORY } from '@/modules/user/user.tokens';
import { UserRepository } from '@/modules/user/domain/repositories/user.repository.interface';
import { Email } from '@/modules/user/domain/value-objects/email.vo';
import { InvalidCredentialsException } from '@/modules/user/domain/exceptions/invalid-credentials.exception';
import type { LoginCommand } from '../dto/login.command';
import type { LoginResponse } from '../dto/login.response';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenServicePort,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly configService: ConfigService,
  ) {}

  async execute(command: LoginCommand): Promise<LoginResponse> {
    const email = Email.create(command.email);
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new InvalidCredentialsException();
    }

    const isValid = await bcrypt.compare(
      command.password,
      user.getPasswordHash(),
    );
    if (!isValid) {
      throw new InvalidCredentialsException();
    }

    const payload = {
      sub: user.getId(),
      email: user.getEmail().getValue(),
      role: user.getRole(),
    };

    const accessToken = this.tokenService.generateAccessToken(payload);
    const refreshToken = this.tokenService.generateRefreshToken(payload);

    const refreshExpiration =
      this.configService.get<string>('JWT_REFRESH_EXPIRATION') ?? '7d';
    const now = new Date();
    const rt = RefreshToken.create({
      id: uuidv4(),
      userId: user.getId(),
      token: refreshToken,
      expiresAt: new Date(Date.now() + ms(refreshExpiration as StringValue)),
      revokedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    await this.refreshTokenRepository.save(rt);

    return { accessToken, refreshToken };
  }
}
