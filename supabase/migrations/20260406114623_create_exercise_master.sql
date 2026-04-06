-- exercise_master テーブル（種目マスタ）

create table exercise_master (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  category   text        not null check (category in ('胸', '背中', '脚', '肩', '腕', '腹', '有酸素', 'その他')),
  is_system  boolean     not null default false,
  is_active  boolean     not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger exercise_master_updated_at
  before update on exercise_master
  for each row execute function update_updated_at();

-- RLS 有効化
alter table exercise_master enable row level security;

-- 認証済みユーザーはアクティブ種目を閲覧可能
create policy "authenticated users can view exercise master"
  on exercise_master for select
  to authenticated
  using (true);

-- 認証済みユーザーは種目を追加可能
create policy "authenticated users can insert exercise master"
  on exercise_master for insert
  to authenticated
  with check (true);

-- オーナーのみ種目を編集・無効化可能
create policy "owners can update exercise master"
  on exercise_master for update
  to authenticated
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'owner'
    )
  )
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'owner'
    )
  );
