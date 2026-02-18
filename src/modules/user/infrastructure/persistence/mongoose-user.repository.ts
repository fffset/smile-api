import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserRepository } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.vo';
import { USER_MODEL_NAME } from './schemas/user.schema';

interface UserDocumentLean {
  _id: string;
  email: string;
  passwordHash: string;
  role: 'USER' | 'ADMIN';
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class MongooseUserRepository extends UserRepository {
  constructor(
    @InjectModel(USER_MODEL_NAME)
    private readonly userModel: Model<UserDocumentLean>,
  ) {
    super();
  }

  async findById(id: string): Promise<User | null> {
    const doc = await this.userModel.findById(id).lean().exec();
    if (!doc) return null;
    return User.create({
      id: doc._id.toString(),
      email: Email.create(doc.email),
      passwordHash: doc.passwordHash,
      role: doc.role,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  async findByEmail(email: Email): Promise<User | null> {
    const doc = await this.userModel
      .findOne({ email: email.getValue() })
      .lean()
      .exec();
    if (!doc) return null;
    return User.create({
      id: doc._id.toString(),
      email: Email.create(doc.email),
      passwordHash: doc.passwordHash,
      role: doc.role,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  async save(user: User): Promise<void> {
    await this.userModel
      .updateOne(
        { _id: user.getId() },
        {
          $set: {
            email: user.getEmail().getValue(),
            passwordHash: user.getPasswordHash(),
            role: user.getRole(),
            updatedAt: new Date(),
          },
        },
        { upsert: true },
      )
      .exec();
  }

  async delete(id: string): Promise<void> {
    await this.userModel.deleteOne({ _id: id }).exec();
  }
}
