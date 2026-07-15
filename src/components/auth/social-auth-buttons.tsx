"use client";

import { useAuth } from "@/providers/auth-provider";
import type { OAuthProvider } from "@/types/auth";
import { cn } from "@/lib/cn";
import { useRouter } from "next/navigation";
import { useState } from "react";

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

interface SocialAuthButtonsProps {
  disabled?: boolean;
  onError?: (message: string) => void;
}

export function SocialAuthButtons({ disabled, onError }: SocialAuthButtonsProps) {
  const router = useRouter();
  const { signInWithGoogle, signInWithApple } = useAuth();
  const [loading, setLoading] = useState<OAuthProvider | null>(null);

  async function handleSignIn(provider: OAuthProvider) {
    setLoading(provider);
    const signIn = provider === "google" ? signInWithGoogle : signInWithApple;
    const result = await signIn();
    setLoading(null);

    if (!result.ok) {
      onError?.(result.error);
      return;
    }

    router.push("/welcome");
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={disabled || loading !== null}
          onClick={() => handleSignIn("google")}
          className={cn(
            "inline-flex h-12 items-center justify-center gap-2.5 rounded-2xl border border-border-subtle bg-white px-4",
            "type-body-plain text-navy-900 transition-all duration-300",
            "hover:-translate-y-0.5 hover:border-border hover:shadow-sm",
            "disabled:pointer-events-none disabled:opacity-50",
            "dark:bg-white dark:text-navy-900",
          )}
        >
          <GoogleIcon />
          <span>{loading === "google" ? "…" : "Google"}</span>
        </button>

        <button
          type="button"
          disabled={disabled || loading !== null}
          onClick={() => handleSignIn("apple")}
          className={cn(
            "inline-flex h-12 items-center justify-center gap-2.5 rounded-2xl border border-black/10 bg-[#1a1a1a] px-4",
            "type-body-plain text-white transition-all duration-300",
            "hover:-translate-y-0.5 hover:bg-black hover:shadow-sm",
            "disabled:pointer-events-none disabled:opacity-50",
          )}
        >
          <AppleIcon />
          <span>{loading === "apple" ? "…" : "Apple"}</span>
        </button>
      </div>

      <p className="text-center text-xs text-foreground-muted">تسجيل تجريبي — للعرض فقط</p>
    </div>
  );
}
