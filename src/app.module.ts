import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppMongooseModule } from './common/infrastructure/mongoose/mongoose.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AppMongooseModule,
    UserModule,
    AuthModule,
  ],
})
export class AppModule {}
