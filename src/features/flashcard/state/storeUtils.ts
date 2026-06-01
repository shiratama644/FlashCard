import type { CardRefs } from "../animations/card";
import type { Id } from "../data/types";

export type AnyDetail = { tagId: Id | "" | null | undefined; value: string; expanded?: boolean };

export interface StoreRefs extends CardRefs {
  frontInput: HTMLInputElement | null;
}

export const createEmptyRefs = (): StoreRefs => ({
  cardElement: null,
  likeStamp: null,
  nopeStamp: null,
  overlayBg: null,
  likeIcon: null,
  nopeIcon: null,
  frontInput: null,
});

// ディープコピー（old-site の JSON.parse(JSON.stringify(...)) と同等）
export const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
