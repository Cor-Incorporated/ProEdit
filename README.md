# ProEdit MVP - Browser-Based Video Editor

**ステータス**: 🚨 CRITICAL作業実施中  
**進捗**: 94%実装完了、67%機能動作中  
**次のマイルストーン**: MVP要件達成（4-5時間）

---

## 🚀 クイックスタート

### 開発環境セットアップ
```bash
# 依存関係インストール
npm install

# Supabaseセットアップ
# supabase/SETUP_INSTRUCTIONS.md を参照

# 開発サーバー起動
npm run dev
```

### ビルド・テスト
```bash
# TypeScriptチェック
npx tsc --noEmit

# プロダクションビルド
npm run build

# テスト実行
npm test
```

---

## 📊 現在の状態

### Constitutional要件ステータス
- ✅ FR-001 ~ FR-006: 達成
- 🚨 FR-007 (テキストオーバーレイ): **違反中** ← CRITICAL修正中
- ✅ FR-008: 達成
- 🚨 FR-009 (自動保存): **違反中** ← CRITICAL修正中
- ✅ FR-010 ~ FR-015: 達成

### 技術スタック
- **フロントエンド**: Next.js 15, React 19, TypeScript
- **UI**: shadcn/ui, Tailwind CSS
- **状態管理**: Zustand
- **バックエンド**: Supabase (Auth, Database, Storage, Realtime)
- **レンダリング**: PIXI.js v7.4.2
- **動画処理**: FFmpeg.wasm, WebCodecs

---

## 📁 プロジェクト構造

```
proedit/
├── app/                    # Next.js 15 App Router
│   ├── (auth)/            # 認証ルート
│   ├── actions/           # Server Actions (Supabase)
│   └── editor/            # エディターUI
├── features/              # 機能モジュール
│   ├── compositor/        # PIXI.js レンダリング
│   ├── timeline/          # タイムライン編集
│   ├── media/             # メディア管理
│   ├── effects/           # エフェクト（テキスト等）
│   └── export/            # 動画エクスポート
├── components/            # 共有UIコンポーネント
├── stores/                # Zustand stores
├── lib/                   # ユーティリティ
├── types/                 # TypeScript型定義
└── supabase/              # DB migrations
```

---

## 🎯 開発ガイド

### 重要なドキュメント

1. **DEVELOPMENT_STATUS.md** ← 今すぐ読む！
   - CRITICAL作業の詳細
   - 実装手順（コード例付き）
   - 検証手順

2. **specs/001-proedit-mvp-browser/**
   - `spec.md` - 機能仕様
   - `tasks.md` - タスク一覧
   - `data-model.md` - データモデル

3. **features/*/README.md**
   - 各機能の説明

### 今すぐやるべきこと

**CRITICAL作業（4-5時間）**:
1. Timeline統合（45-60分）
2. Canvas統合（60-90分）
3. AutoSave配線（90-120分）
4. 検証テスト（30分）

詳細は `DEVELOPMENT_STATUS.md` を参照。

---

## 🔧 トラブルシューティング

### TypeScriptエラー
```bash
npx tsc --noEmit
```

### ビルドエラー
```bash
npm run build
```

### PIXI.jsバージョン確認
```bash
npm list pixi.js
# 期待: pixi.js@7.4.2
```

---

## 📚 参考リンク

- [Next.js 15 Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [PIXI.js v7 Docs](https://v7.pixijs.download/release/docs/index.html)
- [shadcn/ui](https://ui.shadcn.com/)

---

## 🆘 ヘルプ

質問・問題があれば:
1. `DEVELOPMENT_STATUS.md`を確認
2. `features/*/README.md`を確認
3. TypeScript/ビルドエラーをチェック

---

**最終更新**: 2025年10月15日  
**ライセンス**: MIT
