// アプリ全体で使うデータ型（old-site の schema.js / state.js に対応）

export type CardStatus = "new" | "learning" | "mastered";

// id はデータ由来で文字列・数値が混在しうる（old-site と同一）
export type Id = string | number;

export interface CardStats {
  likes: number;
  nopes: number;
  status: CardStatus;
}

export interface BackDetail {
  tagId?: Id | "" | null;
  value: string;
  expanded?: boolean;
}

export interface Card {
  front: string;
  backDetails: BackDetail[];
  example?: string;
  stats?: CardStats;
}

export interface Project {
  id: Id;
  title: string;
  description?: string;
  categoryId: Id;
  cards: Card[];
}

export interface Category {
  id: Id;
  name: string;
  colorClass: string;
  expanded?: boolean;
  newTagName?: string;
}

export interface Tag {
  id: Id;
  name: string;
  categoryId: Id;
  colorClass: string;
}

export interface ProjectStats {
  mastered: number;
  learning: number;
  new: number;
  masteredRate: number;
  learningRate: number;
  newRate: number;
}

export interface StreakData {
  currentStreak: number;
  lastStudyDate: string | null;
  studyHistory: string[];
}

export interface WeekDay {
  date: string;
  dayName: string;
  isStudied: boolean;
  isToday: boolean;
}

export interface Toast {
  id: number;
  message: string;
  type: "info" | "success" | "error";
  show: boolean;
}

export type ViewName =
  | "streak"
  | "home"
  | "study"
  | "cardList"
  | "stats"
  | "categories"
  | "settings"
  | "ai";

export interface DialogState {
  show: boolean;
  type: "alert" | "confirm";
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: (() => void) | null;
}
