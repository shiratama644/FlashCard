-- P1-e1: 課金ユーザー向けクラウド同期の初期スキーマ。
-- 無料/ゲストは IndexedDB のままで、このスキーマは課金（premium）ユーザーのみ使用する。
-- サーバは service_role で接続（RLS をバイパス）し、API ルート側で auth() の userId を
-- 強制してユーザー分離する。RLS は将来クライアント直アクセスを許す場合の二重防御として併設する。

-- 課金状態の真実源。Stripe Webhook が tier / stripe_customer_id を更新する。
create table if not exists public.users (
  id uuid primary key,                 -- Auth.js のユーザー識別子（token.sub）
  email text,
  tier text not null default 'free' check (tier in ('free', 'premium')),
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 課金ユーザーのアプリデータ。categories/tags/projects のスナップショットを
-- user 単位で 1 行（JSONB）保持する（既存 PersistenceSnapshot をそのまま保存）。
create table if not exists public.decks (
  user_id uuid primary key references public.users(id) on delete cascade,
  snapshot jsonb not null,             -- { categories, tags, projects }
  updated_at timestamptz not null default now()
);

-- RLS 有効化。サーバは service_role 接続のため RLS をバイパスする。
-- ここでのポリシーは「各ユーザーは自分の行のみ」を表明する二重防御。
alter table public.users enable row level security;
alter table public.decks enable row level security;

-- auth.uid() ベースのポリシー（クライアント直アクセス時の防御）。
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'users' and policyname = 'users_self') then
    create policy users_self on public.users
      for all using (auth.uid() = id) with check (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'decks' and policyname = 'decks_self') then
    create policy decks_self on public.decks
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;
