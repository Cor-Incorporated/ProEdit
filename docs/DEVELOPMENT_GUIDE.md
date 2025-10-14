# ProEdit 開発ガイド

> **対象**: 開発チームメンバー  
> **最終更新**: 2025-10-14

---

## 🚀 開発開始手順

### **1. プロジェクトセットアップ**

```bash
# リポジトリクローン
git clone <repository-url>
cd proedit

# 依存関係インストール
npm install

# 環境変数設定
cp .env.local.example .env.local
# → Supabase認証情報を.env.localに追加

# データベースマイグレーション
supabase db push

# 開発サーバー起動
npm run dev
```

### **2. 開発ワークフロー**

```bash
# 1. タスク選択
# specs/001-proedit-mvp-browser/tasks.md から選択

# 2. 実装指示書確認
# docs/phase*/PHASE*_IMPLEMENTATION_DIRECTIVE.md を読む

# 3. omniclip参照
# vendor/omniclip/s/ で該当ロジックを確認

# 4. 実装
# 型チェックを実行しながら実装
npm run type-check

# 5. テスト作成・実行
npm run test

# 6. コミット
git add .
git commit -m "feat: implement <task-name>"
```

---

## 📁 ディレクトリ構造ガイド

### **コードの配置場所**

| 種類             | 配置場所                         | 例                            |
|------------------|----------------------------------|-------------------------------|
| Reactコンポーネント（UI） | `features/<feature>/components/` | `MediaCard.tsx`               |
| ビジネスロジック         | `features/<feature>/utils/`      | `placement.ts`                |
| React Hooks      | `features/<feature>/hooks/`      | `useMediaUpload.ts`           |
| Manager Classes  | `features/<feature>/managers/`   | `VideoManager.ts`             |
| Server Actions   | `app/actions/`                   | `effects.ts`                  |
| Zustand Store    | `stores/`                        | `compositor.ts`               |
| 型定義           | `types/`                         | `effects.ts`                  |
| ページ              | `app/`                           | `editor/[projectId]/page.tsx` |

### **命名規則**

- **コンポーネント**: PascalCase + `.tsx` (`MediaCard.tsx`)
- **Hooks**: camelCase + `use` prefix (`useMediaUpload.ts`)
- **Utils/Classes**: PascalCase + `.ts` (`Compositor.ts`)
- **Server Actions**: camelCase + `.ts` (`effects.ts`)
- **Types**: PascalCase interface (`VideoEffect`)

---

## 🎯 omniclip参照方法

### **omniclipコードの探し方**

1. **機能から探す**:
   ```bash
   # Timeline配置ロジック
   vendor/omniclip/s/context/controllers/timeline/
   
   # Compositor（レンダリング）
   vendor/omniclip/s/context/controllers/compositor/
   
   # メディア管理
   vendor/omniclip/s/context/controllers/media/
   
   # エクスポート
   vendor/omniclip/s/context/controllers/video-export/
   ```

2. **型定義**:
   ```bash
   vendor/omniclip/s/context/types.ts
   ```

3. **UIコンポーネント**（参考のみ）:
   ```bash
   vendor/omniclip/s/components/
   ```

### **omniclipコード移植時の注意**

1. **PIXI.js v7 → v8**:
   ```typescript
   // omniclip (v7)
   const app = new PIXI.Application({ width, height })
   
   // ProEdit (v8)
   const app = new PIXI.Application()
   await app.init({ width, height })  // ✅ 非同期
   ```

2. **@benev/slate → Zustand**:
   ```typescript
   // omniclip
   this.actions.set_effect_position(effect, position)
   
   // ProEdit
   updateEffect(effectId, { start_at_position: position })  // ✅ Server Action
   ```

3. **Lit Elements → React**:
   ```typescript
   // omniclip (Lit)
   return html`<div>${content}</div>`
   
   // ProEdit (React)
   return <div>{content}</div>  // ✅ JSX
   ```

---

## 🧪 テスト戦略

### **テストの種類**

1. **ユニットテスト** (`tests/unit/`)
   - ビジネスロジックのテスト
   - 例: placement logic, hash calculation

2. **統合テスト** (`tests/integration/`)
   - コンポーネント間の連携テスト
   - 例: MediaCard → Timeline追加フロー

3. **E2Eテスト** (`tests/e2e/`)
   - エンドツーエンドシナリオ
   - 例: ログイン → アップロード → 編集 → エクスポート

### **テスト作成ガイドライン**

```typescript
// tests/unit/example.test.ts
import { describe, it, expect } from 'vitest'
import { functionToTest } from '@/features/module/utils/function'

describe('FunctionName', () => {
  it('should do something when condition', () => {
    // Arrange
    const input = { /* ... */ }
    
    // Act
    const result = functionToTest(input)
    
    // Assert
    expect(result).toBe(expectedValue)
  })
})
```

