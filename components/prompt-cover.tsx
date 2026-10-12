import { Bot, Image as ImageIcon, Video } from "lucide-react";
import type { AIModel } from "@/lib/types";
import { imageModels } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function modelKind(model: AIModel) {
  if (model === "Sora") return "video";
  return (imageModels as readonly string[]).includes(model) ? "image" : "text";
}

/** Generated gradient cover until real example images are uploaded. */
export function PromptCover({
  hue,
  model,
  title,
  className,
}: {
  hue: number;
  model: AIModel;
  title: string;
  className?: string;
}) {
  const kind = modelKind(model);
  const Icon = kind === "image" ? ImageIcon : kind === "video" ? Video : Bot;
  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{
        background: `radial-gradient(circle at 20% 20%, hsl(${hue} 85% 62% / 0.9), transparent 55%),
          radial-gradient(circle at 85% 80%, hsl(${(hue + 60) % 360} 85% 55% / 0.8), transparent 50%),
          linear-gradient(135deg, hsl(${hue} 45% 18%), hsl(${(hue + 30) % 360} 50% 10%))`,
      }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(transparent_95%,rgba(255,255,255,0.06)_95%)] bg-[length:100%_18px]" />
      <Icon className="absolute right-4 bottom-4 text-white/25" size={56} strokeWidth={1.25} />
      <p className="absolute top-4 left-4 right-16 line-clamp-2 text-lg font-semibold leading-snug text-white/90 drop-shadow">
        {title}
      </p>
    </div>
  );
}
