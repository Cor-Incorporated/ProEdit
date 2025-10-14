# 🚨 緊急アクション要求 - 開発チームへ

**日付**: 2025年10月15日  
**優先度**: **CRITICAL - MVP Blocker**  
**所要時間**: **4-5時間**  
**期限**: **今日中に完了必須**

---

## 📊 現状の正確な評価

### 2つのレビュー結果の統合結論

#### レビュー1（AI Assistant）の評価
- タスク完了率: **87%**
- 評価: "両方の要件を高いレベルで達成"
- 判定: プロダクション準備完了 ✅

#### レビュー2（Specification Analyst）の評価
- タスク完了率: **94%**
- **機能動作率: 67%** ⚠️
- Constitutional違反: **2件（FR-007, FR-009）** 🚨
- 判定: MVP要件未達成 ❌

### 🎯 統合結論

**レビュー2が正しい評価です**

```
実装レベル: ████████████████████ 94% ✅ コードは存在する
統合レベル: █████████████░░░░░░░ 67% ❌ 配線されていない
問題：      ░░░░░░░░░░░░░░░░░░░░ 27% ← この部分がCRITICAL
```

**「コードが書かれている」≠「機能が動作する」**

---

## 🚨 Constitutional違反の詳細

### FR-007違反: テキストオーバーレイ機能

**要件**: "System MUST support text overlay creation with customizable styling properties"

**現状**:
```
✅ TextManager.ts: 737行のコード存在
✅ TextEditor.tsx: UI実装済み
✅ Server Actions: CRUD実装済み
❌ Timeline統合: なし
❌ Canvas表示: なし
❌ 呼び出し元: 0件
```

**結果**: ユーザーがテキストを追加できない 🚨

**証拠**:
```typescript
// features/compositor/managers/TextManager.ts
export class TextManager {
  async add_text_effect(effect: TextEffect, recreate = false): Promise<void> {
    // 737行の完璧な実装
  }
}

// しかし...
// grep -r "add_text_effect" app/ features/
// → 呼び出し元: 0件 ❌
```

---

### FR-009違反: 自動保存機能

**要件**: "System MUST auto-save project state every 5 seconds after changes"

**現状**:
```
✅ AutoSaveManager.ts: 196行のコード存在
✅ SaveIndicator.tsx: UI実装済み
✅ EditorClient: 初期化済み
❌ Zustand統合: なし
❌ save()呼び出し: 0件
❌ 実際の保存処理: 動作しない
```

**結果**: 自動保存が全く機能していない 🚨

**証拠**:
```typescript
// features/timeline/utils/autosave.ts
export class AutoSaveManager {
  async saveNow(): Promise<void> {
    // 196行の完璧な実装
  }
}

// しかし...
// stores/timeline.ts
addEffect: (effect) => set((state) => ({
  effects: [...state.effects, effect]
  // ❌ AutoSaveManager.triggerSave() の呼び出しなし
}))
```

---

## 🛠️ 必要な修正作業

### CRITICAL修正（MVP Blocker）

#### 1. FR-007修正: TextManager配線（2-2.5時間）

##### T077: Timeline統合（45-60分）

**ファイル**: `stores/timeline.ts`

```typescript
// 現在（動作しない）
addEffect: (effect: Effect) => set((state) => ({
  effects: [...state.effects, effect]
}))

// 修正後（動作する）
addEffect: (effect: Effect) => set((state) => {
  // Text effectの場合、TextManagerに通知
  if (effect.kind === 'text') {
    const textManager = getTextManagerInstance()
    if (textManager) {
      textManager.add_text_effect(effect as TextEffect)
        .catch(err => console.error('Failed to add text effect:', err))
    }
  }
  
  return {
    effects: [...state.effects, effect]
  }
})
```

**ファイル**: `features/timeline/components/TimelineClip.tsx`

```typescript
// Text effectの表示を追加
if (effect.kind === 'text') {
  return (
    <div className="timeline-clip text-clip" style={{...}}>
      <Type className="w-4 h-4" />
      <span className="text-xs truncate">
        {(effect as TextEffect).properties.text}
      </span>
    </div>
  )
}
```

##### T079: Canvas統合（60-90分）

**ファイル**: `features/compositor/utils/Compositor.ts`

```typescript
import { TextManager } from '../managers/TextManager'

export class Compositor {
  private textManager: TextManager

  constructor(...) {
    // ...existing code...
    this.textManager = new TextManager(app, this.updateTextEffect.bind(this))
  }

  async composeEffects(effects: Effect[], timecode: number): Promise<void> {
    // ...existing code...
    
    // テキストeffect処理を追加
    for (const effect of visibleEffects) {
      if (effect.kind === 'text') {
        const textEffect = effect as TextEffect
        if (!this.textManager.has(textEffect.id)) {
          await this.textManager.add_text_effect(textEffect)
        }
        this.textManager.addToStage(textEffect.id, textEffect.track, trackCount)
      }
    }
  }

  private async updateTextEffect(effectId: string, updates: Partial<TextEffect>) {
    // Server Actionを呼び出し
    await updateTextPosition(effectId, updates.properties?.rect)
  }
}
```

**ファイル**: `app/editor/[projectId]/EditorClient.tsx`

