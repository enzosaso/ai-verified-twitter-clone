import { hash, verify } from "@node-rs/argon2";

const argon2idOptions = {
  algorithm: 2, // Argon2id — numeric because the package exports a const enum
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
};

export async function hashPassword(password: string): Promise<string> {
  return hash(password, argon2idOptions);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return verify(passwordHash, password);
}
