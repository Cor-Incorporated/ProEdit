# ProEdit MVP - ドキュメント索引

**最終更新**: 2025年10月15日

---

## 🎯 開発者向けクイックリンク

### 今すぐ読むべきドキュメント
1. **[DEVELOPMENT_STATUS.md](../DEVELOPMENT_STATUS.md)** 🚨
   - CRITICAL作業の詳細
   - 実装手順（コード例付き）
   - 今日中に完了必須のタスク

2. **[README.md](../README.md)**
   - プロジェクト概要
   - セットアップ手順
   - トラブルシューティング

---

## 📊 ステータス・レポート

### アクティブなドキュメント
- **[DEVELOPMENT_STATUS.md](../DEVELOPMENT_STATUS.md)** - 開発ステータス（更新頻度: 高）
- **[COMPREHENSIVE_VERIFICATION_REPORT_2025-10-15.md](../COMPREHENSIVE_VERIFICATION_REPORT_2025-10-15.md)** - 包括的検証レポート
- **[REMAINING_TASKS_ACTION_PLAN.md](../REMAINING_TASKS_ACTION_PLAN.md)** - 残タスクアクションプラン
- **[URGENT_ACTION_REQUIRED.md](../URGENT_ACTION_REQUIRED.md)** - 緊急アクション要求書

### アーカイブ
- **[.archive/](../.archive/)** - 過去のレポート類

---

## 📚 仕様書・設計書

### MVP仕様（必読）
- **[specs/001-proedit-mvp-browser/spec.md](../specs/001-proedit-mvp-browser/spec.md)** - 機能仕様
- **[specs/001-proedit-mvp-browser/tasks.md](../specs/001-proedit-mvp-browser/tasks.md)** - タスク一覧（Phase1-9）
- **[specs/001-proedit-mvp-browser/data-model.md](../specs/001-proedit-mvp-browser/data-model.md)** - データモデル
- **[specs/001-proedit-mvp-browser/plan.md](../specs/001-proedit-mvp-browser/plan.md)** - アーキテクチャ計画

### Constitutional要件
- **[specs/001-proedit-mvp-browser/spec.md](../specs/001-proedit-mvp-browser/spec.md)** - Constitutional Principles（必須要件）

---

## 🔧 技術ドキュメント

### セットアップ
- **[supabase/SETUP_INSTRUCTIONS.md](../supabase/SETUP_INSTRUCTIONS.md)** - Supabase環境構築

### 機能別ドキュメント
- **[features/compositor/README.md](../features/compositor/README.md)** - PIXI.js レンダリング
- **[features/timeline/README.md](../features/timeline/README.md)** - タイムライン編集
- **[features/media/README.md](../features/media/README.md)** - メディア管理
- **[features/effects/README.md](../features/effects/README.md)** - エフェクト（テキスト等）
- **[features/export/README.md](../features/export/README.md)** - 動画エクスポート

### 開発ガイド
- **[DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)** - 開発ガイドライン
- **[CLAUDE.md](./CLAUDE.md)** - AI開発ガイド

---

## 🎓 学習リソース

### omniclip参照
- **[vendor/omniclip/README.md](../vendor/omniclip/README.md)** - omniclipプロジェクト
- **omniclip実装**: `/vendor/omniclip/s/context/controllers/`

### 外部リンク
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [PIXI.js v7 Docs](https://v7.pixijs.download/release/docs/index.html)
- [shadcn/ui](https://ui.shadcn.com/)
- [Zustand](https://zustand-demo.pmnd.rs/)

---

## 📋 チェックリスト

### デイリーチェック
- [ ] `DEVELOPMENT_STATUS.md`を確認
- [ ] `npx tsc --noEmit`でTypeScriptエラー確認
- [ ] `npm run build`でビルド確認

### 実装前
- [ ] 該当するREADME.mdを読む
- [ ] tasks.mdでタスク要件を確認
- [ ] TypeScript型定義を確認

### 実装後
- [ ] TypeScriptエラーチェック
- [ ] ビルドテスト
- [ ] 機能動作確認

---

## 🔍 ドキュメント検索

### プロジェクト全体を検索
```bash
grep -r "検索キーワード" . --include="*.md"
```

### 特定フォルダ内を検索
```bash
# 仕様書内を検索
grep -r "検索キーワード" specs/

# 機能ドキュメント内を検索
grep -r "検索キーワード" features/
```

---

## 📞 サポート

質問・問題があれば:
1. このINDEX.mdから該当ドキュメントを探す
2. `DEVELOPMENT_STATUS.md`のトラブルシューティングを確認
3. 各機能の`README.md`を確認

---

**メンテナンス**: このドキュメントは定期的に更新されます  
**最終更新**: 2025年10月15日
