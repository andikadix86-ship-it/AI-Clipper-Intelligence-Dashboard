"use client";

import { Loader2, Play } from "lucide-react";
import { useState } from "react";

export function RunCeoAgentButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function runCeo() {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/agents/ceo/run", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "CEO Agent failed.");
      setMessage(`Created: ${data.plan.title}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "CEO Agent failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button type="button" onClick={runCeo} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-300 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
        Run CEO Agent
      </button>
      {message ? <div className="text-xs text-slate-400">{message}</div> : null}
    </div>
  );
}
