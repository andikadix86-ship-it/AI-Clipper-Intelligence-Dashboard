import { StudioSectionPage } from "@/components/studio-section-page";
import { studioSections } from "@/lib/studio-sections";

export default function StudioSettingsPage() {
  return <StudioSectionPage section={studioSections.settings} />;
}
