"use client";

import type React from "react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronLeftIcon, AtSignIcon, LockIcon, AlertCircle } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FloatingPaths } from "@/components/floating-paths";
import { FIRM_EMAIL, useAuth } from "@/lib/auth";

const DEMO_PASSWORD = "Intake2026!";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (login(email, password)) {
      navigate(location.state?.from ?? "/dashboard", { replace: true });
    } else {
      setError("Incorrect email or password.");
    }
  }

  function fillDemo() {
    setEmail(FIRM_EMAIL);
    setPassword(DEMO_PASSWORD);
    setError(null);
  }

  return (
    <main className="relative md:h-screen md:overflow-hidden lg:grid lg:grid-cols-2">
      <div className="relative hidden h-full flex-col border-r bg-secondary p-10 lg:flex dark:bg-secondary/20">
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background" />
        <Logo className="mr-auto h-4.5" />
        <div className="z-10 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-xl">
              &ldquo;Intake that used to take our paralegals twenty minutes now lands organized and prioritized before we
              even pick up the phone.&rdquo;
            </p>
            <footer className="font-mono font-semibold text-sm">~ Managing Partner, PI Firm</footer>
          </blockquote>
        </div>
        <div className="absolute inset-0">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>
      </div>

      <div className="relative flex min-h-screen flex-col justify-center px-8">
        <Button asChild className="absolute top-7 left-5" variant="ghost">
          <Link to="/">
            <ChevronLeftIcon data-icon="inline-start" />
            Home
          </Link>
        </Button>

        <div className="mx-auto w-full space-y-6 sm:w-sm">
          <Logo className="h-4.5 lg:hidden" />
          <div className="space-y-1">
            <h1 className="font-bold text-2xl tracking-tight">Firm sign in</h1>
            <p className="text-sm text-muted-foreground">Staff access to the intake dashboard.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <AtSignIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="firm@legalintake.ai"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <LockIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  className="pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="size-4 shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </form>

          <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <p className="font-medium">Demo login</p>
            <p className="font-mono">{FIRM_EMAIL} · {DEMO_PASSWORD}</p>
            <button type="button" onClick={fillDemo} className="mt-1 underline underline-offset-2 hover:text-foreground">
              Fill demo credentials
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
