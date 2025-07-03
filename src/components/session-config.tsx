"use client";

import { VoiceSelector } from "@/components/voice-selector";
import { ConfigurationFormFieldProps } from "./configuration-form";
export function SessionConfig({ form }: ConfigurationFormFieldProps) {
  return (
    <div className="space-y-4 pt-2">
      {/* <ModelSelector form={form} /> */}
      <VoiceSelector form={form} />
      {/* <ModalitiesSelector form={form} /> */}
      {/* <TemperatureSelector form={form} /> */}
      {/* <MaxOutputTokensSelector form={form} /> */}
    </div>
  );
}
