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

// 配列の述語に一致する要素だけを updater で差し替えた「新しい配列」を返す（イミュータブル更新）。
// 一致しない要素は同じ参照のまま保持するため、変わった要素だけ参照が変わる。
export const replaceWhere = <T>(arr: T[], predicate: (item: T) => boolean, updater: (item: T) => T): T[] =>
  arr.map((item) => (predicate(item) ? updater(item) : item));
