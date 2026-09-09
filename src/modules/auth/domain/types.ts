export type SafeUser = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
};

export type RegisterInput = {
  email: string;
  username: string;
  displayName: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type FieldErrors = Partial<
  Record<"email" | "username" | "displayName" | "password" | "form", string>
>;

export class AuthValidationError extends Error {
  readonly fields: FieldErrors;

  constructor(fields: FieldErrors) {
    super("Validation failed");
    this.name = "AuthValidationError";
    this.fields = fields;
  }
}

export class AuthConflictError extends Error {
  readonly field: "email" | "username";

  constructor(field: "email" | "username", message: string) {
    super(message);
    this.name = "AuthConflictError";
    this.field = field;
  }
}

export class AuthUnauthorizedError extends Error {
  constructor(message = "Invalid email or password") {
    super(message);
    this.name = "AuthUnauthorizedError";
  }
}

export const SAFE_USER_SELECT = {
  id: true,
  email: true,
  username: true,
  displayName: true,
  bio: true,
  avatarUrl: true,
} as const;
