-- customers テーブル（顧客）

create type gender_type as enum ('male', 'female', 'other');

create table customers (
  id            uuid        primary key default gen_random_uuid(),
  name          text        not null,
  name_kana     text        not null,
  gender        gender_type,
  date_of_birth date,
  notes         text,
  is_active     boolean     not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger customers_updated_at
  before update on customers
  for each row execute function update_updated_at();

-- RLS 有効化
alter table customers enable row level security;

-- 認証済みユーザーはアクティブ顧客を閲覧可能
create policy "authenticated users can view customers"
  on customers for select
  to authenticated
  using (true);

-- 認証済みユーザーは顧客を追加可能
create policy "authenticated users can insert customers"
  on customers for insert
  to authenticated
  with check (true);

-- 認証済みユーザーは顧客を編集可能（ただしオーナーのみ is_active を変更可）
create policy "authenticated users can update customers"
  on customers for update
  to authenticated
  using (true)
  with check (
    -- is_active を false にする操作はオーナーのみ
    (is_active = true)
    or exists (
      select 1 from profiles
      where id = auth.uid() and role = 'owner'
    )
  );
