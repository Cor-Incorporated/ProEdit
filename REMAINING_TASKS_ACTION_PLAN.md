# 🚨 CRITICAL: 残タスクとアクションプラン
**作成日**: 2025年10月15日  
**機能動作率**: 67%（タスク完了率: 94%）  
**Constitutional違反**: 2件（FR-007, FR-009）  
**MVP要件達成まで**: **5時間の統合作業が必須** 🚨

---

## ⚠️ 重要な認識

### 現状の問題
```
実装完了: ████████████████████ 94% ✅ コードは書かれている
統合完了: █████████████░░░░░░░ 67% ❌ 配線されていない
差分：    ░░░░░░░░░░░░░░░░░░░░ 27% ← この部分がCRITICAL
```

**「タスク完了」≠「機能動作」**
- TextManagerは737行のコードが存在する
- しかし、呼び出し元が0件で動作しない
- AutoSaveManagerも同様の状態

### Constitutional違反の重大性
1. **FR-007**: テキストオーバーレイ必須 → **動作しない**
2. **FR-009**: 5秒ごとの自動保存必須 → **動作しない**

**この2つを解決しないとMVPリリース不可** 🚨

---

## 🚨 優先度: CRITICAL（MVP要件 - 即座に実行必須）

### Constitutional違反修正

#### FR-007違反の修正: テキストオーバーレイ統合

現在の問題:
- ✅ TextManager: 737行のコード存在
- ❌ 呼び出し元: 0件
- ❌ Timeline統合: なし
- ❌ Canvas表示: なし
- **結果**: ユーザーがテキストを追加できない

---

#### 📋 T077: テキストEffectをTimelineに表示 🚨
**Constitutional要件**: FR-007  
**状態**: 未実装（統合作業）  
**推定時間**: 45-60分  
**依存関係**: なし（実装済み、配線のみ）  
**重要度**: **CRITICAL - MVP Blocker**

**実装手順**:

1. **stores/timeline.ts** - TextEffect対応追加
```typescript
addEffect: (effect: Effect) => {
  // Text effectもサポート
  if (effect.kind === 'text') {
    // TextManager統合ロジック追加
  }
  set((state) => ({
    effects: [...state.effects, effect],
    duration: Math.max(
      state.duration,
      effect.start_at_position + effect.duration
    )
  }))
}
```

2. **features/timeline/components/TimelineClip.tsx** - テキストClip表示
```typescript
// テキストEffectの場合の特別な表示
if (effect.kind === 'text') {
  return (
    <div className="timeline-clip text-clip">
      <TextIcon />
      <span>{effect.properties.text}</span>
    </div>
  )
}
```

3. **app/editor/[projectId]/EditorClient.tsx** - TextEditor統合
```typescript
// TextEditorコンポーネントを追加
import { TextEditor } from '@/features/effects/components/TextEditor'

// Stateに追加
const [textEditorOpen, setTextEditorOpen] = useState(false)
const [selectedTextEffect, setSelectedTextEffect] = useState<TextEffect | null>(null)

// UI追加
<Button onClick={() => setTextEditorOpen(true)}>
  Add Text
</Button>

<TextEditor
  open={textEditorOpen}
  onOpenChange={setTextEditorOpen}
  effect={selectedTextEffect}
/>
```

**検証方法**:
```bash
# 1. テキストEffect作成
# 2. Timelineに表示されることを確認
# 3. ドラッグ&ドロップ動作確認
```

---

---

#### 📋 T079: Canvas上でのリアルタイム編集統合 🚨
**Constitutional要件**: FR-007  
**状態**: 未実装（統合作業）  
**推定時間**: 60-90分  
**依存関係**: T077完了推奨（並行実装可能）  
**重要度**: **CRITICAL - MVP Blocker**

**実装手順**:

1. **features/compositor/utils/Compositor.ts** - TextManager統合
```typescript
import { TextManager } from '../managers/TextManager'

export class Compositor {
  private textManager: TextManager

  constructor(...) {
    // ...
    this.textManager = new TextManager(app, this.updateTextEffect.bind(this))
  }

  async composeEffects(effects: Effect[], timecode: number): Promise<void> {
    // テキストEffect処理追加
    for (const effect of visibleEffects) {
      if (effect.kind === 'text') {
        await this.textManager.add_text_effect(effect)
        this.textManager.addToStage(effect.id, effect.track, trackCount)
      }
    }
  }

  private async updateTextEffect(effectId: string, updates: Partial<TextEffect>) {
    // Server Actionを呼び出し
    await updateTextPosition(effectId, updates.properties.rect)
  }
}
```

