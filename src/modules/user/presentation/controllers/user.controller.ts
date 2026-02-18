import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '@/common/decorators/current-user.decorator';
import { GetUserProfileUseCase } from '../../application/use-cases/get-user-profile.use-case';
import { UserResponse } from '../../application/dto/user.response';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly getUserProfileUseCase: GetUserProfileUseCase) {}

  @Get('me')
  @UseGuards(RolesGuard)
  @Roles('USER', 'ADMIN')
  @ApiResponse({ status: 200, type: UserResponse })
  async getProfile(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<UserResponse> {
    return this.getUserProfileUseCase.execute(user.id);
  }
}
