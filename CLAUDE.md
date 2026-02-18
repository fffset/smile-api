# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Model Configuration

Default model: Sonnet 4.5

Model usage policy:
- Use Haiku 4.5 for trivial formatting, lint fixes, or small refactors.
- Use Sonnet 4.5 for feature work, use case implementation, and architectural changes.
- Use Opus 4.6 only when complex multi-module reasoning is strictly required.
- Do not switch models unless task complexity justifies it.

Token optimization rules:
- Be concise.
- Do not explain standard NestJS, Mongoose, TypeScript, or DDD concepts.
- Output only modified files when editing code.
- Avoid restating unchanged code.
- Do not add long explanations unless explicitly requested.

---

## Task Scoping
- Target a single file or use-case per task.
- Instead of "refactor the module", write "move X to Y" or "change Z in file W".
- If a bug occurs, provide the exact line and error — do not paste the entire file.

## Workflow
- Before any multi-file task, run /plan and wait for confirmation before coding.
- Run /compact after every 3-4 completed tasks.

## Initial setup

Create the project yourself and add this CLAUDE.md file to it. Then run the following in order:

1. **Clean up default NestJS boilerplate** (if present):
   ```bash
   rm src/app.controller.ts src/app.service.ts src/app.controller.spec.ts test/app.e2e-spec.ts
   ```

2. If `.env` is missing, create it from `.env.example` (see Environment Variables). Set `MONGODB_URI` and `JWT_SECRET`.

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the app (MongoDB must be reachable at `MONGODB_URI`):
   ```bash
   npm run start:dev
   ```

**For agents/tools:** When asked to run or set up this project, execute the steps above in order. After step 4, the app is running.

## Commands

```bash
# Development
npm run start:dev          # Start with watch mode (hot reload)
npm run start:debug        # Start with debug + watch mode
npm run start:prod         # Run compiled production build

# Build
npm run build              # Compile TypeScript to dist/

# Testing
npm test                                          # Run unit tests
npm run test:watch                                # Run tests in watch mode
npm run test:cov                                  # Run tests with coverage report
npx jest --testPathPattern=<pattern>              # Run a single test file
npm run test:e2e                                  # Run end-to-end tests (uses test/jest-e2e.json)

# Code Quality
npm run lint               # ESLint with auto-fix
npm run format             # Prettier formatting
```

**Before `npm run start:dev`:** Ensure MongoDB is reachable at `MONGODB_URI` (local instance or Atlas).

---

## Architecture

- **Framework**: NestJS 11, TypeScript 5.7 (strict mode), Express platform
- **Module system**: `nodenext` module resolution, ES2023 target, CJS mode (no `"type": "module"` — no `.js` extension needed on local imports)
- **Pattern**: Domain-Driven Design (DDD) with NestJS modules
- **Database**: MongoDB via Mongoose (ODM)
- **Auth**: JWT (access + refresh tokens) via @nestjs/jwt + Passport
- **Documentation**: Swagger/OpenAPI via `@nestjs/swagger` - available at `/api`

### Package versions

**Do not define a fixed version pattern.** Use the package versions that your project (or the Nest CLI, if you used it) installs. When adding Mongoose, JWT, etc., add them without pinning to specific major versions so that the project keeps working with the CLI's dependency set. If `npm install` fails with peer dependency conflicts, resolve by aligning with the CLI's versions (e.g. the Nest major that the CLI uses), not by locking to a different major in this doc.

**Nest 11 + JWT:** With NestJS 11, use `@nestjs/jwt@^11.0.0`. Version 10.x only supports `@nestjs/common@^8 || ^9 || ^10` and will cause ERESOLVE peer dependency errors.

**Nest 11 + Passport:** With NestJS 11, use `@nestjs/passport@^11.0.0`. Version 10.x only supports older Nest and may cause peer dependency errors.

**Nest 11 + Swagger:** Use `@nestjs/swagger@^11.0.0` to ensure compatibility with Nest 11/Express.

**Mongoose _id:** Mongoose schemas use ObjectId for `_id` by default. When creating new User or RefreshToken entities that are persisted (e.g. in `RegisterUserUseCase`, `LoginUseCase`, `RefreshTokenUseCase`), use `new mongoose.Types.ObjectId().toString()` for the id. Do **not** use uuid for document ids — MongoDB expects a 24-character hex string for ObjectId and will throw `BSONError: input must be a 24 character hex string` otherwise.

