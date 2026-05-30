/**
 * Shared dynamic-icon infrastructure.
 *
 * Import DynamicIcon wherever a habit/achievement icon string needs to be
 * rendered, and HABIT_ICON_NAMES wherever the user picks one. Every name the
 * UI can produce is bundled here as a *named* import — there is no wildcard
 * `import * as LucideIcons` and no lazy `import('lucide-react')` anywhere, so
 * only these ~60 icons are ever loaded into memory (the full Lucide module is
 * thousands of components).
 */

import React from 'react';
import {
  // ── Habit icons (HABIT_ICONS palette) ──────────────────────────
  CircleCheck, Zap, Flame, Target, Activity, Award, Trophy,
  Heart, Smile, Sun, Moon, Coffee, Utensils, GlassWater, Apple,
  Dumbbell, Footprints, Bike, Timer, Clock, Brain,
  BookOpen, PenTool, Music, Code, Medal, Star, Shield,
  Droplets, Leaf, Palette, Wallet, GraduationCap, Headphones,
  // ── Extra picker icons (selectable via IconPicker) ──────────────
  Book, Camera, Terminal, Lock, Smartphone, Mail, Cloud, TreePine,
  Mountain, Flower2, Coins, Briefcase, Mic, Video, Gamepad2,
  ShoppingCart, Plane, Map as MapIcon, Navigation, Compass,
  // ── Achievement icons ───────────────────────────────────────────
  Crown, Gem, Calendar, CalendarCheck, Sunrise, Layers, RefreshCw,
  // ── Onboarding-only icons ───────────────────────────────────────
  Pill, Wind, Globe, Ban, Inbox,
  // ── Dashboard UI icons (used via string in FitnessSummary) ──────
  Pencil, Bell, HelpCircle, ChevronRight, X, LogOut,
  // ── Fallback ────────────────────────────────────────────────────
  Circle,
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';

export type IconComponent = React.ComponentType<LucideProps>;

export const ICON_MAP: Record<string, IconComponent> = {
  // habit icons
  'circle-check': CircleCheck, 'zap': Zap, 'flame': Flame, 'target': Target,
  'activity': Activity, 'award': Award, 'trophy': Trophy, 'heart': Heart,
  'smile': Smile, 'sun': Sun, 'moon': Moon, 'coffee': Coffee,
  'utensils': Utensils, 'glass-water': GlassWater, 'apple': Apple,
  'dumbbell': Dumbbell, 'footprints': Footprints, 'bicycle': Bike,
  'timer': Timer, 'clock': Clock, 'brain': Brain, 'book-open': BookOpen,
  'pen-tool': PenTool, 'music': Music, 'code': Code, 'medal': Medal,
  'star': Star, 'shield': Shield, 'droplets': Droplets, 'leaf': Leaf,
  'palette': Palette, 'wallet': Wallet, 'graduation-cap': GraduationCap,
  'headphones': Headphones,
  // extra picker icons
  'book': Book, 'camera': Camera, 'terminal': Terminal, 'lock': Lock,
  'smartphone': Smartphone, 'mail': Mail, 'cloud': Cloud, 'tree-pine': TreePine,
  'mountain': Mountain, 'flower-2': Flower2, 'coins': Coins, 'briefcase': Briefcase,
  'mic': Mic, 'video': Video, 'gamepad-2': Gamepad2, 'shopping-cart': ShoppingCart,
  'plane': Plane, 'map': MapIcon, 'navigation': Navigation, 'compass': Compass,
  // backward-compat alias: older habits stored 'check-circle-2' from the picker
  'check-circle-2': CircleCheck,
  // achievement icons
  'crown': Crown, 'gem': Gem, 'calendar': Calendar, 'calendar-check': CalendarCheck,
  'sunrise': Sunrise, 'layers': Layers, 'refresh-cw': RefreshCw,
  // onboarding icons
  'pill': Pill, 'wind': Wind, 'globe': Globe, 'ban': Ban, 'inbox': Inbox,
  // dashboard UI
  'pencil': Pencil, 'bell': Bell, 'help-circle': HelpCircle,
  'chevron-right': ChevronRight, 'x': X, 'log-out': LogOut,
};

/**
 * Curated, selectable habit icons (kebab-case). Every entry is guaranteed to
 * be present in ICON_MAP, so anything the user picks renders correctly
 * everywhere. This is the single source of truth for IconPicker.
 */
export const HABIT_ICON_NAMES: string[] = [
  'circle-check', 'zap', 'flame', 'target', 'activity', 'award', 'trophy',
  'heart', 'smile', 'sun', 'moon', 'coffee', 'utensils', 'glass-water', 'apple',
  'dumbbell', 'footprints', 'bicycle', 'timer', 'clock', 'calendar', 'brain',
  'book', 'book-open', 'pen-tool', 'music', 'camera', 'code', 'terminal',
  'medal', 'star', 'shield', 'lock', 'bell', 'smartphone', 'mail', 'cloud',
  'wind', 'droplets', 'tree-pine', 'mountain', 'leaf', 'flower-2', 'palette',
  'wallet', 'coins', 'briefcase', 'graduation-cap', 'mic', 'headphones', 'video',
  'gamepad-2', 'shopping-cart', 'plane', 'map', 'navigation', 'compass',
];

export function DynamicIcon({
  name,
  size = 20,
  color,
  strokeWidth = 2,
}: {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const Comp = ICON_MAP[name ?? 'circle-check'] ?? Circle;
  return <Comp size={size} color={color} strokeWidth={strokeWidth} />;
}
