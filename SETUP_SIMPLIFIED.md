# ProEdit - 1コマンドセットアップガイド

> **最新情報**: shadcn/ui v2では `npx shadcn@latest init` で Next.js プロジェクトの作成も可能

## 🚀 超高速セットアップ（推奨）

### ステップ1: プロジェクト初期化（1コマンド）

```bash
npx shadcn@latest init
```

**対話形式での選択肢**:

```
? Would you like to create a new project or initialize an existing one?
→ Create a new project

? What is your project named?
→ . (カレントディレクトリに作成)

? Which framework would you like to use?
→ Next.js

? Which style would you like to use?
→ New York

? Which color would you like to use as base color?
→ Zinc

? Would you like to use CSS variables for colors?
→ Yes

? Configure components.json?
→ Yes

? Write configuration to components.json?
→ Yes

? Are you using React Server Components?
→ Yes

? Write configuration to components.json?
→ Yes
```

**このコマンドで自動的に実行されること**:
- ✅ Next.js 15プロジェクト作成
- ✅ TypeScript設定
- ✅ Tailwind CSS設定
- ✅ shadcn/ui初期化
- ✅ components.json作成
- ✅ globals.css設定（CSS variables）
- ✅ utils.ts作成（cn helper）

### ステップ2: 必要なコンポーネントを一括インストール

```bash
# エディターUIに必要な全コンポーネント
npx shadcn@latest add button card dialog sheet tabs select scroll-area toast progress skeleton popover tooltip alert-dialog radio-group dropdown-menu context-menu menubar form slider switch checkbox label separator input badge command accordion
```

### ステップ3: 追加の依存関係をインストール

```bash
# Supabase
npm install @supabase/supabase-js @supabase/ssr

# State管理
npm install zustand

# 動画処理
npm install @ffmpeg/ffmpeg @ffmpeg/util
npm install pixi.js

# アイコン（lucide-react は shadcn/ui で自動インストール済み）

# 開発ツール
npm install -D @types/node vitest @playwright/test
```

### ステップ4: 環境変数設定

```bash
# .env.local.exampleを作成
cat > .env.local.example << 'EOF'
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Next.js設定
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF

# 実際の.env.localにSupabase認証情報をコピー
cp .env.local .env.local.example
# .env.localの値を実際のSupabase認証情報に置き換え
```

### ステップ5: ディレクトリ構造作成

```bash
# plan.mdの構造に従ってディレクトリ作成
mkdir -p app/{actions,api}
mkdir -p features/{timeline,compositor,media,effects,export}/{components,hooks,utils}
mkdir -p lib/{supabase,ffmpeg,pixi,utils}
mkdir -p stores
mkdir -p types
mkdir -p tests/{unit,integration,e2e}
mkdir -p public/workers
```

### ステップ6: Adobe Premiere Pro風テーマを適用

`app/globals.css`に追加:

```css
@layer base {
  :root {
    /* Adobe Premiere Pro風のダークテーマ */
    --background: 222.2 84% 4.9%;           /* 濃いグレー背景 */
    --foreground: 210 40% 98%;              /* 明るいテキスト */
    --card: 222.2 84% 10%;                  /* カード背景 */
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;          /* アクセントブルー */
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;        /* セカンダリーカラー */
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;            /* ミュート */
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;          /* 削除ボタン赤 */
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 217.2 91.2% 59.8%;
    --radius: 0.5rem;
  }
}

/* タイムライン専用スタイル */
.timeline-track {
  @apply bg-card border-b border-border;
}

.timeline-effect {
  @apply bg-primary/20 border border-primary rounded cursor-pointer;
  @apply hover:bg-primary/30 transition-colors;
}

.timeline-playhead {
  @apply absolute top-0 bottom-0 w-px bg-primary;
  @apply shadow-[0_0_10px_rgba(59,130,246,0.5)];
}
```

## 📊 所要時間

| ステップ | 従来のアプローチ | 新アプローチ | 時間短縮 |
|---------|----------------|------------|---------|
| Next.js初期化 | 5分 | - | - |
| shadcn/ui初期化 | 5分 | - | - |
| **統合初期化** | - | **2分** | **8分短縮** |
| コンポーネント追加 | 10分 | 3分 | 7分短縮 |
| 依存関係 | 5分 | 3分 | 2分短縮 |
| ディレクトリ構造 | 10分 | 2分 | 8分短縮 |
| テーマ設定 | 10分 | 5分 | 5分短縮 |
| **合計** | **45分** | **15分** | **30分短縮** |

## ✅ セットアップ完了チェックリスト

```bash
# プロジェクト構造確認
✓ package.json 存在
✓ next.config.ts 存在
✓ tsconfig.json 設定済み
✓ tailwind.config.ts 設定済み
✓ components.json 存在（shadcn/ui設定）
✓ components/ui/ ディレクトリ存在
✓ app/ ディレクトリ構造
✓ features/ ディレクトリ構造
✓ lib/ ディレクトリ構造
✓ stores/ ディレクトリ存在
✓ types/ ディレクトリ存在
✓ .env.local 設定済み

# 動作確認
npm run dev
# → http://localhost:3000 が起動すればOK
```

## 🎯 次のステップ

セットアップ完了後、以下を実行：

### Phase 2: Foundation（CRITICAL BLOCKING PHASE）

```bash
# T007-T021のタスクを実行
# Supabaseマイグレーション、型定義、基本レイアウト作成
```

詳細は`tasks.md`のPhase 2を参照。

## 🔧 トラブルシューティング

### エラー: "Cannot find module '@/components/ui/button'"

**原因**: tsconfig.jsonのpathsが正しく設定されていない

**解決**:
```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### エラー: "Tailwind CSS not working"

**原因**: globals.cssがインポートされていない

**解決**:
```typescript
// app/layout.tsx
import "./globals.css";
```

### エラー: "FFmpeg.wasm CORS error"

**原因**: SharedArrayBufferのヘッダーが設定されていない

**解決**:
```typescript
// next.config.ts
export default {
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        {
          key: 'Cross-Origin-Embedder-Policy',
          value: 'require-corp'
        },
        {
          key: 'Cross-Origin-Opener-Policy',
          value: 'same-origin'
        }
      ]
    }]
  }
}
```

## 📚 参考リンク

- [shadcn/ui Installation](https://ui.shadcn.com/docs/installation/next)
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Supabase Next.js Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

---

**このガイドに従えば、15分でProEditの開発環境が整います！** 🚀