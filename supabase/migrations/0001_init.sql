-- P1-e1: 課金ユーザー向けクラウド同期の初期スキーマ。
-- 無料/ゲストは IndexedDB のままで、このスキーマは課金（premium）ユーザーのみ使用する。
-- サーバは service_role で接続（RLS をバイパス）し、API ルート側で auth() の userId を
-- 強制してユーザー分離する。本アプリの認証は Auth.js（NextAuth）であり Supabase Auth は
-- 使わないため、id は Auth.js の token.sub（Google OAuth では数値文字列）を入れる text とする。

-- 課金状態の真実源。Stripe Webhook が tier / stripe_customer_id を更新する。
create table if not exists public.users (
  id text primary key,                 -- Auth.js のユーザー識別子（token.sub / Google の数値文字列）
  email text,
  tier text not null default 'free' check (tier in ('free', 'premium')),
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 課金ユーザーのアプリデータ。categories/tags/projects のスナップショットを
-- user 単位で 1 行（JSONB）保持する（既存 PersistenceSnapshot をそのまま保存）。
create table if not exists public.decks (
  user_id text primary key references public.users(id) on delete cascade,
  snapshot jsonb not null,             -- { categories, tags, projects }
  updated_at timestamptz not null default now()
);

-- updated_at を UPDATE 時に自動更新する（INSERT 時の default now() だけでは
-- 更新時に古い値が残り、同期ロジックが変更を見落とすため）。
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_users_updated on public.users;
create trigger on_users_updated
  before update on public.users
  for each row execute function public.handle_updated_at();

drop trigger if exists on_decks_updated on public.decks;
create trigger on_decks_updated
  before update on public.decks
  for each row execute function public.handle_updated_at();

-- RLS 有効化。サーバは service_role 接続のため RLS をバイパスして read/write できる。
-- 本アプリは Supabase Auth を使わない（認証は Auth.js）ので auth.uid() は常に NULL になり、
-- ポリシーを一切作らないことで「service_role 以外は全拒否（deny-all）」を既定とする。
-- = 万一 anon/authenticated キーが漏れても直アクセスでデータを読めない、という二重防御。
alter table public.users enable row level security;
alter table public.decks enable row level security;
