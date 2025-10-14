# Phase 5 クイックスタートガイド

> **対象**: Phase 5実装担当者  
> **所要時間**: 15時間（3-4日）  
> **前提**: Phase 4完了確認済み

---

## 🚀 実装開始前チェック

### **✅ Phase 4完了確認**

```bash
# 1. 型チェック
npx tsc --noEmit
# → エラー0件であることを確認 ✅

# 2. テスト実行
npm run test
# → Timeline tests 12/12成功を確認 ✅

# 3. データベース確認
# Supabase SQL Editor で実行:
SELECT column_name FROM information_schema.columns WHERE table_name = 'effects';
# → start, end, file_hash, name, thumbnail が存在することを確認 ✅

# 4. ブラウザ確認
npm run dev
# → http://localhost:3000/editor でメディア追加が動作することを確認 ✅
```

**全て✅なら Phase 5開始可能** 🚀

---

## 📋 実装タスク（12タスク）

### **優先度順タスクリスト**

```
🔴 P0（最優先 - 並列実施不可）:
  ├─ T053 Compositor Store        [1時間]   ← 最初に実装
  └─ T048 Compositor Class         [3時間]   ← コア実装

🟡 P1（高優先 - P0完了後に並列実施可）:
  ├─ T047 Canvas Wrapper           [1時間]
  ├─ T050 VideoManager             [2時間]
  ├─ T051 ImageManager             [1.5時間]
  ├─ T052 Playback Loop            [2時間]  ← T048に含む
  ├─ T054 TimelineRuler            [1.5時間]
  ├─ T055 PlayheadIndicator        [1時間]
  ├─ T049 PlaybackControls         [1時間]
  └─ T058 Timeline Sync            [1.5時間]

🟢 P2（低優先 - 最後に実装）:
  └─ T057 FPSCounter               [0.5時間]

総推定時間: 15時間
```

---

## 📅 推奨実装スケジュール

### **Day 1（4時間）- 基盤構築**

**午前（2時間）**:
```bash
# Task 1: Compositor Store
1. stores/compositor.ts を作成
2. 型チェック: npx tsc --noEmit
3. コミット: git commit -m "feat: add compositor store"
```

**午後（2時間）**:
```bash
# Task 2: Canvas Wrapper
1. features/compositor/components/Canvas.tsx を作成
2. EditorClient.tsx に統合（簡易版）
3. ブラウザ確認: キャンバスが表示されるか
4. コミット
```

---

### **Day 2（5時間）- Manager実装**

**午前（3時間）**:
```bash
# Task 3-4: VideoManager + ImageManager
1. features/compositor/managers/VideoManager.ts 作成
2. features/compositor/managers/ImageManager.ts 作成
3. features/compositor/managers/AudioManager.ts 作成
4. managers/index.ts でexport
5. 型チェック
6. コミット
```

**午後（2時間）**:
```bash
# Task 5: Compositor Class（Part 1）
1. features/compositor/utils/Compositor.ts 作成
2. VideoManager/ImageManager統合
3. 基本構造実装
```

---

### **Day 3（4時間）- Compositor完成**

**午前（2時間）**:
```bash
# Task 5 continued: Compositor Class（Part 2）
1. Playback loop実装
2. compose_effects実装
3. seek実装
4. テスト作成: tests/unit/compositor.test.ts
5. テスト実行
```

**午後（2時間）**:
```bash
# Task 6-7: UI Controls
1. PlaybackControls.tsx 作成
2. TimelineRuler.tsx 作成
3. PlayheadIndicator.tsx 作成
4. EditorClient.tsx に統合
5. ブラウザ確認: Playボタンが動作するか
```

---

### **Day 4（2時間）- 統合とテスト**

```bash
# Task 8-9: 最終統合
1. FPSCounter.tsx 作成
2. Timeline.tsx 更新（Ruler/Playhead統合）
3. 全機能統合テスト
4. パフォーマンスチューニング
5. ドキュメント更新
```

