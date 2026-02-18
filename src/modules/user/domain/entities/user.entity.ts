import { BaseEntity } from '@/common/domain/base.entity';
import type { Email } from '../value-objects/email.vo';

export type Role = 'USER' | 'ADMIN';

export class User extends BaseEntity {
  private constructor(
    id: string,
    private email: Email,
    private passwordHash: string,
    private role: Role,
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(id, createdAt, updatedAt);
  }

  static create(data: {
    id: string;
    email: Email;
    passwordHash: string;
    role: Role;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return new User(
      data.id,
      data.email,
      data.passwordHash,
      data.role,
      data.createdAt,
      data.updatedAt,
    );
  }

  getEmail(): Email {
    return this.email;
  }

  getPasswordHash(): string {
    return this.passwordHash;
  }

  getRole(): Role {
    return this.role;
  }

  isAdmin(): boolean {
    return this.role === 'ADMIN';
  }
}
