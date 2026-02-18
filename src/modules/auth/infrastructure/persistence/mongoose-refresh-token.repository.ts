import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.interface';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import { REFRESH_TOKEN_MODEL_NAME } from './schemas/refresh-token.schema';

interface RefreshTokenDocumentLean {
  _id: string;
  userId: string;
  refreshToken: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class MongooseRefreshTokenRepository extends RefreshTokenRepository {
  constructor(
    @InjectModel(REFRESH_TOKEN_MODEL_NAME)
    private readonly refreshTokenModel: Model<RefreshTokenDocumentLean>,
  ) {
    super();
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    const doc = await this.refreshTokenModel
      .findOne({ refreshToken: token })
      .lean()
      .exec();
    if (!doc) return null;
    return RefreshToken.create({
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      token: doc.refreshToken,
      expiresAt: doc.expiresAt,
      revokedAt: doc.revokedAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  async save(refreshToken: RefreshToken): Promise<void> {
    await this.refreshTokenModel
      .updateOne(
        { _id: refreshToken.getId() },
        {
          $set: {
            userId: refreshToken.getUserId(),
            refreshToken: refreshToken.getToken(),
            expiresAt: refreshToken.getExpiresAt(),
            revokedAt: refreshToken.getRevokedAt(),
            updatedAt: new Date(),
          },
        },
        { upsert: true },
      )
      .exec();
  }

  async revokeByToken(token: string): Promise<void> {
    await this.refreshTokenModel
      .updateOne({ refreshToken: token }, { $set: { revokedAt: new Date() } })
      .exec();
  }
}
