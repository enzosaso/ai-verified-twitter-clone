import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { toSafeUser } from "@/modules/auth/domain/safe-user";
import {
  AuthConflictError,
  AuthUnauthorizedError,
  SAFE_USER_SELECT,
  type LoginInput,
  type RegisterInput,
  type SafeUser,
} from "@/modules/auth/domain/types";
import {
  parseLoginInput,
  parseRegisterInput,
} from "@/modules/auth/domain/validation";
import { SESSION_TTL_MS } from "@/modules/auth/infrastructure/session-cookie";
import {
  generateSessionToken,
  hashSessionToken,
} from "@/modules/auth/infrastructure/session-token";

export type AuthSuccess = {
  user: SafeUser;
  sessionToken: string;
};

let dummyPasswordHash: string | undefined;

async function getDummyPasswordHash(): Promise<string> {
  dummyPasswordHash ??= await hashPassword("not-a-real-user-password");
  return dummyPasswordHash;
}

function conflictField(
  error: Prisma.PrismaClientKnownRequestError,
): "email" | "username" | null {
  const haystack = `${error.message} ${JSON.stringify(error.meta ?? {})}`;
  if (haystack.includes("username")) return "username";
  if (haystack.includes("email")) return "email";
  return null;
}

export async function registerUser(input: RegisterInput): Promise<AuthSuccess> {
  const parsed = parseRegisterInput(input);
  const passwordHash = await hashPassword(parsed.password);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const sessionToken = generateSessionToken();

  try {
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: parsed.email,
          username: parsed.username,
          displayName: parsed.displayName,
          passwordHash,
        },
        select: SAFE_USER_SELECT,
      });

      await tx.session.create({
        data: {
          tokenHash: hashSessionToken(sessionToken),
          userId: created.id,
          expiresAt,
        },
      });

      return created;
    });

    return { user: toSafeUser(user), sessionToken };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const field = conflictField(error) ?? "email";
      throw new AuthConflictError(
        field,
        field === "username"
          ? "That username is already taken."
          : "That email is already registered.",
      );
    }
    throw error;
  }
}

export async function loginUser(input: LoginInput): Promise<AuthSuccess> {
  const parsed = parseLoginInput(input);
  const user = await prisma.user.findUnique({
    where: { email: parsed.email },
  });

  const passwordHash = user?.passwordHash ?? (await getDummyPasswordHash());
  const passwordMatches = await verifyPassword(parsed.password, passwordHash);

  if (!user || !passwordMatches) {
    throw new AuthUnauthorizedError();
  }

  const sessionToken = generateSessionToken();
  await prisma.session.create({
    data: {
      tokenHash: hashSessionToken(sessionToken),
      userId: user.id,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });

  return {
    user: toSafeUser(user),
    sessionToken,
  };
}

export async function resolveSessionUser(
  token: string | undefined,
): Promise<SafeUser | null> {
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: { user: { select: SAFE_USER_SELECT } },
  });

  if (!session) return null;

  if (session.expiresAt <= new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {
      // Expired rows may already have been removed.
    });
    return null;
  }

  return toSafeUser(session.user);
}

export async function logoutSession(token: string | undefined): Promise<void> {
  if (!token) return;

  await prisma.session
    .deleteMany({ where: { tokenHash: hashSessionToken(token) } })
    .catch(() => {
      // Logout is idempotent if the session is already gone.
    });
}
