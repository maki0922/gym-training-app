-- handle_new_user トリガー関数の修正
-- auth スキーマのコンテキストで実行されるため user_role を public.user_role に変更
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, role, is_primary, is_active)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'trainer')::public.user_role,
    false,
    true
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;
