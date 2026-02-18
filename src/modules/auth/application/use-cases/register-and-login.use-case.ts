import { Injectable } from '@nestjs/common';
import { RegisterUserUseCase } from '@/modules/user/application/use-cases/register-user.use-case';
import { LoginUseCase } from './login.use-case';
import type { RegisterCommand } from '../dto/register.command';
import type { LoginResponse } from '../dto/login.response';

@Injectable()
export class RegisterAndLoginUseCase {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUseCase: LoginUseCase,
  ) {}

  async execute(command: RegisterCommand): Promise<LoginResponse> {
    await this.registerUserUseCase.execute({
      email: command.email,
      password: command.password,
    });

    return this.loginUseCase.execute({
      email: command.email,
      password: command.password,
    });
  }
}