**完了確認**:
```bash
# 全テスト実行
npm run test

# ブラウザで完全動作確認
npm run dev
# → メディア追加 → Play → 60fps再生 → Seek
```

---

## 🎯 各タスクの実装ガイド

### **Task 1: Compositor Store** ⚠️ 最初に実装

**ファイル**: `stores/compositor.ts`  
**参照**: `PHASE5_IMPLEMENTATION_DIRECTIVE.md` Step 1  
**重要度**: 🔴 最優先（他のタスクが依存）

**実装チェックポイント**:
```typescript
✅ isPlaying: boolean
✅ timecode: number
✅ fps: number
✅ actualFps: number
✅ play(), pause(), stop(), seek() アクション
```

**検証**:
```bash
npx tsc --noEmit
# エラー0件を確認
```

---

### **Task 2: Canvas Wrapper**

**ファイル**: `features/compositor/components/Canvas.tsx`  
**参照**: `PHASE5_IMPLEMENTATION_DIRECTIVE.md` Step 2  
**omniclip**: `compositor/controller.ts:37`

**実装チェックポイント**:
```typescript
✅ PIXI.Application初期化（非同期）
✅ width/height props対応
✅ onAppReady callback
✅ cleanup処理（destroy）
```

**検証**:
```bash
npm run dev
# ブラウザで黒いキャンバスが表示されることを確認
```

---

### **Task 3: VideoManager** 🎯 最重要

**ファイル**: `features/compositor/managers/VideoManager.ts`  
**参照**: `PHASE5_IMPLEMENTATION_DIRECTIVE.md` Step 3  
**omniclip**: `parts/video-manager.ts` (183行)

**実装チェックポイント**:
```typescript
✅ addVideo(effect: VideoEffect)
✅ addToStage(effectId, track, trackCount)
✅ seek(effectId, effect, timecode)
✅ play(effectId) / pause(effectId)
✅ remove(effectId)
```

**重要**: omniclipのコードを**行単位で移植**

---

### **Task 4-5: ImageManager + AudioManager**

**同じパターン**:
1. Map<effectId, resource>で管理
2. add/remove/play/pauseメソッド実装
3. omniclipのコードを忠実に移植

---

### **Task 6: Compositor Class** 🎯 コア実装

**ファイル**: `features/compositor/utils/Compositor.ts`  
**参照**: `PHASE5_IMPLEMENTATION_DIRECTIVE.md` Step 6  
**omniclip**: `compositor/controller.ts` (463行)

**実装チェックポイント**:
```typescript
✅ VideoManager/ImageManager/AudioManager統合
✅ startPlaybackLoop() - requestAnimationFrame
✅ composeEffects(effects, timecode)
✅ getEffectsRelativeToTimecode()
✅ updateCurrentlyPlayedEffects()
✅ calculateFps()
```

**最重要**: プレイバックループの正確な移植

---

## 🧪 テスト戦略

### **Compositor Tests**

**ファイル**: `tests/unit/compositor.test.ts`

```typescript
describe('Compositor', () => {
  it('should initialize PIXI app', () => {
    // テスト実装
  })
  
  it('should calculate visible effects at timecode', () => {
    // 特定タイムコードでどのエフェクトが表示されるか
  })
  
  it('should update timecode during playback', () => {
    // play()実行後、timecodeが増加するか
  })
  
  it('should sync video seek to timecode', () => {
    // seek()実行後、ビデオ要素のcurrentTimeが正しいか
  })
})
```

**目標**: 8テスト以上、全パス

---

## 🎯 完了判定

### **技術要件**

```bash
✅ TypeScriptエラー: 0件
✅ Compositor tests: 全パス
✅ 既存tests: 全パス（Phase 4の12テスト含む）
✅ Lintエラー: 0件
✅ ビルド: 成功
```

### **機能要件**

```bash
✅ キャンバスが正しいサイズで表示
✅ Play/Pauseボタンが動作
✅ ビデオが再生される
✅ オーディオが同期再生される
✅ タイムラインルーラーでシーク可能
✅ プレイヘッドが正しい位置に表示
✅ FPSカウンターが50fps以上を表示
```

