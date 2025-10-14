# ProEdit MVP - プロジェクト構造ガイド

**最終更新**: 2025年10月15日

---

## 📁 ディレクトリ構造

```
proedit/
├── 📄 README.md                          # プロジェクト概要
├── 📄 DEVELOPMENT_STATUS.md              # 🚨 開発ステータス（最重要）
├── 📄 COMPREHENSIVE_VERIFICATION_REPORT_2025-10-15.md
├── 📄 REMAINING_TASKS_ACTION_PLAN.md
├── 📄 URGENT_ACTION_REQUIRED.md
│
├── 📂 app/                               # Next.js 15 App Router
│   ├── (auth)/                          # 認証ルート
│   │   ├── callback/                    # OAuth callback
│   │   ├── login/                       # ログインページ
│   │   └── layout.tsx                   # 認証レイアウト
│   │
│   ├── actions/                         # Server Actions (Supabase)
│   │   ├── auth.ts                      # 認証操作
│   │   ├── projects.ts                  # プロジェクトCRUD
│   │   ├── media.ts                     # メディアCRUD
│   │   └── effects.ts                   # エフェクトCRUD
│   │
│   ├── api/                             # API Routes
│   │
│   ├── editor/                          # エディターUI
│   │   ├── page.tsx                     # ダッシュボード
│   │   ├── [projectId]/                # プロジェクト編集
│   │   │   ├── page.tsx                # Server Component
│   │   │   └── EditorClient.tsx        # Client Component
│   │   ├── layout.tsx                   # エディターレイアウト
│   │   └── loading.tsx                  # ローディング状態
│   │
│   ├── globals.css                      # グローバルスタイル
│   └── layout.tsx                       # ルートレイアウト
│
├── 📂 features/                          # 機能モジュール（Feature-Sliced Design）
│   │
│   ├── compositor/                      # PIXI.js レンダリングエンジン
│   │   ├── components/                  # React components
│   │   │   ├── Canvas.tsx              # PIXI.js canvas wrapper
│   │   │   ├── PlaybackControls.tsx    # 再生コントロール
│   │   │   └── FPSCounter.tsx          # FPS表示
│   │   ├── managers/                    # メディアマネージャー
│   │   │   ├── VideoManager.ts         # 動画管理
│   │   │   ├── ImageManager.ts         # 画像管理
│   │   │   ├── AudioManager.ts         # 音声管理
│   │   │   └── TextManager.ts          # テキスト管理（737行）
│   │   ├── utils/                       # ユーティリティ
│   │   │   ├── Compositor.ts           # メインコンポジター（380行）
│   │   │   └── text.ts                 # テキスト処理
│   │   └── README.md                    # 機能説明
│   │
│   ├── timeline/                        # タイムライン編集
│   │   ├── components/                  # UI components
│   │   │   ├── Timeline.tsx            # メインタイムライン
│   │   │   ├── TimelineTrack.tsx       # トラック
│   │   │   ├── TimelineClip.tsx        # クリップ（Effect表示）
│   │   │   ├── TimelineRuler.tsx       # ルーラー
│   │   │   ├── PlayheadIndicator.tsx   # 再生ヘッド
│   │   │   ├── TrimHandles.tsx         # トリムハンドル
│   │   │   ├── SplitButton.tsx         # 分割ボタン
│   │   │   └── SelectionBox.tsx        # 選択ボックス
│   │   ├── handlers/                    # イベントハンドラー
│   │   │   ├── DragHandler.ts          # ドラッグ処理（142行）
│   │   │   └── TrimHandler.ts          # トリム処理（204行）
│   │   ├── hooks/                       # カスタムフック
│   │   │   └── useKeyboardShortcuts.ts # キーボードショートカット
│   │   ├── utils/                       # ユーティリティ
│   │   │   ├── autosave.ts             # 自動保存（196行）
│   │   │   ├── placement.ts            # Effect配置ロジック
│   │   │   ├── snap.ts                 # スナップ機能
│   │   │   └── split.ts                # 分割ロジック
│   │   └── README.md
│   │
│   ├── media/                           # メディア管理
│   │   ├── components/
│   │   │   ├── MediaLibrary.tsx        # メディアライブラリ
│   │   │   ├── MediaUpload.tsx         # アップロード
│   │   │   └── MediaCard.tsx           # メディアカード
│   │   ├── utils/
│   │   │   ├── hash.ts                 # ファイルハッシュ（重複排除）
│   │   │   └── metadata.ts             # メタデータ抽出
│   │   └── README.md
│   │
│   ├── effects/                         # エフェクト（テキスト等）
│   │   ├── components/
│   │   │   ├── TextEditor.tsx          # テキストエディター
│   │   │   ├── TextStyleControls.tsx   # スタイルコントロール
│   │   │   ├── FontPicker.tsx          # フォントピッカー
│   │   │   └── ColorPicker.tsx         # カラーピッカー
│   │   ├── presets/
│   │   │   └── text.ts                 # テキストプリセット
│   │   └── README.md
│   │
│   └── export/                          # 動画エクスポート
│       ├── components/
│       │   ├── ExportDialog.tsx        # エクスポートダイアログ
│       │   ├── QualitySelector.tsx     # 品質選択
│       │   └── ExportProgress.tsx      # 進捗表示
│       ├── ffmpeg/
│       │   └── FFmpegHelper.ts         # FFmpeg.wasm wrapper
│       ├── workers/                     # Web Workers
│       │   ├── encoder.worker.ts       # エンコーダー
│       │   ├── Encoder.ts              # Encoder class
│       │   ├── decoder.worker.ts       # デコーダー
│       │   └── Decoder.ts              # Decoder class
│       ├── utils/
│       │   ├── ExportController.ts     # エクスポート制御（168行）
│       │   ├── codec.ts                # WebCodecs検出
│       │   ├── download.ts             # ファイルダウンロード
│       │   └── BinaryAccumulator.ts    # バイナリ蓄積
│       ├── types.ts                     # エクスポート型定義
│       └── README.md
│
├── 📂 components/                        # 共有UIコンポーネント
│   ├── projects/
│   │   ├── NewProjectDialog.tsx        # 新規プロジェクト
│   │   └── ProjectCard.tsx             # プロジェクトカード
│   ├── SaveIndicator.tsx                # 保存インジケーター
│   ├── ConflictResolutionDialog.tsx     # 競合解決
│   ├── RecoveryModal.tsx                # 復旧モーダル
│   └── ui/                              # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── sheet.tsx
│       └── ... (30+ components)
│
├── 📂 stores/                            # Zustand State Management
│   ├── index.ts                         # Store exports
│   ├── timeline.ts                      # タイムラインstore
│   ├── compositor.ts                    # コンポジターstore
│   ├── media.ts                         # メディアstore
│   ├── project.ts                       # プロジェクトstore
│   └── history.ts                       # Undo/Redo store
│
├── 📂 lib/                               # ライブラリ・ユーティリティ
│   ├── supabase/                        # Supabase utilities
│   │   ├── client.ts                   # クライアント
│   │   ├── server.ts                   # サーバー
│   │   ├── middleware.ts               # ミドルウェア
│   │   ├── sync.ts                     # Realtime sync（185行）
│   │   └── utils.ts                    # ユーティリティ
│   ├── pixi/
│   │   └── setup.ts                    # PIXI.js初期化
│   ├── ffmpeg/
│   │   └── loader.ts                   # FFmpeg.wasm loader
│   └── utils.ts                         # 共通ユーティリティ
│
├── 📂 types/                             # TypeScript型定義
│   ├── effects.ts                       # Effect型（Video/Image/Audio/Text）
│   ├── media.ts                         # Media型
│   ├── project.ts                       # Project型
│   ├── supabase.ts                      # Supabase生成型
│   └── pixi-transformer.d.ts            # pixi-transformer型定義
│
├── 📂 supabase/                          # Supabase設定
│   ├── migrations/                      # DBマイグレーション
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_row_level_security.sql
│   │   ├── 003_storage_setup.sql
│   │   └── 004_fix_effect_schema.sql
│   └── SETUP_INSTRUCTIONS.md            # セットアップ手順
│
├── 📂 specs/                             # 仕様書
│   └── 001-proedit-mvp-browser/
│       ├── spec.md                      # 機能仕様
│       ├── tasks.md                     # タスク一覧（Phase1-9）
│       ├── data-model.md                # データモデル
│       ├── plan.md                      # アーキテクチャ
│       ├── quickstart.md                # クイックスタート
│       ├── research.md                  # 技術調査
│       └── checklists/
│           └── requirements.md          # 要件チェックリスト
│
├── 📂 docs/                              # ドキュメント
│   ├── INDEX.md                         # ドキュメント索引
│   ├── README.md                        # ドキュメント概要
│   ├── DEVELOPMENT_GUIDE.md             # 開発ガイド
│   └── CLAUDE.md                        # AI開発ガイド
│
├── 📂 tests/                             # テスト
│   ├── e2e/                             # E2Eテスト（Playwright）
│   ├── integration/                     # 統合テスト
│   └── unit/                            # ユニットテスト
│
├── 📂 public/                            # 静的ファイル
│   └── workers/                         # Web Worker files
│
├── 📂 vendor/                            # サードパーティコード
│   └── omniclip/                        # omniclipプロジェクト（参照用）
│
├── 📂 .archive/                          # アーカイブ（過去のレポート）
│   ├── README.md
│   └── reports-2025-10-15/
│
├── 📄 next.config.ts                     # Next.js設定
├── 📄 tsconfig.json                      # TypeScript設定
├── 📄 tailwind.config.ts                 # Tailwind CSS設定
├── 📄 components.json                    # shadcn/ui設定
├── 📄 package.json                       # 依存関係
└── 📄 .gitignore                         # Git ignore
```

