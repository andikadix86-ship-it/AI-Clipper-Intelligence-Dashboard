import { StudioSectionPage } from "@/components/studio-section-page";
import { studioSections } from "@/lib/studio-sections";

export default function ContentLibraryPage() {
  return <StudioSectionPage section={studioSections.library} />;
}
