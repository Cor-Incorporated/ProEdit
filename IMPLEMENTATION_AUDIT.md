# ProEdit実装監査レポート

## 🔍 調査日時
2025-10-15

## ✅ FFmpegセットアップ確認

### ファイル配置
```
/public/ffmpeg/
  ✅ ffmpeg-core.js (112KB)
  ✅ ffmpeg-core.wasm (31MB)
  ✅ coi-serviceworker.js
```

### バージョン
- @ffmpeg/ffmpeg: ^0.12.15
- @ffmpeg/util: ^0.12.2  
- CDNファイル: 0.12.6

## ⚠️ 発見された問題

### 1. VideoManager繰り返し問題（未解決）
**症状**: `VideoManager: Added video effect` が16回繰り返される

**根本原因**:
- `updateCurrentlyPlayedEffects`が頻繁に呼ばれている
- `hasChanges`チェックが機能していない可能性
- `toAdd`配列が毎回同じエフェクトを含んでいる

**仮説**:
1. `isReady(effectId)`がtrueを返すが、実際はまだロード中
2. 非同期処理中に`currentlyPlayedEffects`が変更される
3. React Strict Modeで二重実行される

### 2. Canvas vs Compositor ライフサイクル
**問題**: 
- Canvas.tsx: `app.destroy(true)` を呼ぶ（WebGL context解放）
- Compositor.destroy(): `app.destroy()` を呼ばない（omniclipパターン）

**矛盾**: 
両方のクリーンアップが実行される順序が保証されていない

**修正**: EditorClientでCompositorを先に破棄するよう修正済み

### 3. FFmpegロードエラー
**症状**: `Cannot find module 'http://localhost:3000/ffmpeg/ffmpeg-core.js'`

**可能性**:
1. Service Workerがファイルをブロックしている
2. Next.jsの静的ファイル配信の問題
3. FFmpegの初期化タイミングの問題

## 📋 omniclipパターンとの比較

### 実装済み（✅）
1. ✅ Compositor playback loop
2. ✅ VideoManager with PIXI.Sprite
3. ✅ Effect visibility based on timecode
4. ✅ FPS tracking
5. ✅ Text overlay support
6. ✅ Manager cleanup pattern
7. ✅ No app.destroy() in Compositor

### 未実装または差異（⚠️）
1. ⚠️ FilterManager (filters not ported)
2. ⚠️ TransitionManager (transitions not ported)
3. ⚠️ Video texture update strategy
4. ⚠️ Proper error recovery

## 🐛 特定されたバグ

### 高優先度（P0）
1. ❌ VideoManager: 繰り返し追加（パフォーマンス重大影響）
2. ❌ FFmpeg: ロード失敗（エクスポート不可）
3. ✅ AutoSave: FK制約エラー（修正済み）

### 中優先度（P1）
1. ⚠️ Video playback: 自動再生ブロック
2. ⚠️ Dialog warnings: アクセシビリティ
3. ✅ Effect deletion: 動作確認必要

### 低優先度（P2）
1. ⚠️ CSS preload warning
2. ⚠️ AutoSave conflicts（軽減済み）

## 📝 推奨される追加修正

### 1. VideoManager addVideo 呼び出しトレース
```typescript
// デバッグログを追加して呼び出し元を特定
console.trace('VideoManager: addVideo called for', effect.id)
```

### 2. React Strict Mode 対応
```typescript
// useEffectのクリーンアップを確実にする
useEffect(() => {
  let mounted = true
  // ...
  return () => { mounted = false }
}, [])
```

### 3. FFmpeg動的インポート改善
```typescript
// Service Worker登録完了を待つ
await waitForServiceWorker()
await loadFFmpeg()
```

## 🎯 次のアクション

1. ✅ FFmpegセットアップ完了
2. ⏳ VideoManager繰り返し問題の根本解決
3. ⏳ FFmpegロードの確実性向上
4. ⏳ ビデオ再生機能の検証

