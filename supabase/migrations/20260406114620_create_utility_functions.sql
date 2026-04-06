-- 共通ユーティリティ関数
-- 全テーブルの updated_at 自動更新トリガーで使用する

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
