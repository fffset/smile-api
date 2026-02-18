import { DomainException } from '@/common/domain/domain-exception';

export class UserNotFoundException extends DomainException {
  readonly statusCode = 404;
  readonly errorCode = 'USER_NOT_FOUND';

  constructor(userId: string) {
    super(`User with id ${userId} not found`);
  }
}
