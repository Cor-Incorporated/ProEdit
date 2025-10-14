# 🎯 ProEdit MVP - 開発ステータス

**最終更新**: 2025年10月15日  
**現在の状態**: CRITICAL作業実施中  
**次のマイルストーン**: MVP要件達成（4-5時間）

---

## 📊 現在の完成度

```
実装完了: ████████████████████ 94% ✅
統合完了: █████████████░░░░░░░ 67% ⚠️
MVP要件:  ███████████████░░░░░ 87% ← 目標
```

### Constitutional要件ステータス
- ✅ FR-001 ~ FR-006: 達成
- 🚨 FR-007 (テキストオーバーレイ): **違反中**
- ✅ FR-008: 達成
- 🚨 FR-009 (自動保存): **違反中**
- ✅ FR-010 ~ FR-015: 達成

**MVP達成まで**: 2件のConstitutional違反解消が必須

---

## 🚨 今すぐやるべきこと（CRITICAL）

### 優先度1: FR-007違反解消（2-2.5時間）

#### タスク1: Timeline統合（45-60分）
**ファイル**: `stores/timeline.ts`

TextEffect対応を追加：
```typescript
import { isTextEffect } from '@/types/effects'

addEffect: (effect: Effect) => {
  set((state) => {
    // Text effectの場合、特別な処理
    if (isTextEffect(effect)) {
      // TextManagerに通知（後でCompositor統合時に使用）
      console.log('[Timeline] Text effect added:', effect.id)
    }
    
    return {
      effects: [...state.effects, effect],
      duration: Math.max(state.duration, effect.start_at_position + effect.duration)
    }
  })
}
```

**ファイル**: `features/timeline/components/TimelineClip.tsx`

テキストClip表示を追加：
```typescript
import { Type } from 'lucide-react'
import { isTextEffect } from '@/types/effects'

// Clip rendering
if (isTextEffect(effect)) {
  return (
    <div className="timeline-clip text-clip bg-purple-500/20 border-purple-500">
      <Type className="w-4 h-4" />
      <span className="text-xs truncate ml-1">
        {effect.properties.text}
      </span>
    </div>
  )
}
```

#### タスク2: Canvas統合（60-90分）
**ファイル**: `features/compositor/utils/Compositor.ts`

TextManager統合：
```typescript
import { TextManager } from '../managers/TextManager'
import { isTextEffect } from '@/types/effects'

export class Compositor {
  private textManager: TextManager

  constructor(app: PIXI.Application, getMediaFileUrl, fps: number) {
    // ... existing code ...
    
    // TextManager初期化
    this.textManager = new TextManager(
      app,
      async (effectId, updates) => {
        // Text effect更新時のコールバック
        console.log('[Compositor] Text effect updated:', effectId)
        // TODO: Server Actionを呼ぶ
      }
    )
  }

  async composeEffects(effects: Effect[], timecode: number): Promise<void> {
    const visibleEffects = this.getEffectsRelativeToTimecode(effects, timecode)
    
    // 既存のVideo/Image処理...
    
    // Text effect処理を追加
    for (const effect of visibleEffects) {
      if (isTextEffect(effect)) {
        if (!this.textManager.has(effect.id)) {
          await this.textManager.add_text_effect(effect)
        }
        this.textManager.addToStage(effect.id, effect.track, this.trackCount)
      }
    }
  }
}
```

**ファイル**: `app/editor/[projectId]/EditorClient.tsx`

TextEditorボタン追加：
```typescript
import { Type } from 'lucide-react'

// State追加
const [textEditorOpen, setTextEditorOpen] = useState(false)

// UI追加（Media Libraryボタンの隣）
<Button
  variant="outline"
  className="absolute top-4 left-56"
  onClick={() => setTextEditorOpen(true)}
>
  <Type className="h-4 w-4 mr-2" />
  Add Text
</Button>

// TextEditor追加（ExportDialogの後）
<TextEditor
  open={textEditorOpen}
  onOpenChange={setTextEditorOpen}
  projectId={project.id}
/>
```

---

### 優先度2: FR-009違反解消（2-2.5時間）

#### タスク3: AutoSave配線（90-120分）
**ファイル**: `stores/timeline.ts`

AutoSaveManager統合：
```typescript
import { AutoSaveManager } from '@/features/timeline/utils/autosave'

let autoSaveManager: AutoSaveManager | null = null

export const useTimelineStore = create<TimelineStore>()(
  devtools((set, get) => ({
    // ... existing state ...

    // 初期化メソッド追加
    initAutoSave: (projectId: string, onStatusChange: (status: SaveStatus) => void) => {
      if (!autoSaveManager) {
        autoSaveManager = new AutoSaveManager(projectId, onStatusChange)
        autoSaveManager.startAutoSave()
        console.log('[Timeline] AutoSave initialized')
      }
    },

    // 全ての変更操作に追加
    addEffect: (effect) => {
      set((state) => ({
        effects: [...state.effects, effect],
        duration: Math.max(state.duration, effect.start_at_position + effect.duration)
      }))
      autoSaveManager?.triggerSave() // ✅ 追加
    },

    updateEffect: (id, updates) => {
      set((state) => ({
        effects: state.effects.map(e => 
          e.id === id ? { ...e, ...updates } as Effect : e
        )
      }))
      autoSaveManager?.triggerSave() // ✅ 追加
    },

    removeEffect: (id) => {
      set((state) => ({
        effects: state.effects.filter(e => e.id !== id),
        selectedEffectIds: state.selectedEffectIds.filter(sid => sid !== id)
      }))
      autoSaveManager?.triggerSave() // ✅ 追加
    },

    // クリーンアップメソッド追加
    cleanup: () => {
      autoSaveManager?.cleanup()
      autoSaveManager = null
    }
  }))
)
```

