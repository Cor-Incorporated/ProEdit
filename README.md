# ProEdit - Browser-Based Video Editor MVP

> **ブラウザで動作するプロフェッショナル動画エディタ**  
> Adobe Premiere Pro風のUI/UXと、omniclipの高品質ロジックを統合

![Status](https://img.shields.io/badge/Status-Phase%206%20Complete-success)
![Progress](https://img.shields.io/badge/Progress-62.7%25-blue)
![Critical](https://img.shields.io/badge/NEXT-Phase%208%20Export-red)
![Tech](https://img.shields.io/badge/Next.js-15.5.5-black)
![Tech](https://img.shields.io/badge/PIXI.js-8.14.0-red)
![Tech](https://img.shields.io/badge/Supabase-Latest-green)

---

## 🚨 **緊急通知: Export機能の実装が最優先**

**Phase 1-6は完璧に完了していますが、Export機能が欠落しています。**

- ✅ 編集機能: 完璧に動作
- ❌ **Export機能: 未実装** ← 致命的

**現状**: 「動画編集アプリ」ではなく「動画プレビューアプリ」  
**影響**: 編集結果を動画ファイルとして出力できない

📋 **詳細**: [`NEXT_ACTION_CRITICAL.md`](./NEXT_ACTION_CRITICAL.md)（必読）  
📋 **実装指示**: [`PHASE8_IMPLEMENTATION_DIRECTIVE.md`](./PHASE8_IMPLEMENTATION_DIRECTIVE.md)

**⚠️ Phase 8完了前に他のPhaseに着手することは厳禁**

---

## 🎯 プロジェクト概要

ProEditは、ブラウザ上で動作する高性能なビデオエディタMVPです。

**特徴**:
- ✅ **ブラウザ完結**: インストール不要、Webブラウザのみで動作
- ✅ **高速レンダリング**: PIXI.js v8で60fps実現
- ✅ **プロ品質**: Adobe Premiere Pro風のタイムライン
- ✅ **実証済みロジック**: omniclip（実績ある動画エディタ）のロジックを移植

---

## 📊 開発進捗（2025-10-14時点）

**全体進捗**: 69/110タスク（62.7%） - Phase 1-6完了

### **Phase 1: Setup - ✅ 100%完了** (6/6タスク)
- Next.js 15 + TypeScript
- shadcn/ui 27コンポーネント
- Tailwind CSS
- プロジェクト構造完成

### **Phase 2: Foundation - ✅ 100%完了** (15/15タスク)
- Supabase（認証・DB・Storage）
- Zustand状態管理
- PIXI.js v8初期化
- FFmpeg.wasm統合
- 型定義完備（omniclip準拠）

### **Phase 3: User Story 1 - ✅ 100%完了** (11/11タスク)
- Google OAuth認証
- プロジェクト管理（CRUD）
- ダッシュボードUI

### **Phase 4: User Story 2 - ✅ 100%完了** (14/14タスク)
- メディアアップロード（ドラッグ&ドロップ）
- ファイル重複排除（SHA-256ハッシュ）
- タイムライン表示
- Effect自動配置（omniclip準拠）

### **Phase 5: User Story 3 - ✅ 100%完了** (12/12タスク)
- Real-time 60fps プレビュー
- PIXI.js Canvas描画
- Video/Image/Audio Manager（omniclip移植）
- 再生制御（Play/Pause/Seek）
- FPS監視

### **Phase 6: User Story 4 - ✅ 100%完了** (11/11タスク)
- Trim機能（左右エッジ）
- Drag & Drop（時間軸+トラック）
- Split機能（Sキー）
- Snap-to-Grid
- Undo/Redo（50操作履歴）
- キーボードショートカット（13種類）

### **Phase 7: User Story 5 - ❌ 未着手** (0/10タスク)
- Text Overlay機能

### **Phase 8: User Story 6 - 🚨 最優先** (0/13タスク)
**⚠️ CRITICAL - Export機能が完全欠落**
- FFmpegHelper実装
- Encoder/Decoder実装
- ExportController実装
- Export UI実装
- **影響**: 編集結果を出力できない

📋 **実装指示**: [`PHASE8_IMPLEMENTATION_DIRECTIVE.md`](./PHASE8_IMPLEMENTATION_DIRECTIVE.md)

### **Phase 9: User Story 7 - ⏸️ Phase 8完了後** (0/8タスク)
- Auto-save機能

### **Phase 10: Polish - ⏸️ Phase 9完了後** (0/10タスク)
- UI/UX改善

---

## 📚 ドキュメント構造

### **🔥 現在最重要** 
- [`NEXT_ACTION_CRITICAL.md`](./NEXT_ACTION_CRITICAL.md) - **Phase 8 Export実装** 緊急指示
- [`PHASE8_IMPLEMENTATION_DIRECTIVE.md`](./PHASE8_IMPLEMENTATION_DIRECTIVE.md) - Phase 8詳細実装ガイド

### **📊 プロジェクト状況**
- [`PHASE1-6_VERIFICATION_REPORT_DETAILED.md`](./PHASE1-6_VERIFICATION_REPORT_DETAILED.md) - Phase 1-6完了検証レポート

### **🔧 開発ドキュメント**
- [`docs/`](./docs/) - 開発ガイド・技術仕様
- [`specs/001-proedit-mvp-browser/tasks.md`](./specs/001-proedit-mvp-browser/tasks.md) - 全タスク定義
- [`features/*/README.md`](./features/) - 各機能の技術仕様

### **⚙️ セットアップ**
- [`supabase/SETUP_INSTRUCTIONS.md`](./supabase/SETUP_INSTRUCTIONS.md) - データベース設定

---

## 🚀 クイックスタート

### **前提条件**

- Node.js 20以上
- Supabaseアカウント
- Google OAuth認証情報

### **セットアップ**

```bash
# 1. リポジトリクローン
git clone <repository-url>
cd proedit

# 2. 依存関係インストール
npm install

# 3. 環境変数設定
cp .env.local.example .env.local
# .env.local を編集してSupabase認証情報を追加

# 4. データベースマイグレーション
supabase db push

# 5. 開発サーバー起動
npm run dev
```

**ブラウザ**: http://localhost:3000

---

## 🏗️ 技術スタック

### **フロントエンド**
- **Framework**: Next.js 15.5.5 (App Router)
- **UI**: React 19 + shadcn/ui
- **Styling**: Tailwind CSS 4
- **State**: Zustand 5.0
- **Canvas**: PIXI.js 8.14
- **Video**: FFmpeg.wasm

### **バックエンド**
- **BaaS**: Supabase
- **Auth**: Google OAuth
- **Database**: PostgreSQL
- **Storage**: Supabase Storage
- **Real-time**: Supabase Realtime

### **開発ツール**
- **Language**: TypeScript 5
- **Testing**: Vitest + Testing Library
- **Linting**: ESLint + Prettier

---

## 📁 プロジェクト構造

```
proedit/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 認証ページ
│   ├── editor/            # エディタページ
│   ├── actions/           # Server Actions
│   └── api/               # API Routes
│
├── features/              # 機能モジュール
│   ├── compositor/        # PIXI.js コンポジター（Phase 5）
│   ├── effects/           # エフェクト処理
│   ├── export/            # 動画エクスポート（Phase 8）
│   ├── media/             # メディア管理 ✅
│   └── timeline/          # タイムライン ✅
│
├── components/            # 共有UIコンポーネント
│   ├── projects/          # プロジェクト関連
│   └── ui/                # shadcn/ui コンポーネント
│
├── stores/                # Zustand stores
│   ├── compositor.ts      # コンポジター状態
│   ├── media.ts          # メディア状態 ✅
│   ├── project.ts        # プロジェクト状態 ✅
│   └── timeline.ts       # タイムライン状態 ✅
│
├── types/                 # TypeScript型定義
│   ├── effects.ts        # Effect型（omniclip準拠）✅
│   ├── media.ts          # Media型 ✅
│   └── project.ts        # Project型 ✅
│
├── lib/                   # ライブラリ統合
│   ├── supabase/         # Supabase クライアント ✅
│   ├── pixi/             # PIXI.js セットアップ ✅
│   └── ffmpeg/           # FFmpeg.wasm ローダー ✅
│
├── supabase/             # Supabase設定
│   └── migrations/       # データベースマイグレーション
│       ├── 001_initial_schema.sql ✅
│       ├── 002_row_level_security.sql ✅
│       ├── 003_storage_setup.sql ✅
│       └── 004_fix_effect_schema.sql ✅
│
├── vendor/omniclip/      # omniclip参照実装
│
├── tests/                # テスト
│   ├── unit/             # ユニットテスト
│   └── e2e/              # E2Eテスト
│
└── docs/                 # ドキュメント
    ├── PHASE4_FINAL_REPORT.md        # Phase 4完了レポート
    ├── phase4-archive/               # Phase 4アーカイブ
    └── phase5/                       # Phase 5実装指示
        └── PHASE5_IMPLEMENTATION_DIRECTIVE.md
```

---

## 🧪 テスト

### **実行コマンド**

```bash
# 全テスト実行
npm run test

# ウォッチモード
npm run test:watch

# カバレッジ
npm run test:coverage

# UI付きテスト
npm run test:ui
```

### **現在のテスト状況**

- ✅ Timeline placement logic: 12/12 tests passed (100%)
- ⚠️ Media hash: 1/4 tests passed (Node.js環境制限)
- 📊 カバレッジ: ~35%（Phase 4完了時点）

---

## 📖 ドキュメント

### **主要ドキュメント**

- **Phase 4完了レポート**: `docs/PHASE4_FINAL_REPORT.md` ✅
- **Phase 5実装指示**: `docs/phase5/PHASE5_IMPLEMENTATION_DIRECTIVE.md` 📋
- **仕様書**: `specs/001-proedit-mvp-browser/spec.md`
- **タスク一覧**: `specs/001-proedit-mvp-browser/tasks.md`
- **データモデル**: `specs/001-proedit-mvp-browser/data-model.md`

### **Phase別アーカイブ**

- **Phase 4**: `docs/phase4-archive/`
  - 検証レポート
  - 実装指示書
  - 問題修正レポート

---

## 🔧 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番サーバー起動
npm start

# 型チェック
npm run type-check

# Lint
npm run lint

# フォーマット
npm run format
```

---

## 📈 実装ロードマップ

### **✅ 完了フェーズ**

- [x] Phase 1: Setup (6タスク)
- [x] Phase 2: Foundation (15タスク)
- [x] Phase 3: User Story 1 - Auth & Projects (11タスク)
- [x] Phase 4: User Story 2 - Media & Timeline (14タスク)

### **🚧 進行中**

- [ ] **Phase 5: User Story 3 - Real-time Preview** (12タスク)
  - Compositor実装
  - VideoManager/ImageManager
  - 60fps playback loop
  - Timeline ruler & playhead

### **📅 予定フェーズ**

- [ ] Phase 6: User Story 4 - Editing Operations (11タスク)
- [ ] Phase 7: User Story 5 - Text Overlays (10タスク)
- [ ] Phase 8: User Story 6 - Video Export (13タスク)
- [ ] Phase 9: User Story 7 - Auto-save (8タスク)
- [ ] Phase 10: Polish (10タスク)

**総タスク数**: 110タスク  
**完了タスク**: 46タスク (41.8%)

---

## 🤝 Contributing

開発チームメンバーは以下のワークフローに従ってください：

1. タスクを`specs/001-proedit-mvp-browser/tasks.md`から選択
2. 実装指示書（`docs/phase*/`）を読む
3. omniclip参照実装（`vendor/omniclip/`）を確認
4. 実装
5. テスト作成・実行
6. 型チェック実行
7. Pull Request作成

---

## 📝 ライセンス

MIT License

---

## 🙏 謝辞

このプロジェクトは、以下の優れたオープンソースプロジェクトを参照・利用しています：

- **omniclip**: ビデオエディタのコアロジック（配置、コンポジティング、エクスポート）
- **PIXI.js**: 高速2Dレンダリング
- **Next.js**: Reactフレームワーク
- **Supabase**: Backend-as-a-Service
- **shadcn/ui**: 美しいUIコンポーネント

---

**最終更新**: 2025-10-14  
**現在のフェーズ**: Phase 5開始準備完了  
**次のマイルストーン**: Real-time Preview (60fps) 実装
