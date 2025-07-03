import { Metadata } from "next";
import { RoomComponent } from "@/components/room-component";
import LK from "@/components/lk";
import Gemini from "@/components/gemini";
import { defaultPresets } from "@/data/presets";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}): Promise<Metadata> {
  let title = "LiveKit | Gemini Multimodal Playground";
  let description =
    "Speech-to-speech playground for Google's new Gemini Multimodal Live API. Built on LiveKit Agents.";

  const presetId = searchParams?.preset;
  if (presetId) {
    const selectedPreset = defaultPresets.find(
      (preset) => preset.id === presetId
    );
    if (selectedPreset) {
      title = `GOQii AI`;
      description = `Speak to a "${selectedPreset.name}" in a speech-to-speech playground for Gemini's new Multimodal Live API. Built on LiveKitAgents.`;
    }
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: "https://gemini-playground-xi.vercel.app/",
      images: [
        {
          url: "https://gemini-playground-xi.vercel.app/og-image.png",
          width: 1200,
          height: 676,
          type: "image/png",
          alt: title,
        },
      ],
    },
  };
}

export default function Dashboard() {
  return (
    <div className="flex flex-col h-dvh bg-neutral-900">
      <header className="flex flex-col md:flex-row flex-shrink-0 gap-3 md:h-12 items-center justify-between pt-10 px-5 py-0 w-full md:mx-auto">
        <div className="flex items-center gap-3">
          <LK />
          {/* <span className="h-8 border-r border-white/10"></span> */}
          <div className="flex gap-2 items-center">
            <Gemini />
            <span className="text-[18px] pt-[3px] font-light">
            
            </span>
          </div>
        </div>
        {/* <div className="inline-flex flex-row items-center space-x-2">
          <PresetSelector />
          <PresetSave />
          <PresetShare />
          <CodeViewer />
        </div> */}
      </header>
      <main className="flex flex-col flex-grow overflow-hidden p-0 pb-4 lg:pb-0 w-full md:mx-auto">
        <RoomComponent />
      </main>
    </div>
  );
}
