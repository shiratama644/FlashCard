import { z } from 'zod';

export const TagSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
  categoryId: z.union([z.string(), z.number()]),
  colorClass: z.string()
});

export const CategorySchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
  colorClass: z.string(),
  expanded: z.boolean().optional(),
  newTagName: z.string().optional()
});

export const CardDetailSchema = z.object({
  tagId: z.union([z.string(), z.number(), z.literal('')]).optional().nullable(),
  value: z.string(),
  expanded: z.boolean().optional()
});

export const CardStatsSchema = z.object({
  likes: z.number().default(0),
  nopes: z.number().default(0),
  status: z.enum(['new', 'learning', 'mastered']).default('new')
});

export const CardSchema = z.object({
  front: z.string(),
  backDetails: z.array(CardDetailSchema),
  example: z.string().optional(),
  stats: CardStatsSchema.optional()
});

export const ProjectSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string(),
  description: z.string().optional(),
  categoryId: z.union([z.string(), z.number()]),
  cards: z.array(CardSchema)
});