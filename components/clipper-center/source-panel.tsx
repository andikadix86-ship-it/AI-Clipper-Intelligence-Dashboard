import { FileVideo2, Link2, Loader2, Sparkles, UploadCloud } from "lucide-react";
import { DashboardPanel } from "@/components/dashboard/ui";

export function SourcePanel({ analyzed, onAnalyze }: { analyzed: boolean; onAnalyze: () => void }) {
  return (
    <DashboardPanel title="Upload / Source Panel" description="Tambahkan sumber video panjang dan atur target output sebelum AI menganalisis momen terbaik.">
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <label className="group flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-cyan-300/20 bg-cyan-300/[0.035] p-5 text-center transition hover:bg-cyan-300/[0.06]">
          <input type="file" accept="video/*" className="sr-only" />
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-300/10 text-cyan-200"><UploadCloud className="h-5 w-5" /></div>
          <div className="mt-4 text-sm font-semibold text-white">Upload Video</div>
          <p className="mt-2 max-w-sm text-xs leading-5 text-slate-500">Drop MP4, MOV, or MKV files here. Dummy upload area is ready for backend wiring.</p>
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="YouTube URL" placeholder="https://youtube.com/watch?v=..." icon={Link2} />
          <Field label="Podcast URL" placeholder="https://podcast.example.com/episode" icon={Link2} />
          <Field label="Webinar / Long Video URL" placeholder="Paste source video URL" icon={FileVideo2} />
          <SelectField label="Language" options={["Bahasa Indonesia", "English", "Auto Detect"]} />
          <SelectField label="Target Platform" options={["YouTube Shorts", "TikTok", "Instagram Reels", "Facebook Reels", "Multi-platform"]} />
          <SelectField label="Clip Duration" options={["Auto Detect", "15-30 seconds", "30-45 seconds", "45-60 seconds", "60-90 seconds"]} />
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" onClick={onAnalyze} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(59,130,246,0.2)] transition hover:brightness-110">
          {analyzed ? <Sparkles className="h-4 w-4" /> : <Loader2 className="h-4 w-4" />} {analyzed ? "Demo Analysis Ready" : "Analyze Video"}
        </button>
        <p className="text-xs text-slate-500">{analyzed ? "Dummy insight generated. Backend connection will be added in the next phase." : "UI preview mode. No video will be uploaded yet."}</p>
      </div>
    </DashboardPanel>
  );
}

function Field({ label, placeholder, icon: Icon }: { label: string; placeholder: string; icon: typeof Link2 }) {
  return <label><span className="mb-2 block text-xs font-semibold text-slate-400">{label}</span><span className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#0B1325] px-3 py-2.5"><Icon className="h-4 w-4 shrink-0 text-slate-600" /><input placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-700" /></span></label>;
}

function SelectField({ label, options }: { label: string; options: string[] }) {
  return <label><span className="mb-2 block text-xs font-semibold text-slate-400">{label}</span><select className="premium-input px-3 py-2.5 text-sm">{options.map((option) => <option key={option}>{option}</option>)}</select></label>;
}
