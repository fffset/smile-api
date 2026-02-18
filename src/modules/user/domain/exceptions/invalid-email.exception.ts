import { DomainException } from '@/common/domain/domain-exception';

export class InvalidEmailException extends DomainException {
  readonly statusCode = 400;
  readonly errorCode = 'INVALID_EMAIL';

  constructor(email: string) {
    super(`Invalid email format: ${email}`);
  }
}
