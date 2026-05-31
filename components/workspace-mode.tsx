"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type WorkspaceMode = "creator" | "affiliate";

const WorkspaceModeContext = createContext<{
  mode: WorkspaceMode;
  setMode: (mode: WorkspaceMode) => void;
}>({ mode: "creator", setMode: () => undefined });

export function WorkspaceModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<WorkspaceMode>("creator");

  useEffect(() => {
    const saved = window.localStorage.getItem("ai-clipper-workspace-mode");
    if (saved === "affiliate" || saved === "creator") setMode(saved);
  }, []);

  function updateMode(nextMode: WorkspaceMode) {
    setMode(nextMode);
    window.localStorage.setItem("ai-clipper-workspace-mode", nextMode);
  }

  return <WorkspaceModeContext.Provider value={{ mode, setMode: updateMode }}>{children}</WorkspaceModeContext.Provider>;
}

export function useWorkspaceMode() {
  return useContext(WorkspaceModeContext);
}

export function ModeSwitch() {
  const { mode, setMode } = useWorkspaceMode();
  return (
    <div className="inline-flex rounded-lg border border-white/10 bg-[#0E1728] p-1">
      <button type="button" onClick={() => setMode("creator")} className={`rounded-md px-3 py-2 text-xs font-semibold transition ${mode === "creator" ? "bg-primary text-white" : "text-slate-400 hover:text-white"}`}>
        Creator / Clipper
      </button>
      <button type="button" onClick={() => setMode("affiliate")} className={`rounded-md px-3 py-2 text-xs font-semibold transition ${mode === "affiliate" ? "bg-primary text-white" : "text-slate-400 hover:text-white"}`}>
        Affiliate
      </button>
    </div>
  );
}
