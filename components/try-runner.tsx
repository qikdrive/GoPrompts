"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { FlaskConical, Loader2, Lock } from "lucide-react";
import { runTestAction } from "@/app/actions";
import type { AIModel } from "@/lib/types";
import { Button, buttonClass, Label } from "./ui";

const LONG_FIELDS = ["code", "tasks", "text", "content"];

/** "Try before you buy": runs on the server, the template never reaches the browser. */
export function TryRunner({
  promptId,
  slug,
  model,
  variables,
  defaults,
  runsLeft: initialRunsLeft,
  signedIn,
}: {
  promptId: string;
  slug: string;
  model: AIModel;
  variables: string[];
  defaults: Record<string, string>;
  runsLeft: number | null;
  signedIn: boolean;
}) {
  const [values, setValues] = useState<Record<string, string>>(defaults);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [runsLeft, setRunsLeft] = useState(initialRunsLeft ?? 0);
  const [loading, startTransition] = useTransition();

  function run() {
    setError("");
    setOutput("");
    startTransition(async () => {
      const res = await runTestAction(promptId, values);
      if ("error" in res && res.error) {
        setError(res.error);
        if (res.error.includes("limit")) setRunsLeft(0);
      } else if ("output" in res) {
        setOutput(res.output ?? "");
        setRunsLeft(res.runsLeft ?? 0);
      }
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <FlaskConical size={20} className="text-accent" /> Try it free
        </h2>
        {signedIn && <span className="text-xs text-muted">{runsLeft} test runs left today</span>}
      </div>
      <p className="mt-1 text-sm text-muted">
        Fill in your own inputs and see a real result. The prompt stays hidden.
      </p>

      {!signedIn ? (
        <Link href={`/login?next=/p/${slug}`} className={buttonClass("secondary", "md", "mt-5")}>
          Log in to try this prompt
        </Link>
      ) : (
        <form
          className="mt-5 grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            run();
          }}
        >
          {variables.map((v) => {
            const long = LONG_FIELDS.includes(v);
            return (
              <div key={v} className={long ? "sm:col-span-2" : ""}>
                <Label htmlFor={`var-${v}`}>{v.replace(/_/g, " ")}</Label>
                {long ? (
                  <textarea
                    id={`var-${v}`}
                    rows={4}
                    className="input font-mono"
                    value={values[v] ?? ""}
                    onChange={(e) => setValues({ ...values, [v]: e.target.value })}
                  />
                ) : (
                  <input
                    id={`var-${v}`}
                    className="input"
                    value={values[v] ?? ""}
                    onChange={(e) => setValues({ ...values, [v]: e.target.value })}
                  />
                )}
              </div>
            );
          })}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={loading || runsLeft <= 0} className="w-full sm:w-auto">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <FlaskConical size={16} />}
              {runsLeft <= 0 ? "Daily limit reached" : loading ? "Running..." : "Run test"}
            </Button>
          </div>
        </form>
      )}

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      {(output || loading) && (
        <div className="mt-5 rounded-xl border border-border bg-background p-4">
          <div className="mb-2 flex items-center gap-2 text-xs text-muted">
            <Lock size={12} /> Output · {model}
          </div>
          {loading ? (
            <div className="space-y-2">
              <div className="h-3 w-3/4 animate-pulse rounded bg-surface-2" />
              <div className="h-3 w-full animate-pulse rounded bg-surface-2" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-surface-2" />
            </div>
          ) : (
            <pre className="font-sans text-sm whitespace-pre-wrap">{output}</pre>
          )}
        </div>
      )}
    </div>
  );
}
