-- training_records テーブル（セッション内の各種目）

create table training_records (
  id                   uuid        primary key default gen_random_uuid(),
  session_id           uuid        not null references training_sessions(id) on delete cascade,
  exercise_id          uuid        references exercise_master(id),
  exercise_name_manual text,
  sort_order           integer     not null default 0,
  notes                text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  -- exercise_id か exercise_name_manual のどちらかは必須
  constraint exercise_required check (
    exercise_id is not null or exercise_name_manual is not null
  )
);

create index training_records_session_id_idx on training_records(session_id);
create index training_records_exercise_id_idx on training_records(exercise_id);

create trigger training_records_updated_at
  before update on training_records
  for each row execute function update_updated_at();

-- RLS 有効化
alter table training_records enable row level security;

-- 認証済みユーザーは閲覧可能
create policy "authenticated users can view training records"
  on training_records for select
  to authenticated
  using (true);

-- 認証済みユーザーは追加可能
create policy "authenticated users can insert training records"
  on training_records for insert
  to authenticated
  with check (true);

-- 認証済みユーザーは更新可能
create policy "authenticated users can update training records"
  on training_records for update
  to authenticated
  using (true)
  with check (true);

-- 認証済みユーザーは削除可能
create policy "authenticated users can delete training records"
  on training_records for delete
  to authenticated
  using (true);
