// 課金（premium）ユーザー用のクラウド永続化アダプタ。
// ブラウザから Supabase を直叩きせず、同一オリジンの API ルート（/api/sync）経由でアクセスする。
// - service_role キーをサーバに隔離できる（クライアントバンドルに出さない）
// - ユーザー分離はサーバの auth() で強制（adapter は userId を持たない）
// - connect-src 'self' のまま（CSP 緩和不要）
// 認証セッション Cookie（Auth.js）は同一オリジン fetch で自動送出される。
import type { PersistenceAdapter, PersistenceSnapshot } from "./types";

const SYNC_ENDPOINT = "/api/sync";

export class SupabaseAdapter implements PersistenceAdapter {
  async loadAll(): Promise<PersistenceSnapshot | null> {
    const res = await fetch(SYNC_ENDPOINT, {
      method: "GET",
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      throw new Error(`クラウド同期の読み込みに失敗しました（HTTP ${res.status}）`);
    }
    const body = (await res.json()) as { snapshot: PersistenceSnapshot | null };
    // 未保存（初回）は null。呼び出し側（loadAndMigrateData）が初期データ投入を判断する。
    return body.snapshot ?? null;
  }

  async saveAll(data: PersistenceSnapshot): Promise<void> {
    // data は呼び出し側で隔離済みの plain スナップショット（PersistenceAdapter の契約）。
    const res = await fetch(SYNC_ENDPOINT, {
      method: "PUT",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ snapshot: data }),
    });
    if (!res.ok) {
      throw new Error(`クラウド同期の保存に失敗しました（HTTP ${res.status}）`);
    }
  }
}
