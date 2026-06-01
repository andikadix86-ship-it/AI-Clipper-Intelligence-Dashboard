"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type BrandingSettings = {
  appName: string;
  companyName: string;
  shortName: string;
  productName: string;
  brandColor: string;
  tagline: string;
  footerText: string;
  logoDataUrl: string;
  faviconDataUrl: string;
};

const defaultBranding: BrandingSettings = {
  appName: "FVN AI Studio",
  companyName: "Fatih Vistara Niaga",
  shortName: "FVN",
  productName: "FVN AI Studio",
  brandColor: "#38BDF8",
  tagline: "Create smarter content with AI intelligence.",
  footerText: "Fatih Vistara Niaga · FVN AI Studio",
  logoDataUrl: "",
  faviconDataUrl: ""
};

const BrandingContext = createContext<{
  branding: BrandingSettings;
  updateBranding: (patch: Partial<BrandingSettings>) => void;
}>({ branding: defaultBranding, updateBranding: () => undefined });

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState(defaultBranding);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("fvn-ai-studio-branding");
      if (stored) setBranding({ ...defaultBranding, ...JSON.parse(stored) });
    } catch {
      setBranding(defaultBranding);
    }
  }, []);

  function updateBranding(patch: Partial<BrandingSettings>) {
    setBranding((current) => {
      const next = { ...current, ...patch };
      try {
        window.localStorage.setItem("fvn-ai-studio-branding", JSON.stringify(next));
      } catch {
        // Large image previews may exceed browser storage. State preview remains available.
      }
      return next;
    });
  }

  return <BrandingContext.Provider value={{ branding, updateBranding }}>{children}</BrandingContext.Provider>;
}

export function useBranding() {
  return useContext(BrandingContext);
}

export function BrandLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const { branding } = useBranding();
  const dimensions = size === "sm" ? "h-8 w-8 rounded-lg text-[10px]" : size === "lg" ? "h-20 w-20 rounded-2xl text-lg" : "h-11 w-11 rounded-xl text-sm";

  return (
    <div
      aria-label={`${branding.productName} logo`}
      className={`grid shrink-0 place-items-center overflow-hidden border border-cyan-300/30 bg-gradient-to-br from-blue-500/30 via-violet-500/20 to-cyan-300/20 bg-cover bg-center font-bold text-cyan-100 shadow-[0_0_24px_rgba(56,189,248,0.16)] ${dimensions}`}
      style={branding.logoDataUrl ? { backgroundImage: `url("${branding.logoDataUrl}")` } : undefined}
    >
      {branding.logoDataUrl ? <span className="sr-only">{branding.shortName}</span> : branding.shortName || "FVN"}
    </div>
  );
}
