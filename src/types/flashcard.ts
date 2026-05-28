export type CardStatus = "new" | "learning" | "mastered";

export type CardStats = {
  likes: number;
  nopes: number;
  status: CardStatus;
};

export type CardDetail = {
  tagId?: string | number | "" | null;
  value: string;
  expanded?: boolean;
};

export type Card = {
  front: string;
  backDetails: CardDetail[];
  example?: string;
  stats?: CardStats;
};

export type Category = {
  id: string | number;
  name: string;
  colorClass: string;
  expanded?: boolean;
  newTagName?: string;
};

export type Tag = {
  id: string | number;
  name: string;
  categoryId: string | number;
  colorClass: string;
};

export type Project = {
  id: string | number;
  title: string;
  description?: string;
  categoryId: string | number;
  cards: Card[];
};
