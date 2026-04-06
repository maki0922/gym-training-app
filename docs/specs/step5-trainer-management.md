# ステップ5 機能仕様書: トレーナー管理

## 概要

オーナーがトレーナー・オーナーアカウントを管理する画面。招待・編集・削除・再有効化が可能。
トレーナーはこの画面にアクセスできない（オーナー権限のみ）。

---

## 画面一覧

| 画面 | URL | 対象ロール |
|------|-----|-----------|
| トレーナー管理（一覧） | `/admin/trainers` | オーナーのみ |

---

## 5-1. トレーナー・オーナー一覧画面

### 表示対象

`is_active = true` のユーザーのみ表示。退職済み（`is_active = false`）のユーザーは一覧に表示しない。

### 表示項目

| 項目 | 内容 |
|------|------|
| 表示名 | `display_name` |
| メールアドレス | `email` |
| ロール | `owner` →「オーナー」/ `trainer` →「トレーナー」 |
| プライマリオーナーバッジ | `is_primary: true` のユーザーに「プライマリ」バッジを表示 |
| 編集ボタン | 全ユーザーに表示 |
| 削除ボタン | `is_primary: true` のユーザーには非表示。自分自身には非表示 |
| 招待日時 | `created_at`（年月日のみ表示） |

### レイアウト

- PCではテーブル形式で一覧表示
- モバイルではカード形式で縦並び表示
- 一覧上部に「メンバーを招待」ボタン（右寄せ）

### ソート順

登録日時の昇順（プライマリオーナーが先頭になる想定）

---

## 5-2. 招待機能（再有効化フロー含む）

### 招待ダイアログ

「メンバーを招待」ボタンをクリックするとダイアログを表示。

#### 入力フォーム

| フィールド | 種別 | バリデーション |
|-----------|------|--------------|
| メールアドレス | text (email) | 必須、メール形式 |
| 表示名 | text | 必須、1〜50文字 |
| ロール | select (`owner` / `trainer`) | 必須、デフォルト: `trainer` |

#### 送信時の処理（Server Action）

1. バリデーション（zod）
2. 同メールアドレスが `profiles` に存在するか確認
   - **存在しない場合** → 通常の新規招待フローへ（以下 A）
   - **`is_active = true` で存在する場合** → エラー「このメールアドレスは既に登録されています」
   - **`is_active = false` で存在する場合** → 再有効化フローへ（以下 B）

**A. 新規招待フロー:**

3. `supabase.auth.admin.inviteUserByEmail()` で招待メール送信（`user_metadata` に `display_name` と `role` を含める）
4. 成功時: ダイアログを閉じ、一覧を再取得して表示を更新

**B. 再有効化フロー:**

3. 確認ダイアログを表示:「{display_name} は以前削除されたアカウントです。再有効化しますか？」
4. 承認時:
   - `supabase.auth.admin.updateUserById()` で `ban_duration: 'none'` を設定（BAN解除）
   - `profiles` の `is_active = true`・`display_name`・`role` を更新（入力値で上書き）
5. 成功時: ダイアログを閉じ、一覧を再取得して表示を更新

> **再有効化のメリット**: 同じ `profiles.id` を再利用するため、過去のセッション記録との紐付けが維持される。

#### エラーメッセージ

| 条件 | メッセージ |
|------|-----------|
| メールアドレス未入力 | 「メールアドレスを入力してください」 |
| メール形式不正 | 「正しいメールアドレスを入力してください」 |
| 表示名未入力 | 「表示名を入力してください」 |
| 表示名が50文字超 | 「表示名は50文字以内で入力してください」 |
| `is_active = true` で既に登録済み | 「このメールアドレスは既に登録されています」 |
| その他エラー | 「招待メールの送信に失敗しました。しばらく時間をおいて再試行してください」 |

---

## 5-3. 招待されたユーザーのパスワード設定画面

### フロー

1. 招待メール内のリンクをクリック
2. `/auth/callback` でトークンを処理（既存の実装を流用）
3. `/reset-password/update` にリダイレクト（既存の実装を流用）
4. 新しいパスワードを設定してログイン

