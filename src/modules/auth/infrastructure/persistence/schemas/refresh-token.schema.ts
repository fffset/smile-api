import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export const REFRESH_TOKEN_MODEL_NAME = 'RefreshToken';

@Schema({ timestamps: true })
export class RefreshTokenDocument extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  refreshToken!: string;

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop({ default: null })
  revokedAt!: Date | null;
}

export const RefreshTokenSchema =
  SchemaFactory.createForClass(RefreshTokenDocument);