**Deprecation warnings and vulnerabilities:** `npm install` may show deprecation warnings (e.g. inflight, npmlog, rimraf, glob, tar) from transitive dependencies. These can be ignored. For security: run `npm audit`, then `npm audit fix`; use `npm audit fix --force` only if you accept possible breaking changes.

### Bounded Contexts

```
src/modules/
├── auth/     # login, register, refreshToken, logout (unauthenticated)
└── user/     # User profile, roles, admin operations (authenticated)
```

`AuthModule` imports `UserModule` for `USER_REPOSITORY` and for `RegisterUserUseCase` (used by `RegisterAndLoginUseCase`). `UserModule` exports `USER_REPOSITORY` and any use cases that other modules inject (e.g. `RegisterUserUseCase`); it knows nothing about auth.

### DDD Layer Structure

Each bounded context follows this layout:

```
src/modules/<context>/
├── domain/
│   ├── entities/
│   │   └── <Entity>.ts                          # Aggregate Root — extends BaseEntity
│   ├── value-objects/
│   │   └── <ValueObject>.vo.ts                  # Immutable, validated on construction
│   ├── repositories/
│   │   └── <entity>.repository.interface.ts     # Abstract class only — no DI token here
│   ├── exceptions/
│   │   └── <entity>-<reason>.exception.ts       # Extends DomainException
│   └── events/
│       └── <entity>-<past-tense>.event.ts       # Implements DomainEvent
│
├── application/
│   ├── use-cases/
│   │   └── <verb>-<entity>.use-case.ts          # One class, one execute() method
│   ├── dto/
│   │   ├── <verb>-<entity>.command.ts           # Input DTO (class-validator)
│   │   └── <entity>.response.ts                 # Output DTO shape
│   └── ports/
│       └── <service>.service.port.ts            # Abstract class for external service ports
│
├── infrastructure/
│   ├── persistence/
│   │   ├── schemas/
│   │   │   └── <entity>.schema.ts               # Mongoose schema + model name
│   │   └── mongoose-<entity>.repository.ts      # extends domain abstract class
│   └── services/
│       └── <external>-<service>.service.ts      # Implements application port
│
├── presentation/
│   ├── controllers/
│   │   └── <context>.controller.ts
│   └── serializers/                             # Optional; not used in current project (responses use DTO/use-case output)
│       └── <entity>.serializer.ts               # Strips private fields (e.g. password)
│
├── <context>.module.ts
└── <context>.tokens.ts                          # DI token Symbols for this context
```

### Shared Kernel (`src/common/`)

```
src/common/
├── domain/
│   ├── base.entity.ts              # Base class: id, createdAt, updatedAt (readonly)
│   ├── domain-exception.ts         # Abstract base: statusCode, errorCode, message
│   └── domain-event.ts             # DomainEvent interface
├── infrastructure/
│   ├── config/
│   │   └── env.schema.ts           # Zod validation schema for all env vars
│   └── mongoose/                   # MongooseModule (global, forRootAsync with MONGODB_URI)
├── guards/
│   ├── jwt-auth.guard.ts           # Extends AuthGuard('jwt'), respects @Public()
│   └── roles.guard.ts              # Reads @Roles() metadata, checks user.role
├── decorators/
│   ├── current-user.decorator.ts   # @CurrentUser() — typed as {id, email, role}
│   ├── public.decorator.ts         # @Public() — bypasses JwtAuthGuard
│   └── roles.decorator.ts          # @Roles('ADMIN') — used with RolesGuard
└── filters/
    └── domain-exception.filter.ts  # @Catch(DomainException) → {statusCode, errorCode, message}
```

### Key Files

- `src/app.module.ts` — Root module: ConfigModule (global), AppMongooseModule (Mongoose via `src/common/infrastructure/mongoose/mongoose.module.ts`, forRootAsync with MONGODB_URI from ConfigService), UserModule, AuthModule
- `src/main.ts` — Bootstrap: Zod env validation → exit(1) on failure, global ValidationPipe, DomainExceptionFilter, Swagger setup (`DocumentBuilder` + `SwaggerModule.setup('api', app, document)`)
- Mongoose schemas live in `src/modules/<context>/infrastructure/persistence/schemas/`. User: email, passwordHash, role (USER | ADMIN). RefreshToken: userId, refreshToken, expiresAt, revokedAt; logout sets revokedAt; on each refresh, issue new token and set revokedAt on the old one (rotation).

