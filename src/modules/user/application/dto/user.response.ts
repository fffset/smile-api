import { ApiProperty } from '@nestjs/swagger';
import type { Role } from '../../domain/entities/user.entity';

export class UserResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ enum: ['USER', 'ADMIN'] })
  role!: Role;

  @ApiProperty()
  createdAt!: Date;
}