> 既存の `reset-password/update` 画面がそのまま使えるため、新規画面の作成は不要。

---

## 5-4. メンバー情報編集機能

### 編集ダイアログ

一覧の「編集」ボタンをクリックするとダイアログを表示。現在の値をフォームの初期値として表示する。

#### 編集可能フィールド

| フィールド | 種別 | バリデーション | 備考 |
|-----------|------|--------------|------|
| 表示名 | text | 必須、1〜50文字 | |
| ロール | select (`owner` / `trainer`) | 必須 | `is_primary: true` のユーザーは変更不可（disabled 表示） |

#### 送信時の処理（Server Action）

1. オーナー権限チェック（サーバーサイド）
2. バリデーション（zod）
3. `is_primary: true` のユーザーのロール変更でないことを確認
4. `profiles` の `display_name`・`role` を更新
5. 成功時: ダイアログを閉じ、一覧を再取得して表示を更新

#### エラーメッセージ

| 条件 | メッセージ |
|------|-----------|
| 表示名未入力 | 「表示名を入力してください」 |
| 表示名が50文字超 | 「表示名は50文字以内で入力してください」 |
| プライマリオーナーのロール変更試行 | 「プライマリオーナーのロールは変更できません」 |
| その他エラー | 「更新に失敗しました。しばらく時間をおいて再試行してください」 |

---

## 5-5. トレーナー削除機能（論理削除）

### 削除ボタンの表示条件

- `is_primary: true` のユーザー: 削除ボタン非表示
- 自分自身: 削除ボタン非表示
- 上記以外: 削除ボタンを表示

### 削除確認ダイアログ

削除ボタンをクリックすると確認ダイアログを表示。

| 項目 | 内容 |
|------|------|
| タイトル | 「メンバーを削除しますか？」 |
| 本文 | 「{display_name} を削除します。過去のトレーニング記録は残ります。この操作は取り消せません。」 |
| ボタン | 「キャンセル」「削除する」（削除ボタンは赤色） |

### 削除処理（Server Action）

1. オーナー権限チェック（サーバーサイド）
2. 対象ユーザーが `is_primary: true` でないことを確認
3. 対象ユーザーが自分自身でないことを確認
4. `profiles.is_active = false` に更新（論理削除 — profiles レコードは残す）
5. `supabase.auth.admin.updateUserById()` で `ban_duration: 'forever'` を設定（ログイン無効化）
6. 成功時: 一覧を再取得して表示を更新

> **注意**: Auth ユーザーを物理削除しない。`profiles` レコードを残すことで、過去セッションの「担当: ○○（退職済み）」表示および再有効化が可能になる。

#### エラーメッセージ

| 条件 | メッセージ |
|------|-----------|
| プライマリオーナーの削除試行 | 「プライマリオーナーは削除できません」 |
| 自分自身の削除試行 | 「自分自身は削除できません」 |
| その他エラー | 「削除に失敗しました。しばらく時間をおいて再試行してください」 |

---

## 5-6. オーナー権限チェック

### ガード方式

`/admin/trainers` へのアクセス時に page で以下を確認:

1. ログイン済みであること（未ログイン → `/login` にリダイレクト）
2. `profiles.role === 'owner'` であること（トレーナーの場合 → `/` にリダイレクト）

サーバーサイドで必ず確認し、クライアント側の表示制御だけに頼らない。

---

## DBトリガー（Supabase）

招待承認後に `auth.users` にレコードが作成されたとき、自動で `profiles` に挿入するトリガーを作成する。

```sql
-- auth.users に新規レコードが挿入されたとき profiles を自動作成
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
```

このトリガーにより、招待承認時に `display_name` と `role` が `user_metadata` から自動で `profiles` に反映される。

---

## 技術メモ

- `inviteUserByEmail` / `updateUserById` はすべて `service_role` キーが必要 → Server Action で `createServiceRoleClient()` を使用
- 招待メールのリダイレクト先: `NEXT_PUBLIC_SITE_URL/auth/callback?type=invite`
- `profiles` テーブルに `is_active: boolean (default: true)` カラムが必要（新規マイグレーションで追加）
