-- training_sets テーブル（セット記録）

create table training_sets (
  id         uuid        primary key default gen_random_uuid(),
  record_id  uuid        not null references training_records(id) on delete cascade,
  set_number integer     not null,
  weight     decimal(6,2),
  reps       integer,
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index training_sets_record_id_idx on training_sets(record_id);

create trigger training_sets_updated_at
  before update on training_sets
  for each row execute function update_updated_at();

-- RLS 有効化
alter table training_sets enable row level security;

-- 認証済みユーザーは閲覧可能
create policy "authenticated users can view training sets"
  on training_sets for select
  to authenticated
  using (true);

-- 認証済みユーザーは追加可能
create policy "authenticated users can insert training sets"
  on training_sets for insert
  to authenticated
  with check (true);

-- 認証済みユーザーは更新可能
create policy "authenticated users can update training sets"
  on training_sets for update
  to authenticated
  using (true)
  with check (true);

-- 認証済みユーザーは削除可能
create policy "authenticated users can delete training sets"
  on training_sets for delete
  to authenticated
  using (true);
