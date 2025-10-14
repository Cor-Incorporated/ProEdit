# ProEdit Constitution - 提案書

## Core Principles

### I. コードの再利用と段階的移行
**既存の実装を最大限活用し、車輪の再発明を避ける**
- omniclipの実証済み実装ロジック（FFmpeg処理、WebCodecs、PIXI.js統合）を参考にする
- 動作するコードは段階的に移植し、必要に応じて最適化
- 新規実装が必要な箇所のみ、現代的なベストプラクティスで実装
- TypeScript型定義は厳密に維持（omniclipのEffect型システムを踏襲）

### II. ブラウザファースト・パフォーマンス
**クライアントサイドでの高速処理を最優先**
- WebCodecs API、WebAssembly、Web Workers活用による並列処理
- PIXI.js（WebGL）によるGPUアクセラレーション必須
- 大容量ファイル対応のためOPFS（Origin Private File System）使用
- メモリ効率を考慮したストリーミング処理
- レスポンシブ設計でモバイルも視野に入れる

### III. モダンスタック統合
**Next.js 14+ App Router × Supabaseの最新機能を活用**
- **フロントエンド**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **バックエンド**: Supabase (Auth, Database, Storage, Realtime)
- **状態管理**: Zustand（軽量でシンプル、omniclipのStateパターンに適合）
- **動画処理**: FFmpeg.wasm + WebCodecs API
- **レンダリング**: PIXI.js v8
- Server ActionsでSupabaseとの通信を効率化

### IV. ユーザビリティファースト
**Adobe Premiere Proレベルの直感的な操作性**
- ドラッグ&ドロップによる直感的な操作
- キーボードショートカット完備（Ctrl+Z/Yなど）
- リアルタイムプレビュー必須
- プログレスインジケーターとエラーハンドリング徹底
- アクセシビリティ配慮（ARIA属性、キーボードナビゲーション）

### V. スケーラブルアーキテクチャ
**MVP後の拡張を見据えた設計**
- 機能ごとにモジュール分割（/features ディレクトリ構造）
- エフェクトシステムは拡張可能な設計（プラグイン的に新エフェクト追加可能）
- API設計はRESTfulかつGraphQL対応可能な形に
- マイクロフロントエンド的な独立性（タイムライン、プレビュー、エフェクトパネルは独立）

## Technical Standards

### アーキテクチャ原則
**参照元**: omniclipのState-Actions-Controllers-Viewsパターンを踏襲

```
/app                    # Next.js App Router
  /(auth)              # 認証関連ページ
  /(editor)            # エディタメインページ
  /api                 # API Routes
/features              # 機能別モジュール
  /timeline            # タイムライン機能
  /compositor          # レンダリング・合成
  /effects             # エフェクト管理
  /export              # 動画エクスポート
  /media               # メディアファイル管理
/lib                   # 共通ユーティリティ
  /supabase           # Supabase クライアント
  /ffmpeg             # FFmpeg Wrapper
  /pixi               # PIXI.js 初期化
/types                 # TypeScript型定義
```

### データモデル設計
**Supabase Postgres スキーマ**

```sql
-- プロジェクト管理
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  settings JSONB DEFAULT '{"width": 1920, "height": 1080, "fps": 30}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- エフェクト保存（omniclipのAnyEffect型を踏襲）
CREATE TABLE effects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('video', 'audio', 'image', 'text')),
  track INTEGER NOT NULL,
  start_at_position INTEGER NOT NULL,
  duration INTEGER NOT NULL,
  properties JSONB NOT NULL, -- EffectRect, text properties等
  file_url TEXT, -- Supabase Storageへの参照
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- メディアファイル管理
CREATE TABLE media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  file_hash TEXT UNIQUE NOT NULL,
  filename TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL, -- Supabase Storage path
  metadata JSONB, -- duration, dimensions等
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### セキュリティ原則
- Supabase Row Level Security (RLS) 必須
- ファイルアップロードは署名付きURL使用
- 環境変数の適切な管理（.env.local使用、Gitにコミットしない）
- XSS対策（DOMPurifyでサニタイズ）

## Development Workflow

### MVP開発フェーズ
**段階的リリース戦略**

**Phase 1: コア機能（2週間目標）**
- [ ] Supabase認証（Google OAuth）
- [ ] プロジェクト作成・保存
- [ ] メディアファイルアップロード（動画・画像）
- [ ] 基本タイムライン（トラック表示、エフェクト配置）
- [ ] シンプルなプレビュー（PIXI.js統合）

**Phase 2: 編集機能（2週間目標）**
- [ ] トリミング・分割
- [ ] テキストエフェクト追加
- [ ] ドラッグ&ドロップによる配置
- [ ] アンドゥ/リドゥ
- [ ] 基本的な動画エクスポート（720p）

**Phase 3: 拡張機能（2週間目標）**
- [ ] トランジション
- [ ] フィルター・エフェクト
- [ ] 複数解像度対応（4K含む）
- [ ] プロジェクト共有機能

### コーディング規約
- **ESLint + Prettier** 厳守
- **TypeScript strict mode** 必須
- **関数は単一責任原則**（1関数1責務）
- **コンポーネントは100行以内を目安**（超える場合は分割）
- **カスタムフックで状態ロジック分離**

### テスト戦略
- **ユニットテスト**: Vitest（軽量で高速）
- **E2Eテスト**: Playwright（クリティカルパスのみ）
- **テストカバレッジ**: 70%以上を目標
- **重点テスト箇所**:
  - FFmpeg処理ロジック
  - エフェクト配置計算
  - Supabase RLS権限

## Non-Negotiables

### 必須要件
1. **パフォーマンス**: 60fps維持、4K動画エクスポート対応
2. **セキュリティ**: RLS完全実装、ファイルアクセス制御
3. **型安全性**: `any`型禁止（unknown使用）
4. **アクセシビリティ**: WCAG 2.1 AA準拠
5. **レスポンシブ**: 1024px以上の画面で動作保証

### 禁止事項
- グローバルステートの乱用
- インラインスタイル（Tailwind CSS使用）
- 不必要な外部ライブラリ追加
- ハードコードされたURLや認証情報
- テストなしのPRマージ

## Governance

### 意思決定プロセス
- **技術選定**: 既存実装（omniclip）の実績を最優先
- **機能追加**: MVP完成後に検討
- **破壊的変更**: 憲法改定として記録

### 例外処理
- パフォーマンス劣化が証明された場合のみ、代替技術検討可
- セキュリティ脆弱性発見時は即座に対応

---

**Version**: 1.0.0  
**Ratified**: 2025-10-14  
**Next Review**: MVP完成時