**カバレッジ目標**: 70%以上（Constitution要件）

---

## 🔧 便利なコマンド

### **開発中**

```bash
# 型チェック（リアルタイム）
npm run type-check

# テスト（ウォッチモード）
npm run test:watch

# Lint修正
npm run lint -- --fix

# フォーマット
npm run format
```

### **デバッグ**

```bash
# Supabaseローカル起動
supabase start

# データベースリセット
supabase db reset

# マイグレーション生成
supabase migration new <migration-name>

# 型生成（Supabase）
supabase gen types typescript --local > types/supabase.ts
```

---

## 📊 コード品質チェックリスト

実装完了時に確認:

```bash
[ ] TypeScriptエラー0件
    npm run type-check

[ ] Lintエラー0件
    npm run lint

[ ] テスト全パス
    npm run test

[ ] フォーマット済み
    npm run format:check

[ ] ビルド成功
    npm run build

[ ] ブラウザ動作確認
    npm run dev → 手動テスト
```

---

## 🎯 Phase別実装ガイド

### **Phase 5（現在）: Real-time Preview**

**目標**: 60fps プレビュー実装  
**omniclip参照**: `compositor/controller.ts`  
**推定時間**: 15時間  
**詳細**: `docs/phase5/PHASE5_IMPLEMENTATION_DIRECTIVE.md`

**主要タスク**:
1. Compositor Class
2. VideoManager
3. ImageManager
4. Playback Loop
5. UI Controls

### **Phase 6（次）: Editing Operations**

**目標**: Drag/Drop、Trim、Split実装  
**omniclip参照**: `timeline/parts/drag-related/`  
**推定時間**: 12時間

**追加必要機能**（Phase 4から持ち越し）:
- `#adjustStartPosition` メソッド
- `calculateDistanceToBefore/After` メソッド

---

## 💡 実装のベストプラクティス

### **1. omniclip準拠を最優先**

```typescript
// ✅ GOOD: omniclipのロジックを忠実に移植
const spaceBetween = utilities.calculateSpaceBetween(effectBefore, effectAfter)
if (spaceBetween < effect.duration && spaceBetween > 0) {
  shrinkedDuration = spaceBetween  // omniclip準拠
}

// ❌ BAD: 独自解釈で変更
const spaceBetween = effectAfter.start - effectBefore.end
if (spaceBetween < effect.duration) {
  // 独自ロジック（omniclip非準拠）
}
```

### **2. 型安全性を維持**

```typescript
// ✅ GOOD: 型ガードを使用
if (isVideoEffect(effect)) {
  const thumbnail = effect.thumbnail  // 型安全
}

// ❌ BAD: any使用
const thumbnail = (effect as any).thumbnail  // 型安全でない
```

### **3. エラーハンドリング**

```typescript
// ✅ GOOD: try-catch + toast
try {
  await createEffect(projectId, effect)
  toast.success('Effect created')
} catch (error) {
  toast.error('Failed to create effect', {
    description: error instanceof Error ? error.message : 'Unknown error'
  })
}
```

### **4. コメント**

```typescript
// ✅ GOOD: omniclip参照を記載
/**
 * Calculate space between two effects
 * Ported from omniclip: effect-placement-utilities.ts:15-17
 */
calculateSpaceBetween(effectBefore: Effect, effectAfter: Effect): number {
  // ...
}
```

---

## 🚨 避けるべき実装パターン

### **❌ NGパターン**

1. **omniclipロジックを独自解釈で変更**
   - omniclipは実績あり。変更は最小限に
   
2. **型エラーを無視**
   - `as any`の多用は禁止
   
3. **テストをスキップ**
   - 主要ロジックは必ずテスト作成

4. **Server Actionsで認証チェック省略**
   - セキュリティリスク

5. **RLSポリシー無視**
   - マルチテナントで問題発生

---

## 📞 サポート

### **質問・相談先**

- **omniclipロジック**: `vendor/omniclip/`を直接確認
- **Phase実装指示**: `docs/phase*/` 実装指示書
- **型定義**: `types/`ディレクトリ
- **データベース**: `supabase/migrations/`

### **デバッグTips**

```typescript
// Compositorデバッグ
console.log('Compositor timecode:', compositor.getTimecode())
console.log('Effects count:', effects.length)
console.log('FPS:', actualFps)

// Effect配置デバッグ
console.log('Placement:', calculateProposedTimecode(effect, position, track, effects))
```

---

## 🎉 開発チームへ

Phase 4の完璧な実装、本当にお疲れ様でした！

**Phase 5は MVPの心臓部**です。omniclipのCompositorを正確に移植し、60fpsの高品質プレビューを実現しましょう！

このガイドと実装指示書があれば、自信を持って進められます。

**Let's build something amazing!** 🚀

---

**作成日**: 2025-10-14  
**管理者**: Technical Review Team

