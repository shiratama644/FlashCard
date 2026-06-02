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

// ディープコピー。対象は categories/tags/projects などの純粋な JSON 互換 plain data に限る
// （DOM 参照・関数・クラスインスタンスを含むものに使うと structuredClone は例外を投げる）。
export const clone = <T>(v: T): T => structuredClone(v);