---

## 🎯 重要なファイル

### 開発時に常に参照
1. **DEVELOPMENT_STATUS.md** - 今やるべきこと
2. **specs/001-proedit-mvp-browser/tasks.md** - タスク一覧
3. **stores/timeline.ts** - タイムライン状態管理
4. **features/compositor/utils/Compositor.ts** - レンダリングエンジン

### 機能実装時に参照
- 各`features/*/README.md` - 機能説明
- 各`features/*/components/` - UIコンポーネント
- `app/actions/` - Server Actions（DB操作）

---

## 📋 命名規則

### ファイル命名
- **React Components**: PascalCase (e.g., `Timeline.tsx`)
- **Utilities**: camelCase (e.g., `autosave.ts`)
- **Types**: PascalCase (e.g., `Effect.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `EXPORT_PRESETS`)

### コンポーネント構造
```typescript
// features/timeline/components/Timeline.tsx
export function Timeline({ projectId }: TimelineProps) {
  // Component logic
}

// features/timeline/utils/autosave.ts
export class AutoSaveManager {
  // Utility class
}

// types/effects.ts
export interface Effect {
  // Type definition
}
```

---

## 🔍 コード検索ガイド

### 特定の機能を探す
```bash
# Timeline関連
find . -path "./features/timeline/*" -name "*.tsx" -o -name "*.ts"

# Server Actions
find . -path "./app/actions/*" -name "*.ts"

# 型定義
find . -path "./types/*" -name "*.ts"
```

### 特定のキーワードを探す
```bash
# テキスト機能関連
grep -r "TextManager" --include="*.ts" --include="*.tsx"

# 自動保存関連
grep -r "AutoSave" --include="*.ts" --include="*.tsx"
```

---

## 📊 コードベース統計

### 実装ファイル数
```
app/         17ファイル
features/    52ファイル
components/  33ファイル
stores/       6ファイル
types/        5ファイル
```

### 主要コンポーネントの行数
```
TextManager.ts:        737行
Compositor.ts:         380行
AutoSaveManager.ts:    196行
RealtimeSyncManager:   185行
ExportController.ts:   168行
```

---

## 🆘 トラブルシューティング

### ファイルが見つからない
1. `grep -r "ファイル名" .`で検索
2. `.gitignore`に含まれていないか確認
3. `.archive/`に移動していないか確認

### 型定義が見つからない
1. `types/`フォルダを確認
2. `import type { ... } from '@/types/...'`の形式を使用

### コンポーネントのインポートエラー
1. `@/`エイリアスを使用（`tsconfig.json`で設定済み）
2. 相対パスではなく絶対パスを推奨

---

**最終更新**: 2025年10月15日  
**メンテナンス**: 新規機能追加時に更新

