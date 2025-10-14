# 🚨 Phase 8 Export実装指示書（厳守）

## ⚠️ CRITICAL: 即座に読むこと

**現状**: Phase 1-6は完璧に完了しているが、**Export機能が完全欠落**している。

**問題**: 「動画編集アプリ」ではなく「動画プレビューアプリ」になっている。
- ✅ 編集はできる
- ❌ **出力できない** ← 致命的

**例え**: メモ帳で文書を書けるが保存できない状態。

---

## 🎯 あなたの使命

**Phase 8: Export機能（T080-T092）を実装せよ**

推定時間: 12-16時間
優先度: 🔴 **CRITICAL** - 他の全てより優先

**⚠️ 警告**: Phase 8完了前に他のPhaseに着手することは**厳禁**

---

## 📋 実装タスク一覧（順番厳守）

### Day 1（4-5時間）

#### ✅ T084: FFmpegHelper実装（1.5時間）
**ファイル**: `features/export/ffmpeg/FFmpegHelper.ts`
**参照**: `vendor/omniclip/s/context/controllers/video-export/helpers/FFmpegHelper/helper.ts`

```typescript
export class FFmpegHelper {
  async load(): Promise<void>                          // omniclip Line 25-40
  async run(command: string[]): Promise<void>          // omniclip Line 45-60
  writeFile(name: string, data: Uint8Array): void      // omniclip Line 65-80
  readFile(name: string): Uint8Array                   // omniclip Line 85-100
  onProgress(callback: (progress: number) => void): void // omniclip Line 105-120
}
```

**検証**:
- [ ] `ffmpeg.load()`が成功
- [ ] `ffmpeg.run(['-version'])`が動作

---

#### ✅ T082: Encoder実装（3時間）
**ファイル**: `features/export/workers/encoder.worker.ts`
**参照**: `vendor/omniclip/s/context/controllers/video-export/parts/encoder.ts`

```typescript
export class Encoder {
  async initialize(config: VideoEncoderConfig): Promise<void> // omniclip Line 30-50
  async encodeFrame(frame: VideoFrame): Promise<void>         // omniclip Line 55-75
  async flush(): Promise<Uint8Array>                          // omniclip Line 80-95
  configure(config: VideoEncoderConfig): void                 // omniclip Line 100-115
}
```

**検証**:
- [ ] 1フレームをエンコード可能

---

#### ✅ T083: Decoder実装（1.5時間）
**ファイル**: `features/export/workers/decoder.worker.ts`
**参照**: `vendor/omniclip/s/context/controllers/video-export/parts/decoder.ts`

```typescript
export class Decoder {
  async initialize(): Promise<void>                               // omniclip Line 25-40
  async decode(chunk: EncodedVideoChunk): Promise<VideoFrame>    // omniclip Line 45-65
  async decodeAudio(chunk: EncodedAudioChunk): Promise<AudioData> // omniclip Line 70-85
}
```

**Day 1終了時の必須確認**:
- [ ] FFmpegHelper.load()が動作
- [ ] Encoderが1フレームをエンコード
- [ ] Decoderが1フレームをデコード

---

### Day 2（4-5時間）

#### ✅ T085: ExportController実装（3時間）
**ファイル**: `features/export/utils/export.ts`
**参照**: `vendor/omniclip/s/context/controllers/video-export/controller.ts`

```typescript
export class ExportController {
  async startExport(projectId: string, quality: '720p' | '1080p' | '4k'): Promise<void>
  private async generateFrames(): Promise<void>
  private async composeWithFFmpeg(videoFrames: Uint8Array[], audioData: Uint8Array[]): Promise<Uint8Array>
  private downloadFile(data: Uint8Array, filename: string): void
}
```

**実装フロー**:
```
1. タイムラインからエフェクト取得
2. 各フレーム（1/30秒）をPIXI.jsでレンダリング
3. EncoderでWebCodecsエンコード
4. FFmpegで音声と合成
5. MP4ファイル生成
6. ブラウザダウンロード
```

---

#### ✅ T087: Worker通信（1時間）
**ファイル**: `features/export/utils/worker.ts`

```typescript
export class WorkerManager {
  private encoder: Worker
  private decoder: Worker
  
  async encodeFrame(frame: VideoFrame): Promise<void>
  onProgress(callback: (progress: number) => void): void
}
```

---

#### ✅ T088: WebCodecs Feature Detection（1時間）
**ファイル**: `features/export/utils/codec.ts`

