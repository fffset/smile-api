import { SetMetadata } from '@nestjs/common';

export type Role = 'USER' | 'ADMIN';
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
