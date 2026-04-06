-- profiles テーブル
-- auth.users と紐付いたユーザープロフィール（トレーナー・オーナー）

create type user_role as enum ('owner', 'trainer');

create table profiles (
  id           uuid        primary key references auth.users(id) on delete cascade,
  email        text        not null,
  display_name text        not null,
  role         user_role   not null default 'trainer',
  is_primary   boolean     not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

-- RLS 有効化
alter table profiles enable row level security;

-- 認証済みユーザーは全プロフィールを閲覧可能
create policy "authenticated users can view all profiles"
  on profiles for select
  to authenticated
  using (true);

-- 自分自身のプロフィールは更新可能
create policy "users can update own profile"
  on profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- オーナーのみプロフィールを挿入可能
create policy "owners can insert profiles"
  on profiles for insert
  to authenticated
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'owner'
    )
  );

-- オーナーのみ削除可能（is_primary = true は削除不可）
create policy "owners can delete non-primary profiles"
  on profiles for delete
  to authenticated
  using (
    is_primary = false
    and exists (
      select 1 from profiles
      where id = auth.uid() and role = 'owner'
    )
  );
