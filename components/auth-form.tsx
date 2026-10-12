"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2, MailCheck } from "lucide-react";
import { signInAction, signInWithGoogleAction, signUpAction } from "@/app/actions";
import { Logo } from "./navbar";
import { Button, Card, Label } from "./ui";

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.3 12 2.3 6.6 2.3 2.3 6.6 2.3 12s4.3 9.7 9.7 9.7c5.6 0 9.3-3.9 9.3-9.5 0-.6-.1-1.1-.2-1.6H12z" />
    </svg>
  );
}

export function AuthForm({ mode, next, error: initialError }: { mode: "login" | "signup"; next: string; error?: string }) {
  const isLogin = mode === "login";
  const [state, action, pending] = useActionState(isLogin ? signInAction : signUpAction, undefined);
  const error = state?.error ?? (state ? undefined : initialError);
  const nextQuery = next !== "/" ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm p-8">
        <div className="flex justify-center"><Logo /></div>

        {state?.message ? (
          <div className="mt-6 text-center">
            <MailCheck size={40} className="mx-auto text-success" />
            <h1 className="mt-4 text-xl font-semibold">Check your inbox</h1>
            <p className="mt-2 text-sm text-muted">{state.message}</p>
          </div>
        ) : (
          <>
            <h1 className="mt-6 text-center text-xl font-semibold">
              {isLogin ? "Welcome back" : "Create your account"}
            </h1>
            <p className="mt-1 text-center text-sm text-muted">
              {isLogin ? "Log in to access your library" : "Buy, try and sell AI prompts"}
            </p>

            <form action={signInWithGoogleAction} className="mt-6">
              <input type="hidden" name="next" value={next} />
              <Button variant="secondary" className="w-full"><GoogleIcon /> Continue with Google</Button>
            </form>
            <div className="my-5 flex items-center gap-3 text-xs text-muted">
              <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
            </div>

            <form action={action} className="space-y-4">
              <input type="hidden" name="next" value={next} />
              {!isLogin && (
                <div>
                  <Label htmlFor="name">Name</Label>
                  <input id="name" name="name" required className="input" autoComplete="name" />
                </div>
              )}
              <div>
                <Label htmlFor="email">Email</Label>
                <input id="email" name="email" type="email" required className="input" autoComplete="email" />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <input id="password" name="password" type="password" required minLength={isLogin ? undefined : 8}
                  className="input" autoComplete={isLogin ? "current-password" : "new-password"} />
              </div>
              {error && <p className="rounded-lg bg-danger/10 p-3 text-sm text-danger">{error}</p>}
              <Button type="submit" className="w-full" disabled={pending}>
                {pending && <Loader2 size={16} className="animate-spin" />}
                {isLogin ? "Log in" : "Create account"}
              </Button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm text-muted">
          {isLogin ? "New to GoPrompts? " : "Already have an account? "}
          <Link href={`${isLogin ? "/signup" : "/login"}${nextQuery}`} className="text-primary hover:underline">
            {isLogin ? "Sign up" : "Log in"}
          </Link>
        </p>
      </Card>
    </div>
  );
}
