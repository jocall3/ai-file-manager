
import React from 'react';
import {
  File,
  Folder,
  ChevronRight,
  Clock,
  HardDrive,
  Star,
  Trash2,
  List,
  Grid,
  Search,
  MoreVertical,
  ArrowDownUp,
  X,
  Sparkles,
  Loader2,
  AlertTriangle,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FolderPlus,
  Edit3,
  Share2,
  Info,
  Check,
  FolderOpen,
  Terminal,
  Save,
  BrainCircuit,
  MessageSquareQuote,
} from 'lucide-react';

export const iconMap = {
  file: File,
  folder: Folder,
  folderOpen: FolderOpen,
  chevronRight: ChevronRight,
  clock: Clock,
  hardDrive: HardDrive,
  star: Star,
  trash: Trash2,
  list: List,
  grid: Grid,
  search: Search,
  more: MoreVertical,
  sort: ArrowDownUp,
  close: X,
  sparkles: Sparkles,
  loader: Loader2,
  warning: AlertTriangle,
  fileText: FileText,
  fileImage: FileImage,
  fileVideo: FileVideo,
  fileAudio: FileAudio,
  folderPlus: FolderPlus,
  rename: Edit3,
  share: Share2,
  info: Info,
  check: Check,
  terminal: Terminal,
  save: Save,
  brain: BrainCircuit,
  summary: MessageSquareQuote,
};

type IconName = keyof typeof iconMap;

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number | string;
  className?: string;
}

const Icon: React.FC<IconProps> = ({ name, size = 20, className = '', ...props }) => {
  const LucideIcon = iconMap[name];
  if (!LucideIcon) {
    return null;
  }
  return <LucideIcon size={size} className={className} {...props} />;
};

export default Icon;