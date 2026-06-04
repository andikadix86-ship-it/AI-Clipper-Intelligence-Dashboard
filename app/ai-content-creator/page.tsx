import { StudioSectionPage } from "@/components/studio-section-page";
import { studioSections } from "@/lib/studio-sections";
import { ContentCreatorEnginePanel } from "@/components/content-creator/content-creator-engine-panel";

export default function AIContentCreatorPage() {
  return <div className="space-y-6"><ContentCreatorEnginePanel /><StudioSectionPage section={studioSections.creator} /></div>;
}
