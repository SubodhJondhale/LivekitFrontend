export enum VoiceId {
  AOEDE = "Aoede",
  KORE = "Kore",
  PUCK = "Puck",
  CHARON = "Charon",
  FENRIR = "Fenrir",
}

export interface Voice {
  id: VoiceId;
  name: string;
}

export const voices: Voice[] = Object.values(VoiceId).map((id) => ({
  id,
  name: id,
}));