---

## DDD Rules

**Domain layer**
- No NestJS decorators (`@Injectable`, `@Module`) — pure TypeScript only.
- No Mongoose imports (no Schema, Model, connection).
- Repository (and external service) contracts are **abstract class**, not `interface`: TypeScript interfaces are erased at runtime, so Nest cannot use them as DI tokens. With `isolatedModules`, a runtime token (Symbol) plus an abstract class as the type is the standard pattern; implementations `extend` the abstract class and are bound via the token.

**Application layer**
- Use cases depend on domain abstract classes only — never on infrastructure implementations.
- One use case = one business action = one `execute()` method.
- Input: Command DTO (validated by class-validator). Output: DTO or entity.

**Infrastructure layer**
- Only layer allowed to import Mongoose (Connection, Model, Schema) and other external SDKs.
- Repository/service implementations `extend` the domain abstract class — call `super()` in constructor.

**Presentation layer**
- Controllers call use cases only — never repositories or infrastructure services directly.
- Use `@CurrentUser()` to extract the authenticated user — never access `req.user` directly.
- `AuthController` is unauthenticated: apply `@Public()` at **class level** so every endpoint in the controller bypasses `JwtAuthGuard`. `UserController` is authenticated (JwtAuthGuard + RolesGuard where needed).

---

## Code Examples

### Value Object Pattern

Value objects are immutable and validated on construction:

```typescript
// src/modules/user/domain/value-objects/email.vo.ts
import { InvalidEmailException } from '../exceptions/invalid-email.exception';

export class Email {
  private constructor(private readonly value: string) {}

  static create(email: string): Email {
    const trimmed = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      throw new InvalidEmailException(email);
    }

    return new Email(trimmed);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
```

### Domain Entity

Entities extend `BaseEntity` and encapsulate business rules:

```typescript
// src/modules/user/domain/entities/user.entity.ts
import { BaseEntity } from '@/common/domain/base.entity';
import { Email } from '../value-objects/email.vo';
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
```

### Domain Exception

All exceptions extend `DomainException`:

```typescript
// src/modules/user/domain/exceptions/email-already-exists.exception.ts
import { DomainException } from '@/common/domain/domain-exception';

export class EmailAlreadyExistsException extends DomainException {
  readonly statusCode = 409;
  readonly errorCode = 'EMAIL_ALREADY_EXISTS';

  constructor(email: string) {
    super(`User with email ${email} already exists`);
  }
}
```

### Repository Interface (Abstract Class)

Domain defines contracts as abstract classes:

```typescript
// src/modules/user/domain/repositories/user.repository.interface.ts
import type { User } from '../entities/user.entity';
import type { Email } from '../value-objects/email.vo';

export abstract class UserRepository {
  abstract findById(id: string): Promise<User | null>;
  abstract findByEmail(email: Email): Promise<User | null>;
  abstract save(user: User): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
```

### Mongoose Schema

Schemas live under `infrastructure/persistence/schemas/`. Use a stable model name for `getModelToken()`:

```typescript
// src/modules/user/infrastructure/persistence/schemas/user.schema.ts
import { Schema, SchemaFactory, Prop } from '@nestjs/mongoose';
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
```
User (and RefreshToken) documents use default `_id` type ObjectId. In use cases that create new users or refresh tokens, set `id: new Types.ObjectId().toString()` (from `mongoose`) so persistence works.

RefreshToken schema example:

```typescript
// src/modules/auth/infrastructure/persistence/schemas/refresh-token.schema.ts
import { Schema, SchemaFactory, Prop } from '@nestjs/mongoose';
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

  @Prop({ type: Date, default: null })
  revokedAt!: Date | null;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshTokenDocument);
```

### Repository Implementation

Infrastructure implements the domain abstract class using Mongoose models:

```typescript
// src/modules/user/infrastructure/persistence/mongoose-user.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserRepository } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.vo';
import { USER_MODEL_NAME } from './schemas/user.schema';

@Injectable()
export class MongooseUserRepository extends UserRepository {
  constructor(
    @InjectModel(USER_MODEL_NAME)
    private readonly userModel: Model<{ _id: string; email: string; passwordHash: string; role: string; createdAt: Date; updatedAt: Date }>,
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
      role: doc.role as 'USER' | 'ADMIN',
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  async findByEmail(email: Email): Promise<User | null> {
    const doc = await this.userModel.findOne({ email: email.getValue() }).lean().exec();
    if (!doc) return null;
    return User.create({
      id: doc._id.toString(),
      email: Email.create(doc.email),
      passwordHash: doc.passwordHash,
      role: doc.role as 'USER' | 'ADMIN',
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  async save(user: User): Promise<void> {
    await this.userModel.updateOne(
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
    );
  }

  async delete(id: string): Promise<void> {
    await this.userModel.deleteOne({ _id: id }).exec();
  }
}
```

