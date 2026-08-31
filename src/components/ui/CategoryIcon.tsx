import {
  Building2,
  ClipboardList,
  Sparkles,
  UtensilsCrossed,
  Camera,
  Video,
  Brush,
  Hand,
  Disc3,
  Music,
  Flower2,
  Crown,
  User,
  Gem,
  Mail,
  Bus,
  Mic,
  Gift,
  BookOpen,
  Lightbulb,
  LayoutGrid,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Building2,
  ClipboardList,
  Sparkles,
  UtensilsCrossed,
  Camera,
  Video,
  Brush,
  Hand,
  Disc3,
  Music,
  Flower2,
  Crown,
  User,
  Gem,
  Mail,
  Bus,
  Mic,
  Gift,
  BookOpen,
  Lightbulb,
  LayoutGrid,
};

export function CategoryIcon({ name, size = 22 }: { name?: string | null; size?: number }) {
  const Icon = (name && iconMap[name]) || Sparkles;
  return <Icon size={size} />;
}

export { iconMap };
