import {
  RefreshCw, Settings, Plus, Pencil, Trash2, Copy,
  ExternalLink, Check, X, ChevronDown, ChevronRight,
  ChevronUp, ArrowUpRight, ArrowDownRight, AlertTriangle,
  Info, Eye, EyeOff, Search, Wallet, Layers, BarChart3,
  Coins, LogOut, User,
} from 'lucide-react';

const ICONS = {
  'refresh-cw': RefreshCw,
  'settings': Settings,
  'plus': Plus,
  'pencil': Pencil,
  'trash-2': Trash2,
  'copy': Copy,
  'external-link': ExternalLink,
  'check': Check,
  'x': X,
  'chevron-down': ChevronDown,
  'chevron-right': ChevronRight,
  'chevron-up': ChevronUp,
  'arrow-up-right': ArrowUpRight,
  'arrow-down-right': ArrowDownRight,
  'alert-triangle': AlertTriangle,
  'info': Info,
  'eye': Eye,
  'eye-off': EyeOff,
  'search': Search,
  'wallet': Wallet,
  'layers': Layers,
  'bar-chart-3': BarChart3,
  'coins': Coins,
  'log-out': LogOut,
  'user': User,
} as const;

type IconName = keyof typeof ICONS;

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function Icon({ name, size = 16, className, style }: IconProps) {
  const LucideIcon = ICONS[name];
  if (!LucideIcon) return null;
  return (
    <LucideIcon
      size={size}
      strokeWidth={1.75}
      className={className}
      style={{ color: 'currentColor', display: 'inline-block', ...style }}
    />
  );
}