2. **EditorClient.tsx** - TextEditorとCanvas連携
```typescript
// TextEditorで変更があった場合
const handleTextUpdate = async (updates: Partial<TextEffect>) => {
  if (compositorRef.current && selectedTextEffect) {
    // Compositorに通知
    await compositorRef.current.updateTextEffect(
      selectedTextEffect.id,
      updates
    )
    
    // TimelineStore更新
    updateEffect(selectedTextEffect.id, updates)
  }
}

<TextEditor
  effect={selectedTextEffect}
  onUpdate={handleTextUpdate}
/>
```

**検証方法**:
```bash
# 1. テキストEffect選択
# 2. TextEditorで編集
# 3. Canvas上でリアルタイム更新確認
# 4. 変形・移動・スタイル変更確認
```

---

---

#### 🚨 CRITICAL配線作業: AutoSaveManagerとZustandの統合
**Constitutional要件**: FR-009  
**状態**: 未実装（配線作業）  
**推定時間**: 90-120分  
**重要度**: **CRITICAL - MVP Blocker**

現在の問題:
- ✅ AutoSaveManager: 196行のコード存在
- ❌ save()呼び出し: 0件
- ❌ Zustand統合: なし
- **結果**: 自動保存が全く機能していない

**実装手順**:

1. **stores/timeline.ts** - AutoSave統合
```typescript
import { AutoSaveManager } from '@/features/timeline/utils/autosave'

// グローバルインスタンス（プロジェクトごとに1つ）
let autoSaveManagerInstance: AutoSaveManager | null = null

export const useTimelineStore = create<TimelineStore>()(
  devtools(
    (set, get) => ({
      // ... existing state ...

      // Initialize auto-save (call from EditorClient)
      initAutoSave: (projectId: string) => {
        if (!autoSaveManagerInstance) {
          autoSaveManagerInstance = new AutoSaveManager(projectId)
          autoSaveManagerInstance.startAutoSave()
        }
      },

      // Trigger save on any change
      addEffect: (effect) => {
        set((state) => {
          const newState = {
            effects: [...state.effects, effect],
            duration: Math.max(state.duration, effect.start_at_position + effect.duration)
          }
          
          // ✅ CRITICAL: Trigger auto-save
          autoSaveManagerInstance?.triggerSave()
          
          return newState
        })
      },

      updateEffect: (id, updates) => {
        set((state) => ({
          effects: state.effects.map(e =>
            e.id === id ? { ...e, ...updates } as Effect : e
          )
        }))
        
        // ✅ CRITICAL: Trigger auto-save
        autoSaveManagerInstance?.triggerSave()
      },

      removeEffect: (id) => {
        set((state) => ({
          effects: state.effects.filter(e => e.id !== id),
          selectedEffectIds: state.selectedEffectIds.filter(sid => sid !== id)
        }))
        
        // ✅ CRITICAL: Trigger auto-save
        autoSaveManagerInstance?.triggerSave()
      },

      // Cleanup
      cleanup: () => {
        autoSaveManagerInstance?.cleanup()
        autoSaveManagerInstance = null
      }
    })
  )
)
```

2. **features/timeline/utils/autosave.ts** - Save実装追加
```typescript
private async performSave(): Promise<void> {
  const timelineState = useTimelineStore.getState()
  
  // Save effects to database
  for (const effect of timelineState.effects) {
    await updateEffect(effect.id, {
      start_at_position: effect.start_at_position,
      duration: effect.duration,
      track: effect.track,
      // ... other properties
    })
  }
  
  // Save to localStorage for recovery
  const recoveryData = {
    timestamp: Date.now(),
    effects: timelineState.effects,
  }
  localStorage.setItem(`proedit_recovery_${this.projectId}`, JSON.stringify(recoveryData))
  
  console.log('[AutoSave] Saved successfully')
}
```

3. **EditorClient.tsx** - 初期化
```typescript
useEffect(() => {
  // Initialize auto-save
  const { initAutoSave } = useTimelineStore.getState()
  initAutoSave(project.id)

  return () => {
    const { cleanup } = useTimelineStore.getState()
    cleanup()
  }
}, [project.id])
```

**検証方法**:
```bash
# 1. Effectを追加/編集/削除
# 2. SaveIndicatorが"saving"に変わることを確認
# 3. 5秒待つ
# 4. ページリフレッシュ
# 5. 変更が保存されていることを確認
```

---

## 🎯 優先度: HIGH（CRITICALの後に実施）

### Phase 9: 自動保存追加機能

#### 📋 T098: Optimistic Updates実装
**状態**: 未完了  
**推定時間**: 2時間  
**依存関係**: AutoSave配線完了後  
**優先度**: HIGH（CRITICAL後）

**実装手順**:

1. **stores/timeline.ts** - Optimistic Update追加
```typescript
updateEffect: (id, updates) => {
  // Optimistic update
  set((state) => ({
    effects: state.effects.map(e =>
      e.id === id ? { ...e, ...updates } : e
    )
  }))

  // Server update (background)
  updateEffectInDB(id, updates).catch((error) => {
    // Rollback on error
    console.error('Update failed, rolling back', error)
    // Revert state
  })
}
```

