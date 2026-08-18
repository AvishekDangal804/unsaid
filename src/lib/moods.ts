import type { Mood } from "@/types/database.types";

export const MOOD_META: Record<Mood, { emoji: string; label: string }> = {
  love: { emoji: "❤️", label: "In Love" },
  heartbroken: { emoji: "💔", label: "Heartbroken" },
  sad: { emoji: "😔", label: "Sad" },
  funny: { emoji: "😂", label: "Funny" },
  angry: { emoji: "😡", label: "Angry" },
  support: { emoji: "🫂", label: "Need Support" },
  calm: { emoji: "😌", label: "Calm" },
  motivated: { emoji: "🔥", label: "Motivated" },
  confused: { emoji: "😶", label: "Confused" },
  happy: { emoji: "🎉", label: "Happy" },
};

export const MOOD_ORDER: Mood[] = [
  "love",
  "heartbroken",
  "sad",
  "funny",
  "angry",
  "support",
  "calm",
  "motivated",
  "confused",
  "happy",
];
