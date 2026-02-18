import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { USER_REPOSITORY } from './user.tokens';
import { MongooseUserRepository } from './infrastructure/persistence/mongoose-user.repository';
import {
  UserSchema,
  USER_MODEL_NAME,
} from './infrastructure/persistence/schemas/user.schema';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { GetUserProfileUseCase } from './application/use-cases/get-user-profile.use-case';
import { UserController } from './presentation/controllers/user.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: USER_MODEL_NAME, schema: UserSchema }]),
  ],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: MongooseUserRepository,
    },
    RegisterUserUseCase,
    GetUserProfileUseCase,
  ],
  controllers: [UserController],
  exports: [USER_REPOSITORY, RegisterUserUseCase],
})
export class UserModule {}
