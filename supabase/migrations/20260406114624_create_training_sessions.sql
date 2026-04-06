-- training_sessions テーブル（トレーニングセッション）

create type session_status as enum ('in_progress', 'completed');

create table training_sessions (
  id           uuid           primary key default gen_random_uuid(),
  customer_id  uuid           not null references customers(id),
  trainer_id   uuid           not null references profiles(id),
  session_date date           not null,
  status       session_status not null default 'in_progress',
  notes        text,
  is_deleted   boolean        not null default false,
  created_at   timestamptz    not null default now(),
  updated_at   timestamptz    not null default now()
);

create index training_sessions_customer_id_idx on training_sessions(customer_id);
create index training_sessions_trainer_id_idx on training_sessions(trainer_id);
create index training_sessions_session_date_idx on training_sessions(session_date);

create trigger training_sessions_updated_at
  before update on training_sessions
  for each row execute function update_updated_at();

-- RLS 有効化
alter table training_sessions enable row level security;

-- 認証済みユーザーは論理削除されていないセッションを閲覧可能
create policy "authenticated users can view training sessions"
  on training_sessions for select
  to authenticated
  using (is_deleted = false);

-- 認証済みユーザーはセッションを作成可能
create policy "authenticated users can insert training sessions"
  on training_sessions for insert
  to authenticated
  with check (auth.uid() = trainer_id);

-- 認証済みユーザーはセッションを更新可能
create policy "authenticated users can update training sessions"
  on training_sessions for update
  to authenticated
  using (is_deleted = false)
  with check (
    -- is_deleted を true にする（論理削除）はオーナーのみ
    (is_deleted = false)
    or exists (
      select 1 from profiles
      where id = auth.uid() and role = 'owner'
    )
  );