### Use Case Pattern

One action = one execute() method:

```typescript
// src/modules/user/application/use-cases/get-user-profile.use-case.ts
import { Injectable, Inject } from '@nestjs/common';
import { USER_REPOSITORY } from '../../user.tokens';
import { UserRepository } from '../../domain/repositories/user.repository.interface';
import { UserNotFoundException } from '../../domain/exceptions/user-not-found.exception';
import type { UserResponse } from '../dto/user.response';

@Injectable()
export class GetUserProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY) // Use Symbol token
    private readonly userRepository: UserRepository, // Type as abstract class
  ) {}

  async execute(userId: string): Promise<UserResponse> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new UserNotFoundException(userId);
    }

    return {
      id: user.getId(),
      email: user.getEmail().getValue(),
      role: user.getRole(),
      createdAt: user.getCreatedAt(),
    };
  }
}
```

### Cross-Module Use Case Injection

When AuthModule needs a use case from UserModule:

```typescript
// src/modules/user/user.module.ts
import { Module } from '@nestjs/common';
import { USER_REPOSITORY } from './user.tokens';
import { MongooseUserRepository } from './infrastructure/persistence/mongoose-user.repository';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';

@Module({
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: MongooseUserRepository,
    },
    RegisterUserUseCase,
  ],
  exports: [
    USER_REPOSITORY,
    RegisterUserUseCase, // ← Export use case for other modules
  ],
})
export class UserModule {}
```

```typescript
// src/modules/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module'; // ← Import module
import { RegisterAndLoginUseCase } from './application/use-cases/register-and-login.use-case';

@Module({
  imports: [UserModule], // ← Import the exporting module
  providers: [RegisterAndLoginUseCase],
  controllers: [AuthController],
})
export class AuthModule {}
```

```typescript
// src/modules/auth/application/use-cases/register-and-login.use-case.ts
import { Injectable } from '@nestjs/common';
import { RegisterUserUseCase } from '@/modules/user/application/use-cases/register-user.use-case';

@Injectable()
export class RegisterAndLoginUseCase {
  constructor(
    private readonly registerUser: RegisterUserUseCase, // Direct injection
  ) {}

  async execute(command: RegisterAndLoginCommand): Promise<LoginResponse> {
    const user = await this.registerUser.execute({
      email: command.email,
      password: command.password,
    });

    // ... rest of login logic
  }
}
```

### Controller with Guards and Decorators

**UserController** — authenticated; `getProfile` for USER/ADMIN. Optionally add `create` (POST, ADMIN-only) with `CreateUserUseCase` and `CreateUserCommand` when admin user creation is needed; the current project implements only `getProfile`.

```typescript
// src/modules/user/presentation/controllers/user.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { GetUserProfileUseCase } from '../../application/use-cases/get-user-profile.use-case';
import type { UserResponse } from '../../application/dto/user.response';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly getUserProfileUseCase: GetUserProfileUseCase) {}

  @Get('me')
  @UseGuards(RolesGuard)
  @Roles('USER', 'ADMIN')
  async getProfile(
    @CurrentUser() user: { id: string; email: string; role: string },
  ): Promise<UserResponse> {
    return this.getUserProfileUseCase.execute(user.id);
  }
}
```

**AuthController** — `@Public()` applied at **class level** so every endpoint bypasses `JwtAuthGuard`. Endpoints: login, register, refresh, logout:

```typescript
// src/modules/auth/presentation/controllers/auth.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { Public } from '@/common/decorators/public.decorator';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { RegisterAndLoginUseCase } from '../../application/use-cases/register-and-login.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';

@Controller('auth')
@Public() // ← class-level: all endpoints are public
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerAndLoginUseCase: RegisterAndLoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
  ) {}

  @Post('login')
  async login(@Body() command: LoginCommand) {
    return this.loginUseCase.execute(command);
  }

  @Post('register')
  async register(@Body() command: RegisterCommand) {
    return this.registerAndLoginUseCase.execute(command);
  }

  @Post('refresh')
  async refresh(@Body() body: { refreshToken: string }) {
    return this.refreshTokenUseCase.execute(body.refreshToken);
  }

  @Post('logout')
  async logout(@Body() body: { refreshToken: string }) {
    return this.logoutUseCase.execute(body.refreshToken);
  }
}
```

