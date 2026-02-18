import { DomainException } from '@/common/domain/domain-exception';

export class InvalidCredentialsException extends DomainException {
  readonly statusCode = 401;
  readonly errorCode = 'INVALID_CREDENTIALS';

  constructor() {
    super('Invalid credentials');
  }
}
