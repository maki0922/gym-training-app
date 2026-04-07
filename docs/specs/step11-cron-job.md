# ステップ11 機能仕様書: Vercel Cron Job（セッション自動完了）

## 概要

毎日0:00（JST）に、前日以前の `in_progress` セッションを自動的に `completed` に変更する。トレーナーが「セッション完了」ボタンを押し忘れた場合のデータ放置を防止する。

---

## 11-1. API Route

### エンドポイント

| 項目 | 内容 |
|------|------|
| パス | `/api/cron/complete-sessions` |
| メソッド | `GET` |
| 認証 | `CRON_SECRET` による検証（後述） |

### 処理内容

1. リクエストヘッダー `Authorization` の値が `Bearer ${CRON_SECRET}` と一致するか検証
2. 現在日時からJST基準の「今日の日付」を算出
3. `training_sessions` テーブルから以下の条件に一致するレコードを更新:
   - `status = 'in_progress'`
   - `session_date < 今日（JST）`
   - `is_deleted = false`
4. 該当レコードの `status` を `'completed'` に更新

### レスポンス

| ケース | ステータス | ボディ |
|--------|-----------|--------|
| 成功 | `200` | `{ "ok": true, "updatedCount": N }` |
| 認証失敗 | `401` | `{ "error": "Unauthorized" }` |
| 処理エラー | `500` | `{ "error": "Internal Server Error" }` |

### 注意事項

- RLSをバイパスする必要があるため、`SUPABASE_SERVICE_ROLE_KEY` を使用した管理者クライアントでDBに接続する
- Cron Jobは認証ユーザーのコンテキストを持たないため、通常のサーバー用クライアント（Cookie依存）は使用できない

---

## 11-2. Cron スケジュール設定

### vercel.json

```json
{
  "crons": [
    {
      "path": "/api/cron/complete-sessions",
      "schedule": "0 15 * * *"
    }
  ]
}
```

| 項目 | 内容 |
|------|------|
| スケジュール | `0 15 * * *`（UTC 15:00 = JST 0:00） |
| 実行頻度 | 毎日1回 |

---

## 11-3. 認証保護

### 方式

Vercel Cron Jobsでは、Vercelが自動的にリクエストヘッダーに `Authorization: Bearer <CRON_SECRET>` を付与する。

| 項目 | 内容 |
|------|------|
| 環境変数名 | `CRON_SECRET` |
| 設定場所 | Vercel のプロジェクト設定 → Environment Variables |
| 検証方法 | `request.headers.get('authorization') === \`Bearer ${process.env.CRON_SECRET}\`` |

### 不正アクセス防止

- `CRON_SECRET` が未設定、またはヘッダーの値が一致しない場合は `401 Unauthorized` を返す
- 外部から直接URLを叩いても処理は実行されない

---

## 11-4. 実行ON/OFF制御

### 方式

環境変数 `CRON_ENABLED` により、Cronの処理実行を制御する。

| 環境変数 | 値 | 動作 |
|---------|-----|------|
| `CRON_ENABLED` | `true` | 通常通り自動完了処理を実行 |
| `CRON_ENABLED` | `true` 以外 or 未設定 | 処理をスキップし即座に200を返す |

### 処理フロー

1. `CRON_SECRET` による認証チェック（失敗 → 401）
2. `CRON_ENABLED` チェック（`true` でなければスキップ → 200 + `skipped: true`）
3. 自動完了処理を実行

### レスポンス（スキップ時）

```json
{ "ok": true, "skipped": true, "reason": "CRON_ENABLED is not true" }
```

### 運用

- Vercel のプロジェクト設定 → Environment Variables で `CRON_ENABLED` を設定
- 再デプロイ不要で切り替え可能（環境変数の変更は次回リクエストから即反映）
- 初期状態は未設定（= OFF）とし、運用開始時に `true` に設定する

---

## ローカル開発・テスト

手動でAPIを呼び出してテストする場合:

```bash
curl -H "Authorization: Bearer <CRON_SECRET>" http://localhost:3000/api/cron/complete-sessions
```

---

## 影響範囲

- ダッシュボードの「入力途中セッション通知」: 自動完了されたセッションはバナーから消える
- 顧客詳細画面の「入力途中セッション」通知: 同様に消える
- セッション一覧: ステータスが `completed` に変わる
