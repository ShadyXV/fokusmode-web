import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Timer, Zap } from "lucide-react";

export default function LoginPage() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      formData.set("flow", flow);
      await signIn("password", formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
        <section className="flex flex-col justify-between p-8 md:p-12">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500 text-white shadow-lg shadow-violet-500/20">
              <Timer className="h-7 w-7" />
            </div>
            <span className="text-xl font-bold tracking-tight">FokusMode</span>
          </div>

          <div className="max-w-xl py-16">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-200">
              <Zap className="h-3.5 w-3.5" />
              Deep work, tracked cleanly
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              Keep every focus session tied to your account.
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-6 text-muted-foreground md:text-base">
              FokusMode helps you run focused work sessions, track breaks, log
              distractions, and review your progress without mixing your data
              with anyone else.
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            Private focus history. Portable JSON exports. No extra auth provider.
          </p>
        </section>

        <section className="flex items-center justify-center border-t border-white/5 bg-card/30 p-6 backdrop-blur-xl lg:border-l lg:border-t-0">
          <form
            className="glass-dark w-full max-w-sm space-y-5 rounded-2xl p-6"
            onSubmit={handleSubmit}
          >
            <div>
              <h2 className="text-xl font-semibold">
                {flow === "signIn" ? "Sign in" : "Create account"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Use your email and password to continue.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="h-10 bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={
                  flow === "signIn" ? "current-password" : "new-password"
                }
                required
                className="h-10 bg-background/50"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button
              className="h-10 w-full rounded-xl font-semibold"
              disabled={submitting}
              type="submit"
            >
              {submitting
                ? "Working..."
                : flow === "signIn"
                  ? "Sign in"
                  : "Create account"}
            </Button>

            <Button
              className="w-full text-muted-foreground"
              disabled={submitting}
              type="button"
              variant="ghost"
              onClick={() =>
                setFlow((current) =>
                  current === "signIn" ? "signUp" : "signIn"
                )
              }
            >
              {flow === "signIn"
                ? "Need an account? Sign up"
                : "Already have an account? Sign in"}
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
}