### DI Token Definition

```typescript
// src/modules/user/user.tokens.ts
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
```

### Module Configuration

```typescript
// src/modules/user/user.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { USER_REPOSITORY } from './user.tokens';
import { MongooseUserRepository } from './infrastructure/persistence/mongoose-user.repository';
import { UserSchema, USER_MODEL_NAME } from './infrastructure/persistence/schemas/user.schema';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { GetUserProfileUseCase } from './application/use-cases/get-user-profile.use-case';
import { UserController } from './presentation/controllers/user.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: USER_MODEL_NAME, schema: UserSchema }]),
  ],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: MongooseUserRepository,
    },
    RegisterUserUseCase,
    GetUserProfileUseCase,
  ],
  controllers: [UserController],
  exports: [USER_REPOSITORY, RegisterUserUseCase],
})
export class UserModule {}
```

### Swagger / OpenAPI

All DTOs and controllers must be decorated for Swagger. Available at `/api`.

```typescript
// src/main.ts — add after app creation, before app.listen()
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('Smile API')
  .setDescription('API documentation')
  .setVersion('1.0')
  .addBearerAuth()
  .build();
const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api', app, document);
```

```typescript
// Command DTO — use @ApiProperty for each field
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class LoginCommand {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'strongpassword' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}
```

```typescript
// Controller — use @ApiTags, @ApiBearerAuth, @ApiResponse
import { ApiTags, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
@Public()
export class AuthController { ... }

// For authenticated controllers:
@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController { ... }
```

Response DTOs should use `@ApiProperty` so Swagger renders the schema:

```typescript
export class UserResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ enum: ['USER', 'ADMIN'] })
  role!: 'USER' | 'ADMIN';

  @ApiProperty()
  createdAt!: Date;
}
```

---

## Dependency Injection

DI tokens are `Symbol`s defined in `<context>.tokens.ts` alongside the module root.

Current tokens:
```
user.tokens.ts:  USER_REPOSITORY           →  MongooseUserRepository
auth.tokens.ts:  TOKEN_SERVICE             →  JwtTokenService
auth.tokens.ts:  REFRESH_TOKEN_REPOSITORY  →  MongooseRefreshTokenRepository
```

Always use `@Inject(TOKEN)` with the abstract class as the constructor type (see DDD Rules for why abstract class instead of interface):

```typescript
constructor(@Inject(USER_REPOSITORY) private readonly repo: UserRepository) {}
```

**Cross-module use case injection:** If a use case in module B (e.g. `RegisterAndLoginUseCase` in AuthModule) injects a use case from module A (e.g. `RegisterUserUseCase` from UserModule), the providing module A must **export** that use case in its `exports` array so Nest can resolve it. The consuming module B must **import** module A.

---

## Domain Exceptions

All domain exceptions extend `DomainException` (`src/common/domain/domain-exception.ts`).
`DomainExceptionFilter` maps them to HTTP responses — do not catch in controllers.

Response shape: `{ statusCode, errorCode, message }`

Current exceptions:
```
DomainException (abstract)
├── UserNotFoundException           statusCode=404  errorCode='USER_NOT_FOUND'
├── EmailAlreadyExistsException     statusCode=409  errorCode='EMAIL_ALREADY_EXISTS'
└── InvalidCredentialsException     statusCode=401  errorCode='INVALID_CREDENTIALS'
```

To add a new exception: extend `DomainException`, declare `readonly statusCode` and `readonly errorCode`.
Place in `src/modules/<context>/domain/exceptions/`.

---

## Code Style

**Prettier**: single quotes, trailing commas (`all`). Run `npm run format` before committing.

**ESLint** (`eslint.config.mjs`): `npm run lint` must pass with zero errors before every commit.

