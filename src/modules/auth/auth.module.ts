import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { UserModule } from '../user/user.module';
import { TOKEN_SERVICE, REFRESH_TOKEN_REPOSITORY } from './auth.tokens';
import { JwtTokenService } from './infrastructure/services/jwt-token.service';
import { MongooseRefreshTokenRepository } from './infrastructure/persistence/mongoose-refresh-token.repository';
import {
  RefreshTokenSchema,
  REFRESH_TOKEN_MODEL_NAME,
} from './infrastructure/persistence/schemas/refresh-token.schema';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { RegisterAndLoginUseCase } from './application/use-cases/register-and-login.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { AuthController } from './presentation/controllers/auth.controller';

@Module({
  imports: [
    UserModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
    MongooseModule.forFeature([
      { name: REFRESH_TOKEN_MODEL_NAME, schema: RefreshTokenSchema },
    ]),
  ],
  providers: [
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useClass: MongooseRefreshTokenRepository,
    },
    JwtStrategy,
    LoginUseCase,
    RegisterAndLoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
