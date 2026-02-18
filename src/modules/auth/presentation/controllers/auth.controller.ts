import { Body, Controller, Post } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '@/common/decorators/public.decorator';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { RegisterAndLoginUseCase } from '../../application/use-cases/register-and-login.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { LoginCommand } from '../../application/dto/login.command';
import { RegisterCommand } from '../../application/dto/register.command';
import type { LoginResponse } from '../../application/dto/login.response';

@ApiTags('auth')
@Controller('auth')
@Public()
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerAndLoginUseCase: RegisterAndLoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
  ) {}

  @Post('login')
  @ApiResponse({ status: 200, type: LoginCommand })
  async login(@Body() command: LoginCommand): Promise<LoginResponse> {
    return this.loginUseCase.execute(command);
  }

  @Post('register')
  @ApiResponse({ status: 201 })
  async register(@Body() command: RegisterCommand): Promise<LoginResponse> {
    return this.registerAndLoginUseCase.execute(command);
  }

  @Post('refresh')
  @ApiResponse({ status: 200 })
  async refresh(
    @Body() body: { refreshToken: string },
  ): Promise<LoginResponse> {
    return this.refreshTokenUseCase.execute(body.refreshToken);
  }

  @Post('logout')
  @ApiResponse({ status: 201 })
  async logout(@Body() body: { refreshToken: string }): Promise<void> {
    return this.logoutUseCase.execute(body.refreshToken);
  }
}
