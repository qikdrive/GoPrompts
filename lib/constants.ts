import type { Category } from "./types";

// Mirrors public.categories (seeded in the init migration). Kept in code for icons and fast rendering.
export const categories: Category[] = [
  { slug: "marketing", name: "Marketing", icon: "Megaphone" },
  { slug: "writing", name: "Writing", icon: "PenLine" },
  { slug: "coding", name: "Coding", icon: "Code" },
  { slug: "business", name: "Business", icon: "Briefcase" },
  { slug: "art", name: "Art & Design", icon: "Palette" },
  { slug: "photography", name: "Photography", icon: "Camera" },
  { slug: "education", name: "Education", icon: "GraduationCap" },
  { slug: "productivity", name: "Productivity", icon: "Zap" },
];

export const models = [
  "ChatGPT",
  "Claude",
  "Gemini",
  "Midjourney",
  "Stable Diffusion",
  "DALL·E",
  "Sora",
] as const;

export const imageModels = ["Midjourney", "Stable Diffusion", "DALL·E"] as const;

export const PLATFORM_FEE = 0.2;

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug);
}
