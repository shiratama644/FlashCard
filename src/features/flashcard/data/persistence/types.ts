// 永続層の共通インターフェース（差し替え可能な seam）。
// 無料/ゲストは IndexedDB（DexieAdapter）、課金ユーザーはクラウド（SupabaseAdapter・後続PR）を
// 同じインターフェースで扱えるようにする。ストアはこのインターフェースだけに依存し、
// 具体的な保存先（Dexie か Supabase か）を意識しない。
import type { Category, Project, Tag } from "../types";

// 永続化対象のスナップショット（ストアの categories/tags/projects に対応する plain data）。
export interface PersistenceSnapshot {
  categories: Category[];
  tags: Tag[];
  projects: Project[];
}

export interface PersistenceAdapter {
  // 保存済みデータを読み込む。1件も保存されていなければ null を返す
  //（初期データ投入が必要かどうかの判定は呼び出し側で行う）。
  loadAll(): Promise<PersistenceSnapshot | null>;
  // スナップショットを永続化する（全件 upsert + 保存先にしか無い不要分を削除）。
  saveAll(data: PersistenceSnapshot): Promise<void>;
}
