import type { Category, Project, Tag } from "@/types/flashcard";

export const TAG_COLORS = [
  "bg-red-500 text-white border-red-400",
  "bg-blue-500 text-white border-blue-400",
  "bg-green-500 text-white border-green-400",
  "bg-yellow-500 text-white border-yellow-400",
  "bg-purple-500 text-white border-purple-400",
  "bg-pink-500 text-white border-pink-400",
  "bg-cyan-500 text-white border-cyan-400",
  "bg-orange-500 text-white border-orange-400",
  "bg-teal-500 text-white border-teal-400",
];

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "cat_english", name: "英語", colorClass: "bg-blue-500 text-white border-blue-400", expanded: false, newTagName: "" },
  { id: "cat_japanese", name: "国語", colorClass: "bg-red-500 text-white border-red-400", expanded: false, newTagName: "" },
];

export const DEFAULT_TAGS: Tag[] = [
  { id: 1, name: "名詞", categoryId: "cat_english", colorClass: "bg-blue-500 text-white border-blue-400" },
  { id: 2, name: "動詞", categoryId: "cat_english", colorClass: "bg-red-500 text-white border-red-400" },
  { id: 3, name: "形容詞", categoryId: "cat_english", colorClass: "bg-green-500 text-white border-green-400" },
  { id: 4, name: "書き下し", categoryId: "cat_japanese", colorClass: "bg-purple-500 text-white border-purple-400" },
  { id: 5, name: "現代語訳", categoryId: "cat_japanese", colorClass: "bg-pink-500 text-white border-pink-400" },
];

export const DEFAULT_PROJECTS: Project[] = [
  {
    id: 1,
    title: "多義語・英単語",
    description: "品詞で意味が変わる単語",
    categoryId: "cat_english",
    cards: [
      {
        front: "light",
        backDetails: [
          { tagId: 1, value: "光・ライト" },
          { tagId: 3, value: "軽い・明るい" },
          { tagId: 2, value: "火をつける・照らす" },
        ],
        example: "Could you turn on the light?",
        stats: { likes: 0, nopes: 0, status: "new" },
      },
    ],
  },
];