```typescript
export function isWebCodecsSupported(): boolean {
  return 'VideoEncoder' in window && 'VideoDecoder' in window
}

export function getEncoderConfig(): VideoEncoderConfig {
  return {
    codec: 'avc1.42001E', // H.264 Baseline
    width: 1920,
    height: 1080,
    bitrate: 9_000_000,
    framerate: 30,
  }
}
```

**Day 2終了時の必須確認**:
- [ ] 5秒の動画を出力可能（音声なし）
- [ ] プログレスバーが動作
- [ ] エラー時にtoast表示

---

### Day 3（4-6時間）

#### ✅ T080: ExportDialog実装（1.5時間）
**ファイル**: `features/export/components/ExportDialog.tsx`

```typescript
export function ExportDialog({ projectId }: { projectId: string }) {
  // shadcn/ui Dialog使用
  // 解像度選択（720p, 1080p, 4k）
  // ビットレート選択（3000, 6000, 9000 kbps）
  // フォーマット選択（MP4, WebM）
}
```

---

#### ✅ T081: QualitySelector実装（1時間）
**ファイル**: `features/export/components/QualitySelector.tsx`

```typescript
export function QualitySelector({ onSelect }: { onSelect: (quality: Quality) => void }) {
  // shadcn/ui RadioGroup使用
  // 720p: 1280x720, 30fps, 3Mbps
  // 1080p: 1920x1080, 30fps, 6Mbps
  // 4k: 3840x2160, 30fps, 9Mbps
}
```

---

#### ✅ T086: ExportProgress実装（1時間）
**ファイル**: `features/export/components/ExportProgress.tsx`

```typescript
export function ExportProgress({ progress }: { progress: number }) {
  // shadcn/ui Progress使用
  // パーセンテージ表示
  // 推定残り時間（optional）
}
```

---

#### ✅ T091: オーディオミキシング（1.5時間）
**ファイル**: `features/export/utils/export.ts`（ExportControllerに追加）

```typescript
private async mixAudio(audioEffects: AudioEffect[]): Promise<Uint8Array> {
  // FFmpegで音声トラックを合成
  // omniclip準拠のミキシング
}
```

---

#### ✅ T092: ダウンロード処理（1時間）
**ファイル**: `features/export/utils/export.ts`（ExportControllerに追加）

```typescript
private downloadFile(data: Uint8Array, filename: string): void {
  const blob = new Blob([data], { type: 'video/mp4' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
```

---

#### ✅ 統合テスト（1時間）
- [ ] 5秒動画（音声なし）を出力
- [ ] 10秒動画（音声付き）を出力
- [ ] 30秒動画（複数エフェクト）を出力
- [ ] 720p/1080p/4k全て出力

**Day 3終了時の必須確認**:
- [ ] 完全な動画（音声付き）を出力可能
- [ ] 720p/1080p/4k全て動作
- [ ] エラーハンドリング完璧

---

## ✅ 必ず守ること（厳格なルール）

### 1. omniclipコードを必ず参照する
```
❌ 独自実装
✅ omniclipのロジックを忠実に移植
```

各メソッド実装時:
1. 該当するomniclipファイルを開く
2. 行番号を確認
3. コメントに記載: `// Ported from omniclip: Line XX-YY`

### 2. tasks.mdの順序を守る
```
T080 → T081 → T082 → T083 → T084 → ... → T092
```
前のタスクが完了しない限り次に進まない。

### 3. 型安全性を維持する
```typescript
// ❌ 禁止
const data: any = ...

// ✅ 必須
const data: Uint8Array = ...
```

### 4. エラーハンドリング必須
```typescript
try {
  await ffmpeg.run(command)
} catch (error) {
  console.error('Export failed:', error)
  toast.error('Export failed', { description: error.message })
  throw error
}
```

### 5. プログレス監視必須
```typescript
ffmpeg.onProgress((progress) => {
  setExportProgress(progress)
  console.log(`Export progress: ${progress}%`)
})
```

---

## ❌ 絶対にやってはいけないこと

### 1. omniclipと異なるアルゴリズム
```
❌ 独自のエンコーディングロジック
✅ omniclipのロジックを忠実に移植
```

### 2. tasks.mdにないタスクを追加
```
❌ 「より良い実装」のための独自機能
✅ tasks.mdのタスクのみ実装
```

### 3. 品質プリセットを変更
```
❌ 独自の解像度・ビットレート
✅ omniclip準拠のプリセット（720p, 1080p, 4k）
```

