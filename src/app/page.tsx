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
      <main className="flex flex-col flex-grow overflow-hidden p-0 pb-6 pt-4 lg:pb-0 w-full md:mx-auto">
        <RoomComponent />
      </main>
    </div>
  );
}
