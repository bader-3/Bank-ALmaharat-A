import type { OAuthProvider } from "@/types/auth";
import { isBrowser } from "@/services/firebase/common";

const USERS_KEY = "asb-users";
const SESSION_KEY = "asb-session";

type StoredUser = {
  id: string;
  fullName: string;
  email: string;
  password: string;
  createdAt: string;
  provider?: OAuthProvider | "email";
  interviewCompleted?: boolean;
};

function toPublicUser(user: StoredUser): Omit<StoredUser, "password"> {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    createdAt: user.createdAt,
    provider: user.provider,
    interviewCompleted: user.interviewCompleted ?? false,
  };
}

function readUsers(): StoredUser[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredUser[];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function createId() {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function createToken(userId: string) {
  return `mock_${userId}_${Date.now()}`;
}

export class SessionPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SessionPersistenceError";
  }
}

export function persistSession(session: { user: Omit<StoredUser, "password">; token: string }) {
  if (!isBrowser()) return;

  const payload = JSON.stringify(session);

  try {
    window.localStorage.setItem(SESSION_KEY, payload);
  } catch {
    throw new SessionPersistenceError(
      "تعذّر حفظ جلسة الدخول. قد يكون التخزين ممتلئًا — جرّب مسح بيانات الموقع أو متصفحًا آخر.",
    );
  }

  const stored = window.localStorage.getItem(SESSION_KEY);
  if (stored !== payload) {
    throw new SessionPersistenceError("تعذّر التحقق من جلسة الدخول بعد الحفظ.");
  }
}

export function readSession(): { user: Omit<StoredUser, "password">; token: string } | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSession() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(SESSION_KEY);
}

export function findUserByEmail(email: string): StoredUser | undefined {
  const normalized = normalizeEmail(email);
  return readUsers().find((user) => user.email === normalized);
}

export function createUser(input: {
  fullName: string;
  email: string;
  password: string;
}): Omit<StoredUser, "password"> {
  const users = readUsers();
  const normalizedEmail = normalizeEmail(input.email);

  if (users.some((user) => user.email === normalizedEmail)) {
    throw new Error("EMAIL_EXISTS");
  }

  const user: StoredUser = {
    id: createId(),
    fullName: input.fullName.trim(),
    email: normalizedEmail,
    password: input.password,
    createdAt: new Date().toISOString(),
    provider: "email",
  };

  writeUsers([...users, user]);

  return toPublicUser(user);
}

export function verifyCredentials(email: string, password: string): Omit<StoredUser, "password"> | null {
  const user = findUserByEmail(email);
  if (!user || user.password !== password) return null;
  return toPublicUser(user);
}

export function createSessionForUser(user: Omit<StoredUser, "password">) {
  const token = createToken(user.id);
  persistSession({ user, token });
  return { user, token };
}

const OAUTH_PROFILES: Record<OAuthProvider, { fullName: string; email: string }> = {
  google: { fullName: "سارة المنصور", email: "demo.google@gmail.com" },
  apple: { fullName: "خالد العتيبي", email: "demo.apple@icloud.com" },
};

export function signInOrCreateOAuthUser(provider: OAuthProvider): Omit<StoredUser, "password"> {
  const profile = OAUTH_PROFILES[provider];
  const existing = findUserByEmail(profile.email);

  if (existing) {
    return toPublicUser({ ...existing, provider: existing.provider ?? provider });
  }

  const user: StoredUser = {
    id: createId(),
    fullName: profile.fullName,
    email: profile.email,
    password: `oauth_${provider}_${createId()}`,
    createdAt: new Date().toISOString(),
    provider,
  };

  writeUsers([...readUsers(), user]);

  return toPublicUser(user);
}

export function markInterviewCompleted(userId: string) {
  const session = readSession();
  let users = readUsers();
  let target = users.find((user) => user.id === userId);

  if (!target && session?.user.id === userId) {
    const recovered: StoredUser = {
      id: session.user.id,
      fullName: session.user.fullName,
      email: session.user.email,
      password: `recovered_${session.user.id}`,
      createdAt: session.user.createdAt,
      provider: session.user.provider,
      interviewCompleted: true,
    };
    users = [...users, recovered];
    target = recovered;
  } else if (target) {
    users = users.map((user) =>
      user.id === userId ? { ...user, interviewCompleted: true } : user,
    );
    target = users.find((user) => user.id === userId);
  }

  if (!target) return;

  writeUsers(
    users.map((user) => (user.id === userId ? { ...user, interviewCompleted: true } : user)),
  );

  const publicUser = toPublicUser({ ...target, interviewCompleted: true });

  if (session?.user.id === userId) {
    persistSession({
      ...session,
      user: publicUser,
    });
    return;
  }

  createSessionForUser(publicUser);
}

/** يعيد المستخدم لحالة ما قبل إكمال المقابلة (للحساب التجريبي مثلًا). */
export function resetInterviewCompletion(
  userId: string,
  options?: { fullName?: string },
) {
  const users = readUsers();
  const target = users.find((user) => user.id === userId);
  if (!target) return;

  const next: StoredUser = {
    ...target,
    fullName: options?.fullName?.trim() || target.fullName,
    interviewCompleted: false,
  };

  writeUsers(users.map((user) => (user.id === userId ? next : user)));

  const session = readSession();
  const publicUser = toPublicUser(next);
  if (session?.user.id === userId) {
    persistSession({ ...session, user: publicUser });
  } else {
    createSessionForUser(publicUser);
  }
}

export function getUserById(userId: string): Omit<StoredUser, "password"> | null {
  const user = readUsers().find((entry) => entry.id === userId);
  return user ? toPublicUser(user) : null;
}
