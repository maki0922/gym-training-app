-- 種目マスタ初期データ（is_system: true）
-- ON CONFLICT DO NOTHING で冪等性を担保

insert into exercise_master (name, category, is_system, is_active) values
  -- 胸
  ('ベンチプレス',               '胸', true, true),
  ('ダンベルフライ',             '胸', true, true),
  ('インクラインベンチプレス',   '胸', true, true),
  ('チェストプレス（マシン）',   '胸', true, true),
  ('ケーブルクロスオーバー',     '胸', true, true),
  -- 背中
  ('デッドリフト',               '背中', true, true),
  ('ラットプルダウン',           '背中', true, true),
  ('シーテッドロウ',             '背中', true, true),
  ('ベントオーバーロウ',         '背中', true, true),
  ('懸垂',                       '背中', true, true),
  -- 脚
  ('スクワット',                 '脚', true, true),
  ('レッグプレス',               '脚', true, true),
  ('レッグカール',               '脚', true, true),
  ('レッグエクステンション',     '脚', true, true),
  ('ブルガリアンスクワット',     '脚', true, true),
  -- 肩
  ('ショルダープレス',           '肩', true, true),
  ('サイドレイズ',               '肩', true, true),
  ('フロントレイズ',             '肩', true, true),
  ('リアレイズ',                 '肩', true, true),
  ('アーノルドプレス',           '肩', true, true),
  -- 腕
  ('アームカール',               '腕', true, true),
  ('トライセプスプレスダウン',   '腕', true, true),
  ('ハンマーカール',             '腕', true, true),
  ('フレンチプレス',             '腕', true, true),
  -- 腹
  ('クランチ',                   '腹', true, true),
  ('プランク',                   '腹', true, true),
  ('レッグレイズ',               '腹', true, true),
  ('アブローラー',               '腹', true, true),
  -- 有酸素
  ('トレッドミル',               '有酸素', true, true),
  ('エアロバイク',               '有酸素', true, true),
  ('ローイングマシン',           '有酸素', true, true),
  -- その他
  ('ストレッチ',                 'その他', true, true),
  ('フォームローラー',           'その他', true, true)
on conflict do nothing;