Active rules:
```js
'@typescript-eslint/no-explicit-any': 'error',          // use unknown + narrow
'@typescript-eslint/no-floating-promises': 'error',     // always await or void
'@typescript-eslint/no-unsafe-argument': 'error',
'@typescript-eslint/no-unsafe-assignment': 'error',
'@typescript-eslint/no-unsafe-member-access': 'error',
'@typescript-eslint/explicit-function-return-type': 'warn',
'@typescript-eslint/consistent-type-imports': 'error',  // import type { Foo }
'no-console': 'warn',                                   // use Logger, not console.log
'no-return-await': 'error',
'eqeqeq': ['error', 'always'],
```

E2E test files (`test/**`) have `no-unsafe-*` rules turned off (supertest returns untyped responses).

**Override modifier:** With `noImplicitOverride: true`, any method that overrides a base class method (e.g. `canActivate` in a guard extending `AuthGuard`) must be marked with the `override` keyword.

**consistent-type-imports:** Use `import type { Foo }` for types and interfaces used only in type position. For **abstract classes that you extend** (e.g. `UserRepository`, `TokenServicePort`), use a normal `import { AbstractClass }` — not `import type` — because `extends` needs the constructor value at runtime. The same applies to **domain entities (and any class) used as values**: e.g. `new UserEntity(...)` in a use case or repository requires a normal `import { UserEntity }`, not `import type`.

**Controller property names:** Do not give a controller dependency the same name as a route handler method (e.g. `private readonly login: LoginUseCase` and `async login()`). Use distinct names (e.g. `loginUseCase` and `login()`) to avoid "Duplicate identifier" errors.

**JWT sign options:** `JwtService.sign(payload, { secret, expiresIn })` — `expiresIn` from `ConfigService.get()` is inferred as `string`; `@types/jsonwebtoken` expects `number | StringValue`. Cast the env value, e.g. `(expiresIn) as import('ms').StringValue`, or `import type { StringValue } from 'ms'` and cast to `StringValue`, so the build passes.

**Unused imports:** In port implementations (e.g. `JwtTokenService` extending `TokenServicePort`), do not import `Inject` or the port token — the implementation is bound via the token in the module, not injected. In module files, import only symbols that are actually used (e.g. omit `UserRepository` if the module only references `USER_REPOSITORY` and `useClass: MongooseUserRepository`).

---

## Validation

**HTTP DTOs**: `class-validator` + `class-transformer` decorators on Command classes in `application/dto/`.
`ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` is set globally — do not remove it.

**Environment variables**: validated with Zod at bootstrap in `src/common/infrastructure/config/env.schema.ts`:

```typescript
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),
});
```

`main.ts` calls `envSchema.safeParse(process.env)` before NestJS bootstraps — exits with code 1 on failure.
Never add a new env variable without adding it to `envSchema` and `.env.example` in the same commit.

**`.env.example` reference:**

```dotenv
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/smile-api
JWT_SECRET=change-me-to-a-random-string-32-chars-min
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
```

---

## Testing

### Where tests live

| Kind        | Location              | Naming           | Command     | Config              |
|------------|------------------------|------------------|-------------|---------------------|
| **Unit**   | `src/` (co-located or `__tests__/`) | `*.spec.ts`      | `npm test`  | `package.json` jest |
| **E2E**    | `test/<context>/`     | `*.e2e-spec.ts`  | `npm run test:e2e` | `test/jest-e2e.json` |

The project does not yet contain any `*.spec.ts` or `*.e2e-spec.ts` files; the layout below is the target structure when tests are added.

**Layout:**

```
src/
├── modules/
│   ├── user/
│   │   ├── domain/entities/
│   │   │   ├── user.entity.ts
│   │   │   └── user.entity.spec.ts           ← unit: co-located
│   │   ├── application/use-cases/
│   │   │   ├── get-user-profile.use-case.ts
│   │   │   ├── get-user-profile.use-case.spec.ts
│   │   │   └── __tests__/                    ← unit: optional, group in __tests__/
│   │   │       └── update-user.use-case.spec.ts
│   │   └── ...
│   └── auth/
│       └── ...
test/
├── jest-e2e.json                             ← E2E config only
├── user/
│   ├── user.e2e-spec.ts                      ← E2E: user endpoints
│   └── auth.e2e-spec.ts                     ← E2E: auth endpoints
└── <new-context>/
    └── *.e2e-spec.ts
```

- **Unit**: `*.spec.ts` either next to the file under test (co-located) or inside a `__tests__/` subfolder in the same layer (e.g. `application/use-cases/__tests__/`). Jest `testRegex: ".*\\.spec\\.ts$"` matches both; no extra config. Prefer co-located for one test file per source file; use `__tests__/` when you group several specs in one folder.
- **E2E**: All E2E under `test/`, grouped by context. Config: `test/jest-e2e.json`; `rootDir` is project root.