2. **app/actions/effects.ts** - エラーハンドリング強化
```typescript
export async function updateEffect(
  effectId: string,
  updates: Partial<Effect>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('effects')
      .update(updates)
      .eq('id', effectId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}
```

**検証方法**:
```bash
# 1. Effectを編集
# 2. 即座にUI反映確認
# 3. ネットワークオフライン状態でエラーハンドリング確認
```

---

#### 📋 T099: オフライン検出ロジック
**状態**: 未完了  
**推定時間**: 1時間  
**依存関係**: なし

**実装手順**:

1. **features/timeline/utils/autosave.ts** - ネットワーク検出追加
```typescript
private setupOnlineDetection(): void {
  // Online/Offline event listeners
  window.addEventListener('online', () => {
    console.log('[AutoSave] Back online, processing queue')
    this.isOnline = true
    this.processOfflineQueue()
  })

  window.addEventListener('offline', () => {
    console.log('[AutoSave] Offline detected')
    this.isOnline = false
    this.onStatusChange?.('offline')
  })

  // Initial state
  this.isOnline = navigator.onLine
}

private async processOfflineQueue(): Promise<void> {
  if (this.offlineQueue.length === 0) return

  console.log(`[AutoSave] Processing ${this.offlineQueue.length} queued operations`)

  for (const operation of this.offlineQueue) {
    try {
      await operation()
    } catch (error) {
      console.error('[AutoSave] Failed to process queued operation', error)
    }
  }

  this.offlineQueue = []
  this.onStatusChange?.('saved')
}
```

**検証方法**:
```bash
# 1. ブラウザDevTools → Network → Offline
# 2. 編集操作実行
# 3. SaveIndicatorが"offline"表示を確認
# 4. Online復帰 → 自動保存確認
```

---

#### 📋 T100: セッション復元ロジック
**状態**: 未完了  
**推定時間**: 1.5時間  
**依存関係**: なし

**実装手順**:

1. **EditorClient.tsx** - セッション復元強化
```typescript
useEffect(() => {
  const recoveryKey = `proedit_recovery_${project.id}`
  const recoveryData = localStorage.getItem(recoveryKey)

  if (recoveryData) {
    try {
      const parsed = JSON.parse(recoveryData)
      const timestamp = parsed.timestamp
      const effects = parsed.effects

      // 5分以内のデータのみ復元
      if (Date.now() - timestamp < 5 * 60 * 1000) {
        setShowRecoveryModal(true)
        setRecoveryData(effects)
      } else {
        // 古いデータは削除
        localStorage.removeItem(recoveryKey)
      }
    } catch (error) {
      console.error('[Recovery] Failed to parse recovery data', error)
      localStorage.removeItem(recoveryKey)
    }
  }
}, [project.id])

const handleRecover = async () => {
  if (recoveryData) {
    // Restore effects to store
    setEffects(recoveryData)
    
    // Save to server
    for (const effect of recoveryData) {
      await updateEffect(effect.id, effect)
    }
    
    toast.success('Session recovered successfully')
  }
  localStorage.removeItem(`proedit_recovery_${project.id}`)
  setShowRecoveryModal(false)
}
```

2. **AutoSaveManager** - localStorage保存強化
```typescript
private async performSave(): Promise<void> {
  const timelineState = useTimelineStore.getState()
  const recoveryKey = `proedit_recovery_${this.projectId}`

  // Save to localStorage for recovery
  const recoveryData = {
    timestamp: Date.now(),
    effects: timelineState.effects,
  }
  localStorage.setItem(recoveryKey, JSON.stringify(recoveryData))

  // Save to server
  // ...
}
```

**検証方法**:
```bash
# 1. 編集作業
# 2. ブラウザをクラッシュさせる（強制終了）
# 3. 再度開く
# 4. RecoveryModal表示確認
# 5. Recover → データ復元確認
```

---

## 🎯 優先度: LOW（オプショナル）

### Phase 10: ポリッシュ&最終調整

#### 📋 T101-T110: ポリッシュタスク
**状態**: 未着手  
**推定時間**: 8-12時間（全体）

**タスクリスト**:
- [ ] T101: Loading states追加
- [ ] T102: エラーハンドリング強化
- [ ] T103: Tooltip追加
- [ ] T104: パフォーマンス最適化
- [ ] T105: キーボードショートカットヘルプ
- [ ] T106: オンボーディングツアー
- [ ] T107: セキュリティ監査
- [ ] T108: アナリティクス追加
- [ ] T109: ブラウザ互換性テスト
- [ ] T110: デプロイ最適化

**優先順位**:
1. T102 (エラーハンドリング)
2. T104 (パフォーマンス)
3. T107 (セキュリティ)
4. その他（ユーザーフィードバック次第）

