# 🚀 ProEdit MVP - クイックスタート

**最重要**: まず [DEVELOPMENT_STATUS.md](./DEVELOPMENT_STATUS.md) を読んでください！

---

## ⚡ 5分でセットアップ

### 1. 依存関係インストール
```bash
npm install
```

### 2. 環境変数設定
```bash
cp .env.local.example .env.local
# .env.localを編集してSupabase情報を追加
```

### 3. Supabaseセットアップ
```bash
# supabase/SETUP_INSTRUCTIONS.md を参照
```

### 4. 開発サーバー起動
```bash
npm run dev
```

ブラウザで http://localhost:3000 を開く

---

## 🎯 今すぐやるべきこと

### CRITICAL作業実施中（4-5時間）

1. **[DEVELOPMENT_STATUS.md](./DEVELOPMENT_STATUS.md)** を読む（5分）
2. タスクを実装（4時間）
   - Timeline統合（45-60分）
   - Canvas統合（60-90分）
   - AutoSave配線（90-120分）
3. 検証テスト（30分）

---

## 📚 ドキュメント構成

### 必読ドキュメント
1. **[DEVELOPMENT_STATUS.md](./DEVELOPMENT_STATUS.md)** 🚨 - 今やるべきこと
2. **[README.md](./README.md)** - プロジェクト概要
3. **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** - ディレクトリ構造

### 詳細情報
- **[docs/INDEX.md](./docs/INDEX.md)** - ドキュメント索引
- **[specs/001-proedit-mvp-browser/](./specs/001-proedit-mvp-browser/)** - 仕様書
- **[features/*/README.md](./features/)** - 各機能の説明

---

## 🔧 よく使うコマンド

```bash
# TypeScriptチェック
npx tsc --noEmit

# ビルド
npm run build

# テスト
npm test

# Linter
npm run lint

# コードフォーマット
npm run format
```

---

## 🆘 トラブルシューティング

### ビルドエラー
```bash
# 依存関係を再インストール
rm -rf node_modules package-lock.json
npm install

# TypeScriptエラーを確認
npx tsc --noEmit
```

### PIXI.jsバージョンエラー
```bash
# バージョン確認
npm list pixi.js

# 期待: pixi.js@7.4.2
# もし違う場合
npm install pixi.js@7.4.2
```

### Supabaseエラー
```bash
# 環境変数を確認
cat .env.local

# Supabaseプロジェクトが正しく設定されているか確認
```

---

## 📞 ヘルプ

質問・問題があれば:
1. [DEVELOPMENT_STATUS.md](./DEVELOPMENT_STATUS.md) のトラブルシューティングセクション
2. [docs/INDEX.md](./docs/INDEX.md) で該当ドキュメントを検索
3. TypeScript/ビルドエラーをチェック

---

**所要時間**: セットアップ5分 + CRITICAL作業4-5時間 = **約5時間でMVP完成** 🎉

