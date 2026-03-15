'use client';

import {
  Building2,
  Package,
  Star,
  TrendingUp,
  Users,
  BarChart3,
  FileText,
  Target,
  ShieldCheck,
  BadgeCheck,
  Settings,
  Home,
  Edit3,
  Link2,
  Database,
  Trophy,
  ImageIcon,
  Sparkles,
  Folder,
  Search,
  Bell,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar,
  Clock,
  Zap,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Plus,
  Minus,
  Check,
  AlertCircle,
  Info,
  Eye,
  EyeOff,
  Filter,
  Download,
  Upload,
  Share2,
  Copy,
  ExternalLink,
  Trash2,
  Pencil,
  Save,
  Loader2,
  RefreshCw
} from 'lucide-react';

// Centralized icon registry to prevent import issues
export const Icons = {
  // Main dashboard icons
  Building2,
  Package,
  Star,
  TrendingUp,
  Users,
  BarChart3,
  FileText,
  Target,
  ShieldCheck,
  BadgeCheck,
  Settings,
  Home,
  Edit3,
  Link2,
  Database,
  Trophy,
  ImageIcon,
  Sparkles,
  Folder,
  
  // UI icons
  Search,
  Bell,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  
  // Contact icons
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar,
  Clock,
  
  // Action icons
  Zap,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Plus,
  Minus,
  Check,
  
  // Status icons
  AlertCircle,
  Info,
  Eye,
  EyeOff,
  Filter,
  
  // File icons
  Download,
  Upload,
  Share2,
  Copy,
  ExternalLink,
  
  // Edit icons
  Trash2,
  Pencil,
  Save,
  
  // Loading icons
  Loader2,
  RefreshCw
} as const;

export type IconName = keyof typeof Icons;

interface IconProps {
  name: IconName;
  className?: string;
  size?: number;
}

export function Icon({ name, className = '', size }: IconProps) {
  const IconComponent = Icons[name];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in registry`);
    return null;
  }
  
  return <IconComponent className={className} size={size} />;
}

export default Icons;