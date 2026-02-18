import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { USER_REPOSITORY } from '../../user.tokens';
import { UserRepository } from '../../domain/repositories/user.repository.interface';
import { Email } from '../../domain/value-objects/email.vo';
import { User } from '../../domain/entities/user.entity';
import { EmailAlreadyExistsException } from '../../domain/exceptions/email-already-exists.exception';
import type { RegisterUserCommand } from '../dto/register-user.command';
import type { UserResponse } from '../dto/user.response';

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(command: RegisterUserCommand): Promise<UserResponse> {
    const email = Email.create(command.email);

    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new EmailAlreadyExistsException(command.email);
    }

    const passwordHash = await bcrypt.hash(command.password, 12);
    const now = new Date();
    const user = User.create({
      id: uuidv4(),
      email,
      passwordHash,
      role: 'USER',
      createdAt: now,
      updatedAt: now,
    });

    await this.userRepository.save(user);

    return {
      id: user.getId(),
      email: user.getEmail().getValue(),
      role: user.getRole(),
      createdAt: user.getCreatedAt(),
    };
  }
}
