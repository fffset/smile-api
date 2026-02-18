import { BaseEntity } from '@/common/domain/base.entity';

export class RefreshToken extends BaseEntity {
  private constructor(
    id: string,
    private readonly userId: string,
    private readonly token: string,
    private readonly expiresAt: Date,
    private revokedAt: Date | null,
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(id, createdAt, updatedAt);
  }

  static create(data: {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    revokedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): RefreshToken {
    return new RefreshToken(
      data.id,
      data.userId,
      data.token,
      data.expiresAt,
      data.revokedAt,
      data.createdAt,
      data.updatedAt,
    );
  }

  getUserId(): string {
    return this.userId;
  }

  getToken(): string {
    return this.token;
  }

  getExpiresAt(): Date {
    return this.expiresAt;
  }

  getRevokedAt(): Date | null {
    return this.revokedAt;
  }

  isValid(): boolean {
    return this.revokedAt === null && this.expiresAt > new Date();
  }

  revoke(): void {
    this.revokedAt = new Date();
  }
}