**ファイル**: `features/timeline/utils/autosave.ts`

performSave実装を完成：
```typescript
import { updateEffect } from '@/app/actions/effects'
import { useTimelineStore } from '@/stores/timeline'

private async performSave(): Promise<void> {
  const timelineState = useTimelineStore.getState()
  
  try {
    // 全effectをDBに保存
    const savePromises = timelineState.effects.map(effect =>
      updateEffect(effect.id, {
        start_at_position: effect.start_at_position,
        duration: effect.duration,
        track: effect.track,
        properties: effect.properties,
      })
    )
    
    await Promise.all(savePromises)
    
    // localStorage保存（復旧用）
    const recoveryData = {
      timestamp: Date.now(),
      effects: timelineState.effects,
    }
    localStorage.setItem(
      `proedit_recovery_${this.projectId}`,
      JSON.stringify(recoveryData)
    )
    
    console.log('[AutoSave] Successfully saved', timelineState.effects.length, 'effects')
  } catch (error) {
    console.error('[AutoSave] Save failed:', error)
    throw error
  }
}
```

**ファイル**: `app/editor/[projectId]/EditorClient.tsx`

AutoSave初期化：
```typescript
// Phase 9: Auto-save state - 既存のuseStateは保持

useEffect(() => {
  // 既存のrecovery checkとrealtime syncは保持
  
  // ✅ AutoSave初期化を追加
  const { initAutoSave } = useTimelineStore.getState()
  initAutoSave(project.id, setSaveStatus)

  return () => {
    // ✅ クリーンアップを追加
    const { cleanup } = useTimelineStore.getState()
    cleanup()
    
    // 既存のクリーンアップは保持
    if (autoSaveManagerRef.current) {
      autoSaveManagerRef.current.cleanup()
    }
    if (syncManagerRef.current) {
      syncManagerRef.current.cleanup()
    }
  }
}, [project.id])
```

---

## ✅ 検証手順

### FR-007検証
```bash
1. npm run dev
2. プロジェクトを開く
3. "Add Text"ボタンクリック
4. テキスト入力して保存
5. ✅ Timeline上に紫色のテキストClipが表示される
6. ✅ Canvas上にテキストが表示される
7. ✅ テキストをドラッグして移動できる
```

### FR-009検証
```bash
1. npm run dev
2. プロジェクトを開く
3. Effectを追加/編集
4. ✅ SaveIndicatorが"saving"に変わる
5. 5秒待つ
6. ✅ SaveIndicatorが"saved"に戻る
7. ページをリフレッシュ
8. ✅ 変更が保存されている
```

---

## 📅 タイムライン

### 今日（CRITICAL）
```
09:00-11:30  FR-007修正（Timeline + Canvas統合）
13:00-15:00  FR-009修正（AutoSave配線）
15:00-15:30  統合テスト
15:30-16:00  検証・バグ修正

16:00 完了目標 ✅
```

### 明日以降（品質向上）
- Optimistic Updates実装（2時間）
- オフライン検出実装（1時間）
- セッション復元実装（1.5時間）

---

## 🆘 トラブルシューティング

### TextManagerが見つからない
```bash
# 確認
ls -la features/compositor/managers/TextManager.ts

# もし存在しない場合
git status  # 変更を確認
```

### TypeScriptエラーが出る
```bash
# 型チェック
npx tsc --noEmit

# PIXI.jsバージョン確認
npm list pixi.js
# 期待: pixi.js@7.4.2
```

### AutoSaveが動作しない
```typescript
// デバッグ: stores/timeline.ts
addEffect: (effect) => {
  console.log('[DEBUG] addEffect called:', effect.id)
  // ...
  autoSaveManager?.triggerSave()
  console.log('[DEBUG] triggerSave called')
}
```

---

## 📞 サポート

**質問・問題があれば**:
1. TypeScriptエラー → `npx tsc --noEmit`で確認
2. ビルドエラー → `npm run build`で確認
3. 動作確認 → 上記の検証手順を実行

**参考ドキュメント**:
- `COMPREHENSIVE_VERIFICATION_REPORT_2025-10-15.md` - 詳細な分析
- `specs/001-proedit-mvp-browser/` - 仕様書
- `features/*/README.md` - 各機能の説明

---

**ステータス**: 🚨 CRITICAL作業実施中  
**次の更新**: CRITICAL作業完了時

