import {
  AuthValidationError,
  type FieldErrors,
  type LoginInput,
  type RegisterInput,
} from "@/modules/auth/domain/types";

export const EMAIL_MAX_LENGTH = 255;
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 32;
export const DISPLAY_NAME_MAX_LENGTH = 50;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const USERNAME_PATTERN = /^[a-z0-9_]+$/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function normalizeDisplayName(displayName: string): string {
  return displayName.trim();
}

export function validateEmail(email: string): string | undefined {
  const normalized = normalizeEmail(email);
  if (!normalized) return "Email is required.";
  if (normalized.length > EMAIL_MAX_LENGTH) {
    return `Email must be at most ${EMAIL_MAX_LENGTH} characters.`;
  }
  if (!EMAIL_PATTERN.test(normalized)) return "Enter a valid email address.";
  return undefined;
}

export function validateUsername(username: string): string | undefined {
  const normalized = normalizeUsername(username);
  if (!normalized) return "Username is required.";
  if (
    normalized.length < USERNAME_MIN_LENGTH ||
    normalized.length > USERNAME_MAX_LENGTH
  ) {
    return `Username must be ${USERNAME_MIN_LENGTH}–${USERNAME_MAX_LENGTH} characters.`;
  }
  if (!USERNAME_PATTERN.test(normalized)) {
    return "Username may contain lowercase letters, numbers, and underscores.";
  }
  return undefined;
}

export function validateDisplayName(displayName: string): string | undefined {
  const normalized = normalizeDisplayName(displayName);
  if (!normalized) return "Display name is required.";
  if (normalized.length > DISPLAY_NAME_MAX_LENGTH) {
    return `Display name must be at most ${DISPLAY_NAME_MAX_LENGTH} characters.`;
  }
  return undefined;
}

export function validatePassword(password: string): string | undefined {
  if (!password) return "Password is required.";
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`;
  }
  return undefined;
}

export function parseRegisterInput(input: RegisterInput): {
  email: string;
  username: string;
  displayName: string;
  password: string;
} {
  const fields: FieldErrors = {};
  const emailError = validateEmail(input.email);
  const usernameError = validateUsername(input.username);
  const displayNameError = validateDisplayName(input.displayName);
  const passwordError = validatePassword(input.password);

  if (emailError) fields.email = emailError;
  if (usernameError) fields.username = usernameError;
  if (displayNameError) fields.displayName = displayNameError;
  if (passwordError) fields.password = passwordError;

  if (Object.keys(fields).length > 0) {
    throw new AuthValidationError(fields);
  }

  return {
    email: normalizeEmail(input.email),
    username: normalizeUsername(input.username),
    displayName: normalizeDisplayName(input.displayName),
    password: input.password,
  };
}

export function parseLoginInput(input: LoginInput): {
  email: string;
  password: string;
} {
  const fields: FieldErrors = {};
  const emailError = validateEmail(input.email);
  const passwordError = validatePassword(input.password);

  if (emailError) fields.email = emailError;
  if (passwordError) fields.password = passwordError;

  if (Object.keys(fields).length > 0) {
    throw new AuthValidationError(fields);
  }

  return {
    email: normalizeEmail(input.email),
    password: input.password,
  };
}