### Unit tests (`*.spec.ts`)
- **Domain**: No mocks, no DB — test business rules in isolation.
- **Application**: Mock repository and service ports with `jest.fn()`.
- **Presentation**: Mock use cases with `jest.fn()`.

### E2E tests (`*.e2e-spec.ts`)
- Full NestJS app with supertest; real MongoDB (local or test Atlas).
- Each suite seeds and cleans up its data. Use `beforeAll` to create the app and seed; `afterAll` to drop collections and close the app. Do not rely on data left by other suites.

```typescript
// Seed pattern for E2E
let app: INestApplication;
let userModel: Model<UserDocument>;

beforeAll(async () => {
  const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = module.createNestApplication();
  // apply same global pipes/filters as main.ts
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  await app.init();

  userModel = module.get<Model<UserDocument>>(getModelToken(USER_MODEL_NAME));
  // seed test data
  await userModel.create({ email: 'admin@test.com', passwordHash: '...', role: 'ADMIN' });
});

afterAll(async () => {
  await userModel.deleteMany({});
  await app.close();
});
```

- **Config**: Use this exact `test/jest-e2e.json` to handle path aliases (`@/` → `../src/`) correctly:
  ```json
  {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": ".",
    "testEnvironment": "node",
    "testRegex": ".e2e-spec.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "moduleNameMapper": {
      "^@/(.*)$": "<rootDir>/../src/$1",
      "^(\\.{1,2}/.*)\\.js$": "$1"
    }
  }
  ```

### Jest
- Runner: `ts-jest`. The E2E config includes `"^(\\.{1,2}/.*)\\.js$": "$1"` in `moduleNameMapper` to strip any accidental `.js` suffixes — harmless for CJS.
- Unit: `rootDir` is `src/`. E2E: `rootDir` is `.`, config in `test/jest-e2e.json`.

---

## Environment Variables

- Source of truth: `.env.example` — keep in sync with `envSchema`.
- Access config via `ConfigService` — never `process.env` directly in application code.
- `process.env` is only allowed in `src/common/infrastructure/config/` and `main.ts`.
- `ConfigService.get<T>(key)` returns `T | undefined`. When passing to third-party APIs that require a defined value (e.g. passport-jwt `secretOrKey`), provide a fallback (e.g. `?? ''`) or assertion so the type is `string` (or the expected type); env is validated at bootstrap so the value will be set at runtime.

**If `.env` is missing:** Copy `.env.example` and set `MONGODB_URI` and `JWT_SECRET` (minimum 32 characters).

---

## Security

**Authentication & Authorization**
- Every route must explicitly opt in or out of auth — no implicit public routes.
- Auth endpoints: mark the controller class with `@Public()` (class-level).
- Protected endpoints: `@UseGuards(JwtAuthGuard)` on the method or controller.
- Role-restricted endpoints: add `@UseGuards(RolesGuard)` + `@Roles('ADMIN')`.

**Passwords**
- Hashed with bcrypt, cost factor 12.
- Max input length: 72 characters (bcrypt limit) — enforce in Command DTO with `@MaxLength(72)`.

**JWT**
- Access token TTL: 15 minutes (`JWT_ACCESS_EXPIRATION`).
- Refresh token TTL: 7 days (`JWT_REFRESH_EXPIRATION`).
- Minimum `JWT_SECRET` length: 32 characters — enforced at bootstrap by Zod.
- Refresh tokens: stored in DB (`RefreshToken` collection) with `userId`, `refreshToken`, `expiresAt`, `revokedAt`. On logout, set `revokedAt`; reject tokens where `revokedAt` is set or `expiresAt` is in the past.
- **Refresh token rotation:** On each successful refresh, issue a new refresh token and revoke the previous one (set `revokedAt` on the old token). The client must use the new token for the next refresh; this limits reuse of stolen tokens.

**Database**
- Use Mongoose methods for queries (parameterized by default). Never build query filters from raw string concatenation.
- Never expose raw Mongoose or MongoDB errors to HTTP responses.

---

## Troubleshooting

### "Can't reach database server" / MongoDB connection errors
**Cause:** MongoDB not running or wrong `MONGODB_URI`
**Solution:** Start MongoDB locally or use a valid Atlas (or other) connection string in `.env`. No migrations needed.