```typescript
// TextEditorボタンとダイアログを追加
const [textEditorOpen, setTextEditorOpen] = useState(false)
const [selectedTextEffect, setSelectedTextEffect] = useState<TextEffect | null>(null)

// UI
<Button 
  variant="outline"
  className="absolute top-4 left-48"
  onClick={() => setTextEditorOpen(true)}
>
  <Type className="h-4 w-4 mr-2" />
  Add Text
</Button>

<TextEditor
  open={textEditorOpen}
  onOpenChange={setTextEditorOpen}
  effect={selectedTextEffect}
  onUpdate={async (updates) => {
    if (selectedTextEffect) {
      await updateTextEffect(selectedTextEffect.id, updates)
      // Timeline store更新
      updateEffect(selectedTextEffect.id, updates)
    }
  }}
/>
```

---

#### 2. FR-009修正: AutoSave配線（2-2.5時間）

**ファイル**: `stores/timeline.ts`

```typescript
import { AutoSaveManager } from '@/features/timeline/utils/autosave'

// グローバルインスタンス
let autoSaveManager: AutoSaveManager | null = null

export const useTimelineStore = create<TimelineStore>()(
  devtools((set, get) => ({
    // ...existing state...

    // 初期化（EditorClientから呼ぶ）
    initAutoSave: (projectId: string, onStatusChange: (status: SaveStatus) => void) => {
      if (!autoSaveManager) {
        autoSaveManager = new AutoSaveManager(projectId, onStatusChange)
        autoSaveManager.startAutoSave()
      }
    },

    // 全ての変更操作でtriggerSave()を呼ぶ
    addEffect: (effect) => {
      set((state) => ({
        effects: [...state.effects, effect]
      }))
      autoSaveManager?.triggerSave() // ✅ 追加
    },

    updateEffect: (id, updates) => {
      set((state) => ({
        effects: state.effects.map(e => e.id === id ? { ...e, ...updates } : e)
      }))
      autoSaveManager?.triggerSave() // ✅ 追加
    },

    removeEffect: (id) => {
      set((state) => ({
        effects: state.effects.filter(e => e.id !== id)
      }))
      autoSaveManager?.triggerSave() // ✅ 追加
    },

    // クリーンアップ
    cleanup: () => {
      autoSaveManager?.cleanup()
      autoSaveManager = null
    }
  }))
)
```

**ファイル**: `features/timeline/utils/autosave.ts`

```typescript
// performSave()の実装を完成させる
private async performSave(): Promise<void> {
  const timelineState = useTimelineStore.getState()
  
  // ✅ 実際にDBに保存
  for (const effect of timelineState.effects) {
    await updateEffect(effect.id, {
      start_at_position: effect.start_at_position,
      duration: effect.duration,
      track: effect.track,
      properties: effect.properties,
    })
  }
  
  // localStorage保存（復旧用）
  const recoveryData = {
    timestamp: Date.now(),
    effects: timelineState.effects,
  }
  localStorage.setItem(
    `proedit_recovery_${this.projectId}`,
    JSON.stringify(recoveryData)
  )
}
```

---

## ✅ 検証手順

### FR-007検証（テキスト機能）
```bash
1. npm run dev
2. プロジェクトを開く
3. "Add Text"ボタンをクリック
4. テキストを入力
5. Timeline上にテキストClipが表示されることを確認 ✅
6. Canvas上にテキストが表示されることを確認 ✅
7. テキストをドラッグして移動できることを確認 ✅
```

### FR-009検証（自動保存）
```bash
1. npm run dev
2. プロジェクトを開く
3. Effectを追加/編集/削除
4. SaveIndicatorが"saving"に変わることを確認 ✅
5. 5秒待つ
6. SaveIndicatorが"saved"に戻ることを確認 ✅
7. ブラウザをリフレッシュ
8. 変更が保存されていることを確認 ✅
```

---

## 📅 タイムライン

### 今日中に完了必須
```
09:00-11:00  T077 + T079（TextManager配線）
13:00-15:00  AutoSave配線
15:00-15:30  統合テスト
15:30-16:00  検証・修正

16:00 完了目標
```

### 完了後の状態
```
Constitutional違反: 2件 → 0件 ✅
機能動作率: 67% → 87% ✅
MVP要件: 未達成 → 達成 ✅
リリース可能: NO → YES ✅
```

---

## 🎯 開発チームへのメッセージ

### 現状認識
1. **実装品質は優秀**: TypeScript 0エラー、コードは正確
2. **統合作業が未完了**: 配線が抜けている
3. **MVP要件未達成**: 2つの必須機能が動作していない

### 今日やるべきこと
1. ✅ TextManagerを配線（2時間）
2. ✅ AutoSaveManagerを配線（2時間）
3. ✅ 検証（30分）

**合計: 4.5時間で完了可能** 🚀

### なぜCRITICALなのか
- Constitutional要件（FR-007, FR-009）は **"MUST"** 要件
- この2つなしではMVPとしてリリースできない
- コードは存在するので、配線作業のみ（難易度は高くない）
- **今日中に完了すれば、明日からMVPリリース可能**

### 次のステップ
1. この指示書を読む（5分）
2. CRITICAL作業を開始（4時間）
3. 検証（30分）
4. **MVP達成** 🎉

---

**作成者**: Development Review Team  
**最終更新**: 2025年10月15日  
**ステータス**: **即座実行要求** 🚨

