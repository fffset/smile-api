import { DomainException } from '@/common/domain/domain-exception';

export class EmailAlreadyExistsException extends DomainException {
  readonly statusCode = 409;
  readonly errorCode = 'EMAIL_ALREADY_EXISTS';

  constructor(email: string) {
    super(`User with email ${email} already exists`);
  }
}
