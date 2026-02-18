export abstract class BaseEntity {
  constructor(
    private readonly _id: string,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date,
  ) {}

  getId(): string {
    return this._id;
  }

  getCreatedAt(): Date {
    return this._createdAt;
  }

  getUpdatedAt(): Date {
    return this._updatedAt;
  }
}
