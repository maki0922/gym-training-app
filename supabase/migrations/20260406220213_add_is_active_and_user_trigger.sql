-- profiles テーブルに is_active カラムを追加（論理削除用）
alter table profiles add column is_active boolean not null default true;

-- auth.users に新規レコードが挿入されたとき profiles を自動作成するトリガー
-- 招待送信時（inviteUserByEmail）に auth.users にレコードが作成されるタイミングで発火
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, role, is_primary, is_active)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'trainer')::user_role,
    false,
    true
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
