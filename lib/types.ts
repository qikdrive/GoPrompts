export type AIModel =
  | "ChatGPT"
  | "Claude"
  | "Gemini"
  | "Midjourney"
  | "Stable Diffusion"
  | "DALL·E"
  | "Sora";

export type PromptStatus = "draft" | "pending" | "live" | "rejected";

export interface CreatorSummary {
  id: string;
  handle: string;
  name: string;
  avatarHue: number;
  verified: boolean;
}

export interface Creator extends CreatorSummary {
  bio: string;
  joined: string;
  sales: number;
  rating: number;
}

export interface Profile extends CreatorSummary {
  bio: string;
  role: "user" | "admin";
}

export interface PromptExample {
  input: Record<string, string>;
  output: string;
}

export interface Review {
  id: string;
  author: { handle: string; name: string; avatarHue: number };
  userId: string;
  rating: number;
  comment: string;
  date: string;
}

/** Public listing data (no template). */
export interface Prompt {
  id: string;
  slug: string;
  title: string;
  description: string;
  creator: CreatorSummary;
  category: string;
  model: AIModel;
  tags: string[];
  priceCents: number;
  rating: number;
  reviewCount: number;
  sales: number;
  views: number;
  variables: string[];
  coverHue: number;
  createdAt: string;
  status: PromptStatus;
  featured: boolean;
  rejectionReason: string | null;
}

export interface Category {
  slug: string;
  name: string;
  icon: string; // lucide icon name
}

export interface CurrentUser {
  id: string;
  email: string;
  profile: Profile;
}

/** Shape returned by server actions used with useActionState. */
export type ActionState = { error?: string; message?: string } | undefined;