---

## 📊 作業見積もり（改訂版）

### 🚨 CRITICAL（MVP Blocker - 即座実行必須）
| タスク                        | 時間        | Constitutional  | 優先度      |
|----------------------------|------------|-----------------|-------------|
| T077 - Timeline統合        | 45-60分     | FR-007違反      | CRITICAL    |
| T079 - Canvas統合          | 60-90分     | FR-007違反      | CRITICAL    |
| AutoSave配線 - Zustand統合 | 90-120分    | FR-009違反      | CRITICAL    |
| 統合テスト                    | 30分        | -               | CRITICAL    |
| **合計（MVP要件）**          | **4-5時間** | **2件違反解消** | **BLOCKER** |

### 📈 HIGH（CRITICAL完了後）
| タスク      | 時間        | 依存           |
|----------|-----------|----------------|
| T098     | 2時間       | AutoSave配線後 |
| T099     | 1時間       | なし             |
| T100     | 1.5時間     | なし             |
| **合計** | **4.5時間** | -              |

### 📌 MEDIUM（品質向上）
| タスク       | 時間     | 依存 |
|-----------|--------|------|
| T101-T110 | 8-12時間 | なし   |

**MVPリリースまで**: **4-5時間（CRITICAL のみ）** 🚨  
**品質向上含む**: **8-9時間（CRITICAL + HIGH）**  
**完全完成**: **16-21時間（全タスク）**

---

## 🚀 推奨実行順序（改訂版）

### 🚨 CRITICAL優先（MVP Blocker - 今日中に完了必須）

#### セッション1: FR-007違反修正（2-2.5時間）
```
09:00-09:45  T077実装（Timeline統合）
09:45-11:15  T079実装（Canvas統合）
11:15-11:30  テキスト機能テスト
```
**成果物**: テキストオーバーレイ機能が動作 ✅

#### セッション2: FR-009違反修正（2-2.5時間）
```
13:00-14:30  AutoSave配線（Zustand統合）
14:30-15:00  統合テスト・検証
```
**成果物**: 自動保存機能が動作 ✅

#### デイリーゴール
```
1日目終了時: MVP要件達成（Constitutional違反解消）
             → リリース可能な状態
```

---

### 📈 HIGH優先（翌日以降 - 品質向上）

#### Day 2: Optimistic Updates（3時間）
```
09:00-11:00  T098実装
11:00-12:00  テスト
```

#### Day 3: オフライン・復元機能（2.5時間）
```
09:00-10:00  T099実装
10:00-11:30  T100実装
```

---

### 📌 オプショナル（ユーザーフィードバック後）
- Phase 10ポリッシュタスク（1-2週間）
- パフォーマンス最適化
- UI/UX改善

---

## ✅ 完了後の状態

### CRITICAL完了後（4-5時間後）
```
機能動作率: █████████████████░░░ 87% → MVP要件達成
Constitutional違反: 2件 → 0件 ✅

Phase 1-6:  ████████████████████ 100%
Phase 7:    ████████████████████ 100% ← T077, T079完了
Phase 8:    ████████████████████ 100%
Phase 9:    ████████████████░░░░  87% ← AutoSave配線完了
Phase 10:   ░░░░░░░░░░░░░░░░░░░░   0%
```

**MVP要件**: ✅ 達成（FR-007, FR-009解消）  
**リリース可能**: ✅ YES

---

### HIGH完了後（追加4.5時間）
```
機能動作率: ████████████████████ 95%

Phase 9:    ████████████████████ 100% ← T098, T099, T100完了
```

**品質**: プロダクショングレード

---

### デプロイチェックリスト

#### CRITICAL完了時点
- ✅ TypeScriptエラー: 0
- ✅ ビルド: 成功
- ✅ 主要機能: 完全動作
- ✅ テキスト編集: **動作** ← NEW
- ✅ 自動保存: **動作** ← NEW
- ✅ Constitutional要件: 達成

**→ MVPとしてリリース可能** 🚀

#### HIGH完了時点
- ✅ 上記すべて
- ✅ Optimistic Updates: 動作
- ✅ オフライン対応: 動作
- ✅ セッション復元: 動作

**→ プロダクションレディ** 🎉

---

## 📞 サポート情報

**質問・問題があれば**:
1. このドキュメントを参照
2. `COMPREHENSIVE_VERIFICATION_REPORT_2025-10-15.md`を参照
3. コードコメントを確認（omniclip行番号付き）

**次のマイルストーン**:
- [ ] T077, T079完了（テキスト統合）
- [ ] T098, T099, T100完了（自動保存統合）
- [ ] E2Eテスト実施
- [ ] プロダクションデプロイ

---

**作成者**: AI Development Assistant  
**最終更新**: 2025年10月15日  
**ステータス**: アクション準備完了 🚀

