// アプリ名定数（後から変更しやすいよう一箇所で管理）
export const APP_NAME = "GymLog";

// 種目カテゴリ
export const CATEGORIES = ['胸', '背中', '脚', '肩', '腕', '腹', '有酸素', 'その他'] as const;
export type Category = (typeof CATEGORIES)[number];
