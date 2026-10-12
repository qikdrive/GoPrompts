import {
  Briefcase,
  Camera,
  Code,
  GraduationCap,
  Megaphone,
  Palette,
  PenLine,
  Sparkles,
  Zap,
  type LucideProps,
} from "lucide-react";

const icons = { Briefcase, Camera, Code, GraduationCap, Megaphone, Palette, PenLine, Zap };

export function CategoryIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = icons[name as keyof typeof icons] ?? Sparkles;
  return <Icon {...props} />;
}
