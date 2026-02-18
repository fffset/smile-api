import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export const USER_MODEL_NAME = 'User';

@Schema({ timestamps: true, _id: true })
export class UserDocument extends Document {
  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop({ required: true, enum: ['USER', 'ADMIN'] })
  role!: 'USER' | 'ADMIN';
}

export const UserSchema = SchemaFactory.createForClass(UserDocument);