### BSONError: input must be a 24 character hex string (ObjectId)
**Cause:** A uuid or other non-ObjectId string was used for a document `_id` or for a field typed as `Types.ObjectId` (e.g. RefreshToken `userId`). Mongoose expects ObjectId = 24-char hex.
**Solution:** In use cases that create User or RefreshToken entities, use `import { Types } from 'mongoose'` and set `id: new Types.ObjectId().toString()`. Do not use uuid for MongoDB document ids.

### "CannotDetermineTypeError" for nullable Mongoose fields
**Cause:** `@Prop({ default: null })` on a `Date | null` union type — Mongoose cannot infer the type from a union.
**Solution:** Always pass `type` explicitly for nullable fields:
```typescript
@Prop({ type: Date, default: null })
revokedAt!: Date | null;
```
Same rule applies to any `T | null` prop: `@Prop({ type: T, default: null })`.

### "Circular dependency detected"
**Cause:** Two modules importing each other.
**Preferred fix:** Extract the shared dependency (use case or repository) into a third module that both import. This keeps the dependency graph acyclic.
**Last resort only:** Use `forwardRef()` if a true circular relationship cannot be avoided:
```typescript
@Module({
  imports: [forwardRef(() => OtherModule)],
})
```

### "Cannot find module '...' or its corresponding type declarations"
**Cause:** Dependencies not installed (e.g. fresh clone, new environment).
**Solution:** Run `npm install` and restart the dev server or TypeScript watch.

### E2E tests fail with auth errors
**Cause:** Missing environment variables (e.g. `JWT_SECRET`) in test environment. Jest does not automatically load `.env.test`.
**Solution:**
1. Create `.env.test` from `.env.example` and fill in all required vars.
2. Load it explicitly at the top of each E2E spec file:
```typescript
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });
```
Or add a `globalSetup` file in `test/jest-e2e.json` that calls `dotenv.config({ path: '.env.test' })` before the suite runs.

---

## Git & GitHub

### Branch Strategy

```
main          ← production — never commit directly, never open PRs here
development   ← integration — all PRs target this branch
feature/*     ← one task per branch, branched from development
fix/*         ← bug fixes
chore/*       ← tooling, config, dependency updates
```

```bash
git checkout development && git pull origin development
git checkout -b feature/<short-description>
```

### Commit Format

```
<type>(<scope>): <what was done>
```

Types: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`, `style`, `perf`

Examples:
```
feat(auth): add logout endpoint with refresh token revocation
feat(auth): add refresh token rotation on every use
fix(user): prevent duplicate email registration race condition
chore(deps): upgrade mongoose
```

### Pull Requests

Always target `development`:
```bash
git push -u origin <branch-name>
gh pr create --base development --title "<type>(<scope>): <description>" --body "..."
```

One PR per task. PR title follows commit format.

### Rules
- Never force-push to `development` or `main`.
- Never commit `.env`, `dist/`, or `node_modules/`.
- Each commit must represent a working, tested state.

---

## Do Not

- Import Mongoose (Model, Schema, Connection) or inject models outside `infrastructure/` persistence layer.
- Use `interface` for repository or service contracts — use `abstract class`.
- Use `import type` for abstract classes that you extend — use a normal `import` (extends needs the value).
- Omit the `override` modifier when overriding a base class method (required with noImplicitOverride).
- Use `implements` for repository/service adapters — use `extends` (and call `super()`).
- Define DI token Symbols inside domain files — put them in `<context>.tokens.ts`.
- Let a module inject a use case from another module without that module exporting the use case — add it to the providing module's `exports`.
- Call repositories or infrastructure services from controllers — always through a use case.
- Add `@Injectable()` or any NestJS decorator in the domain layer.
- Access `req.user` directly in controllers — use `@CurrentUser()`.
- Let `DomainException` bubble past a controller — `DomainExceptionFilter` handles it automatically.
- Use `any` — enforced by ESLint. Use `unknown` and narrow.
- Add a new env variable without updating both `envSchema` and `.env.example`.
- Use `process.env` outside of `src/common/infrastructure/config/` or `main.ts`.
- Disable or downgrade ESLint rules without justification.
- Put unit tests (`*.spec.ts`) under `test/` or E2E (`*.e2e-spec.ts`) under `src/` — unit in `src/` (co-located or in `__tests__/`), E2E in `test/<context>/`.
