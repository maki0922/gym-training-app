-- training_sessions の UPDATE ポリシーを修正
-- 問題: is_deleted = true への更新時に with check が失敗していた
-- 修正: オーナーは is_deleted の変更を含む全更新が可能

drop policy "authenticated users can update training sessions" on training_sessions;

create policy "authenticated users can update training sessions"
  on training_sessions for update
  to authenticated
  using (is_deleted = false)
  with check (
    -- オーナーは論理削除を含む全更新が可能
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'owner'
    )
    -- トレーナーは is_deleted を変更できない（通常の更新のみ）
    or is_deleted = false
  );