### **パフォーマンス要件**

```bash
✅ 実測fps: 50fps以上（60fps目標）
✅ シーク遅延: 500ms以下
✅ メモリ使用量: 500MB以下（10分再生時）
```

---

## ⚠️ よくあるトラブルと解決方法

### **問題1: PIXI.jsキャンバスが表示されない**

**原因**: 非同期初期化を待っていない

**解決**:
```typescript
// ❌ BAD
const app = new PIXI.Application({ width, height })
container.appendChild(app.view)  // viewがまだない

// ✅ GOOD
const app = new PIXI.Application()
await app.init({ width, height })
container.appendChild(app.canvas)  // canvas（v8では.view→.canvas）
```

---

### **問題2: ビデオが再生されない**

**原因**: HTMLVideoElement.play()がPromiseを返す

**解決**:
```typescript
// ❌ BAD
video.play()  // エラーを無視

// ✅ GOOD
await video.play().catch(error => {
  console.warn('Play failed:', error)
})
```

---

### **問題3: FPSが30fps以下**

**原因**: requestAnimationFrameループの問題

**解決**:
1. Console.logを減らす
2. app.render()を毎フレーム呼ぶ
3. 不要なDOM操作を削減

---

### **問題4: メディアファイルがロードできない**

**原因**: Supabase Storage署名付きURL取得エラー

**解決**:
```typescript
// getSignedUrl() の実装確認
const url = await getSignedUrl(mediaFileId)
console.log('Signed URL:', url)  // URL取得確認
```

---

## 💡 実装Tips

### **Tip 1: 小さく実装・頻繁にテスト**

```bash
# 悪い例: 全部実装してからテスト
[4時間実装] → テスト → デバッグ地獄

# 良い例: 小刻みに実装・テスト
[30分実装] → テスト → [30分実装] → テスト → ...
```

### **Tip 2: omniclipコードをコピペから始める**

```typescript
// 1. omniclipのコードをコピー
// 2. ProEdit環境に合わせて修正
//    - PIXI v7 → v8
//    - @benev/slate → Zustand
//    - createObjectURL → getSignedUrl
// 3. 型チェック
// 4. テスト
```

### **Tip 3: Console.logで動作確認**

```typescript
console.log('Compositor: Play started')
console.log('Timecode:', this.timecode)
console.log('Visible effects:', visibleEffects.length)
console.log('FPS:', actualFps)
```

### **Tip 4: FPSを常に監視**

- FPSカウンターを早めに実装
- 50fps以下なら最適化
- Performance Profileを使用

---

## 📚 必読リソース

### **実装開始前（必読）**

1. ⭐ `PHASE5_IMPLEMENTATION_DIRECTIVE.md` - 完全実装指示
2. `vendor/omniclip/s/context/controllers/compositor/controller.ts` - omniclip参照

### **実装中（参照）**

1. `types/effects.ts` - Effect型定義
2. `vendor/omniclip/s/context/controllers/compositor/parts/video-manager.ts`
3. `vendor/omniclip/s/context/controllers/compositor/parts/image-manager.ts`

---

## 🎯 成功への近道

```
1. 実装指示書を最初から最後まで読む（30分）
2. omniclipコードを理解する（1時間）
3. Step 1から順番に実装（スキップ禁止）
4. 各Step完了後に型チェック実行
5. 動作確認を頻繁に行う
6. 問題発生時はomniclipと比較

総推定時間: 15-18時間
成功率: 95%以上
```

---

## 🏆 Phase 5完了後

**達成できること**:
- ✅ ブラウザで60fpsビデオプレビュー
- ✅ プロフェッショナル品質のタイムライン
- ✅ MVPとして実用可能なエディタ

**次のステップ**:
- Phase 6: Drag/Drop/Trim実装
- Phase 8: Video Export実装
- Production展開

---

**作成日**: 2025-10-14  
**次の更新**: Phase 5完了時  
**Good luck!** 🚀

