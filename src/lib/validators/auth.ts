import type { LoginInput, RegisterInput } from "@/types/auth";

export type FieldErrors<T extends string> = Partial<Record<T, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegister(input: RegisterInput): FieldErrors<keyof RegisterInput> {
  const errors: FieldErrors<keyof RegisterInput> = {};

  const fullName = input.fullName.trim();
  if (!fullName) {
    errors.fullName = "الاسم الكامل مطلوب";
  } else if (fullName.length < 3) {
    errors.fullName = "الاسم يجب أن يكون 3 أحرف على الأقل";
  }

  const email = input.email.trim();
  if (!email) {
    errors.email = "البريد الإلكتروني مطلوب";
  } else if (!EMAIL_RE.test(email)) {
    errors.email = "أدخل بريدًا إلكترونيًا صالحًا";
  }

  if (!input.password) {
    errors.password = "كلمة المرور مطلوبة";
  } else if (input.password.length < 8) {
    errors.password = "كلمة المرور يجب أن تكون 8 أحرف على الأقل";
  }

  if (!input.confirmPassword) {
    errors.confirmPassword = "تأكيد كلمة المرور مطلوب";
  } else if (input.password !== input.confirmPassword) {
    errors.confirmPassword = "كلمتا المرور غير متطابقتين";
  }

  return errors;
}

export function validateLogin(input: LoginInput): FieldErrors<keyof LoginInput> {
  const errors: FieldErrors<keyof LoginInput> = {};

  const email = input.email.trim();
  if (!email) {
    errors.email = "البريد الإلكتروني مطلوب";
  } else if (!EMAIL_RE.test(email)) {
    errors.email = "أدخل بريدًا إلكترونيًا صالحًا";
  }

  if (!input.password) {
    errors.password = "كلمة المرور مطلوبة";
  }

  return errors;
}

export function hasFieldErrors<T extends string>(errors: FieldErrors<T>): boolean {
  return Object.keys(errors).length > 0;
}