### 4. WebCodecsの代替実装
```
❌ Canvas APIでのフレーム抽出（遅い）
✅ WebCodecs優先、fallbackのみCanvas
```

### 5. UIライブラリの変更
```
❌ 別のUIライブラリ（Material-UI等）
✅ shadcn/ui（既存コードと統一）
```

---

## 🎯 成功基準（Phase 8完了時）

以下が**全て**達成されたときのみPhase 8完了:

### 機能要件
- [ ] タイムラインの編集結果をMP4ファイルとして出力できる
- [ ] 720p/1080p/4kの解像度選択が可能
- [ ] 音声付き動画を出力できる
- [ ] プログレスバーが正確に動作する
- [ ] エラー時に適切なメッセージを表示する

### 技術要件
- [ ] TypeScriptエラー0件
- [ ] omniclipロジック95%以上移植
- [ ] WebCodecs利用（非対応時はfallback）
- [ ] メモリリークなし（30秒動画を10回出力してメモリ増加<100MB）
- [ ] 処理速度: 10秒動画を30秒以内に出力（1080p）

### 品質要件
- [ ] 出力動画がVLC/QuickTimeで再生可能
- [ ] 出力動画の解像度・FPSが設定通り
- [ ] 音声が正しく同期している
- [ ] エフェクト（Trim, Position）が正確に反映

### ドキュメント要件
- [ ] 各タスクの実装レポート完成
- [ ] omniclip移植チェックリスト100%
- [ ] 既知の問題・制約を文書化

---

## 📝 実装レポート要件

**各タスク完了時に記録**:

```markdown
## T0XX: [タスク名] 完了報告

### 実装内容
- ファイル: features/export/...
- omniclip参照: Line XX-YY
- 実装行数: XXX行

### omniclip移植状況
- [X] メソッドA（omniclip Line XX-YY）
- [X] メソッドB（omniclip Line XX-YY）
- [ ] メソッドC（未実装、理由: ...）

### テスト結果
- [X] 単体テスト通過
- [X] 統合テスト通過
- [X] TypeScriptエラー0件

### 変更点（omniclipとの差分）
- 変更1: 理由...
- 変更2: 理由...

### 次のタスク
T0XX: [タスク名]
```

---

## ⚠️ 計画からの逸脱

もし以下が必要になった場合、**実装前に**報告すること:
- tasks.mdにないタスクの追加
- omniclipと異なるアプローチ
- 新しいライブラリの導入
- 技術的制約によるタスクスキップ

**報告方法**: GitHubでIssueを作成、またはチームに直接連絡

---

## 🚀 開始手順

### 1. 環境確認
```bash
cd /Users/teradakousuke/Developer/proedit

# 依存関係確認
npm list @ffmpeg/ffmpeg  # 0.12.15
npm list pixi.js         # v8.x

# TypeScriptエラー確認
npx tsc --noEmit  # 0 errors expected
```

### 2. omniclipファイル確認
```bash
ls vendor/omniclip/s/context/controllers/video-export/

# 確認すべきファイル:
# - controller.ts
# - parts/encoder.ts
# - parts/decoder.ts
# - helpers/FFmpegHelper/helper.ts
```

### 3. ディレクトリ作成
```bash
mkdir -p features/export/ffmpeg
mkdir -p features/export/workers
mkdir -p features/export/utils
mkdir -p features/export/components
```

### 4. 実装開始
```bash
# T084から開始
touch features/export/ffmpeg/FFmpegHelper.ts

# omniclipを参照しながら実装
code vendor/omniclip/s/context/controllers/video-export/helpers/FFmpegHelper/helper.ts
code features/export/ffmpeg/FFmpegHelper.ts
```

---

## 📚 参照ドキュメント

- **詳細レポート**: `PHASE1-6_VERIFICATION_REPORT_DETAILED.md`
- **タスク定義**: `specs/001-proedit-mvp-browser/tasks.md`（Line 210-235）
- **omniclipコード**: `vendor/omniclip/s/context/controllers/video-export/`

---

## 🎉 Phase 8完了後

Phase 8が完了したら、次のPhaseに進む:
1. **Phase 7**: Text Overlay Creation (T070-T079)
2. **Phase 9**: Auto-save and Recovery (T093-T100)
3. **Phase 10**: Polish & Cross-Cutting Concerns (T101-T110)

**重要**: Phase 8完了前に他のPhaseに着手しないこと。

---

**頑張ってください！ 🚀**

*作成日: 2025年10月14日*
*優先度: 🔴 CRITICAL*
*推定時間: 12-16時間*

