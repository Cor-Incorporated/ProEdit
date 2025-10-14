# omniclip 実装分析レポート - ProEdit移植のための完全ガイド

> **作成日**: 2025-10-14  
> **目的**: omniclipの実装を徹底分析し、Next.js + Supabaseへの移植方針を明確化

---

## 📋 目次

1. [アーキテクチャ概要](#アーキテクチャ概要)
2. [コア技術スタック](#コア技術スタック)
3. [データモデル](#データモデル)
4. [主要コントローラー](#主要コントローラー)
5. [PIXI.js統合](#pixijs統合)
6. [動画処理パイプライン](#動画処理パイプライン)
7. [ファイル管理](#ファイル管理)
8. [Supabase移植戦略](#supabase移植戦略)

---

## アーキテクチャ概要

### 設計パターン: State-Actions-Controllers-Views

```
┌─────────────────────────────────────────────────────┐
│                     Views (UI)                       │
│              (Lit-based Web Components)              │
└────────────────────┬────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────┐
│                  Controllers                         │
│  Timeline │ Compositor │ Media │ Export │ Project   │
└────────────────────┬────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────┐
│                    Actions                           │
│      Historical (Undo/Redo)  │  Non-Historical       │
└────────────────────┬────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────┐
│                     State                            │
│   HistoricalState (永続化)  │  NonHistoricalState    │
└─────────────────────────────────────────────────────┘
```

### 実装ファイル構造

```
/s/context/
├── state.ts                 # 初期状態定義
├── actions.ts               # アクション定義（Historical/Non-Historical）
├── types.ts                 # TypeScript型定義
├── helpers.ts               # ヘルパー関数
└── controllers/
    ├── timeline/            # タイムライン管理
    ├── compositor/          # レンダリング・合成
    ├── media/               # メディアファイル管理
    ├── video-export/        # 動画エクスポート
    ├── project/             # プロジェクト保存/読み込み
    ├── shortcuts/           # キーボードショートカット
    └── collaboration/       # WebRTC協調編集
```

---

## コア技術スタック

### 動画処理

| 技術 | 用途 | 実装箇所 |
|------|------|----------|
| **FFmpeg.wasm** | 動画エンコード、オーディオマージ | `video-export/helpers/FFmpegHelper/` |
| **WebCodecs API** | ブラウザネイティブなエンコード/デコード | `video-export/parts/encoder.ts`, `decoder.ts` |
| **MediaInfo.js** | 動画メタデータ取得（FPS、duration） | `media/controller.ts` |
| **mp4box.js** | MP4 demuxing | `tools/demuxer.js` |
| **web-demuxer** | 動画コンテナ解析 | 統合先不明（パッケージ依存） |

### レンダリング

| 技術 | 用途 | 実装箇所 |
|------|------|----------|
| **PIXI.js v7.4** | WebGLベースの2Dレンダリング | `compositor/controller.ts` |
| **PIXI Transformer** | オブジェクト変形（回転・スケール） | 各マネージャー |
| **gl-transitions** | トランジションエフェクト | `compositor/parts/transition-manager.ts` |
| **GSAP** | アニメーション | `compositor/parts/animation-manager.ts` |

### ストレージ

| 技術 | 用途 | 実装箇所 |
|------|------|----------|
| **IndexedDB** | メディアファイルのブラウザ内永続化 | `media/controller.ts` |
| **LocalStorage** | プロジェクト一覧、ショートカット設定 | `project/controller.ts`, `shortcuts/controller.ts` |
| **OPFS** | 協調編集用の一時ファイル | `collaboration/parts/opfs-manager.ts` |

---

## データモデル

### State構造

#### HistoricalState（Undo/Redo対象）

```typescript
interface HistoricalState {
  projectName: string                // プロジェクト名
  projectId: string                  // UUID
  tracks: XTrack[]                   // トラック配列
  effects: AnyEffect[]               // エフェクト配列
  filters: Filter[]                  // フィルター配列
  animations: Animation[]            // アニメーション配列
  transitions: Transition[]          // トランジション配列
}

interface XTrack {
  id: string
  visible: boolean
  locked: boolean
  muted: boolean
}
```

#### NonHistoricalState（一時状態）

```typescript
interface NonHistoricalState {
  selected_effect: AnyEffect | null  // 選択中のエフェクト
  is_playing: boolean                // 再生中フラグ
  is_exporting: boolean              // エクスポート中フラグ
  export_progress: number            // エクスポート進捗（0-100）
  export_status: ExportStatus        // エクスポート状態
  fps: number                        // 現在のFPS
  timecode: number                   // 再生位置（ミリ秒）
  length: number                     // タイムラインの長さ
  zoom: number                       // ズームレベル
  timebase: number                   // フレームレート（10-120）
  log: string                        // ログメッセージ
  settings: Settings                 // プロジェクト設定
}

interface Settings {
  width: number                      // 1920
  height: number                     // 1080
  aspectRatio: AspectRatio           // "16/9", "4/3", etc
  bitrate: number                    // 9000 (kbps)
  standard: Standard                 // "1080p", "4K", etc
}
```

### Effect型定義（コア）

```typescript
interface Effect {
  id: string                         // UUID
  start_at_position: number          // タイムライン上の開始位置（ms）
  duration: number                   // 表示時間（ms）
  start: number                      // ソース開始位置（trim用）
  end: number                        // ソース終了位置（trim用）
  track: number                      // トラック番号
}

interface VideoEffect extends Effect {
  kind: "video"
  thumbnail: string                  // Base64サムネイル
  raw_duration: number               // 元動画の長さ
  frames: number                     // フレーム数
  rect: EffectRect                   // 位置・サイズ・回転
  file_hash: string                  // ファイルのハッシュ値
  name: string                       // ファイル名
}

interface AudioEffect extends Effect {
  kind: "audio"
  raw_duration: number
  file_hash: string
  name: string
}

interface ImageEffect extends Effect {
  kind: "image"
  rect: EffectRect
  file_hash: string
  name: string
}

interface TextEffect extends Effect {
  kind: "text"
  fontFamily: Font                   // フォント名
  text: string                       // 表示テキスト
  fontSize: number                   // フォントサイズ
  fontStyle: TextStyleFontStyle      // "normal" | "italic"
  align: TextStyleAlign              // "left" | "center" | "right"
  fill: PIXI.FillInput[]             // カラー配列（グラデーション対応）
  fillGradientType: TEXT_GRADIENT    // 0=Linear, 1=Radial
  rect: EffectRect
  stroke: StrokeInput                // アウトライン色
  strokeThickness: number
  dropShadow: boolean                // シャドウの有無
  dropShadowDistance: number
  dropShadowBlur: number
  dropShadowAlpha: number
  dropShadowAngle: number
  dropShadowColor: ColorSource
  wordWrap: boolean
  wordWrapWidth: number
  lineHeight: number
  letterSpacing: number
  // ... 他多数のテキストスタイルプロパティ
}

interface EffectRect {
  width: number
  height: number
  scaleX: number
  scaleY: number
  position_on_canvas: { x: number; y: number }
  rotation: number                   // 度数
  pivot: { x: number; y: number }    // 回転の中心点
}
```

---

## 主要コントローラー

### 1. Timeline Controller

**責務**: タイムライン上のエフェクト配置・編集・ドラッグ操作

```typescript
// /s/context/controllers/timeline/controller.ts
export class Timeline {
  effectTrimHandler: effectTrimHandler          // トリム処理
  effectDragHandler: EffectDragHandler          // ドラッグ処理
  playheadDragHandler: PlayheadDrag             // 再生ヘッド操作
  #placementProposal: EffectPlacementProposal   // 配置提案計算
  #effectManager: EffectManager                 // エフェクト管理

  // 重要メソッド
  calculate_proposed_timecode()                 // エフェクト配置の計算
  set_proposed_timecode()                       // 配置を確定
  split()                                       // 選択エフェクトを分割
  copy() / paste() / cut()                     // クリップボード操作
  remove_selected_effect()                     // 削除
}
```

**キー実装ファイル**:
- `parts/effect-manager.ts` - エフェクト追加/削除/分割
- `parts/effect-placement-proposal.ts` - 重なり検出とスナップ
- `parts/drag-related/effect-drag.ts` - ドラッグ&ドロップ
- `parts/drag-related/effect-trim.ts` - トリム操作
- `utils/find_place_for_new_effect.ts` - 新規エフェクトの配置計算

### 2. Compositor Controller

**責務**: PIXI.jsでの2Dレンダリング・合成

```typescript
// /s/context/controllers/compositor/controller.ts
export class Compositor {
  app: PIXI.Application                         // PIXI.jsインスタンス
  managers: Managers                            // 各種マネージャー

  interface Managers {
    videoManager: VideoManager
    textManager: TextManager
    imageManager: ImageManager
    audioManager: AudioManager
    animationManager: AnimationManager
    filtersManager: FiltersManager
    transitionManager: TransitionManager
  }

  // 重要メソッド
  compose_effects()                             // エフェクトを合成
  play() / pause()                             // 再生制御
  seek()                                       // シーク
  setOrDiscardActiveObjectOnCanvas()           // 選択オブジェクト管理
}
```

**各マネージャーの責務**:

| マネージャー | 責務 | 実装ファイル |
|------------|------|-------------|
| **VideoManager** | 動画エフェクトの表示・再生制御 | `parts/video-manager.ts` |
| **TextManager** | テキストエフェクトのスタイル管理 | `parts/text-manager.ts` |
| **ImageManager** | 画像エフェクトの表示 | `parts/image-manager.ts` |
| **AudioManager** | オーディオ再生制御 | `parts/audio-manager.ts` |
| **AnimationManager** | GSAPアニメーション | `parts/animation-manager.ts` |
| **FiltersManager** | エフェクトフィルター（色調整など） | `parts/filter-manager.ts` |
| **TransitionManager** | トランジション処理 | `parts/transition-manager.ts` |

#### VideoManager実装パターン

```typescript
export class VideoManager extends Map<string, {sprite: PIXI.Sprite, transformer: PIXI.Container}> {
  create_and_add_video_effect(video: Video, state: State) {
    // 1. VideoEffectオブジェクト作成
    const effect: VideoEffect = {
      id: generate_id(),
      kind: "video",
      file_hash: video.hash,
      raw_duration: video.duration,
      rect: { /* PIXI.jsのサイズ・位置情報 */ }
      // ...
    }

    // 2. PIXI.Spriteを作成
    const element = document.createElement('video')
    element.src = URL.createObjectURL(file)
    const texture = PIXI.Texture.from(element)
    const sprite = new PIXI.Sprite(texture)

    // 3. Transformerで変形可能に
    const transformer = new PIXI.Transformer({
      boxRotationEnabled: true,
      group: [sprite],
      stage: this.compositor.app.stage
    })

    // 4. ドラッグイベント設定
    sprite.on('pointerdown', (e) => {
      this.compositor.canvasElementDrag.onDragStart(e, sprite, transformer)
    })

    // 5. 保存
    this.set(effect.id, {sprite, transformer})
    this.actions.add_video_effect(effect)
  }

  draw_decoded_frame(effect: VideoEffect, frame: VideoFrame) {
    // エクスポート時にデコードされたフレームを描画
    const canvas = this.#effect_canvas.get(effect.id)
    canvas.getContext("2d").drawImage(frame, 0, 0, width, height)
    const texture = PIXI.Texture.from(canvas)
    video.texture = texture
  }
}
```

### 3. Media Controller

**責務**: メディアファイルのインポート・管理（IndexedDB）

```typescript
// /s/context/controllers/media/controller.ts
export class Media extends Map<string, AnyMedia> {
  #database_request = window.indexedDB.open("database", 3)

  // ファイルインポート
  async import_file(input: HTMLInputElement | File) {
    const file = input instanceof File ? input : input.files[0]
    const hash = await quick_hash(file)

    // メタデータ取得（動画の場合）
    if (file.type.startsWith('video')) {
      const {fps, duration, frames} = await this.getVideoFileMetadata(file)
    }

    // IndexedDBに保存
    const transaction = this.#database_request.result.transaction(["files"], "readwrite")
    transaction.objectStore("files").add({ file, hash, kind: "video", ... })
  }

  // メタデータ取得（MediaInfo.js使用）
  async getVideoFileMetadata(file: File) {
    const info = await getMediaInfo()
    const metadata = await info.analyzeData(file.size, makeReadChunk(file))
    const videoTrack = metadata.media.track.find(t => t["@type"] === "Video")
    return {
      fps: videoTrack.FrameRate,
      duration: videoTrack.Duration * 1000,
      frames: Math.round(videoTrack.FrameRate * videoTrack.Duration)
    }
  }

  // サムネイル生成
  create_video_thumbnail(video: HTMLVideoElement): Promise<string> {
    const canvas = document.createElement("canvas")
    canvas.width = 150
    canvas.height = 50
    video.currentTime = 1000/60
    video.addEventListener("seeked", () => {
      canvas.getContext("2d").drawImage(video, 0, 0, 150, 50)
      resolve(canvas.toDataURL())
    })
  }
}
```

### 4. VideoExport Controller

**責務**: FFmpeg + WebCodecsでの動画エンコード

```typescript
// /s/context/controllers/video-export/controller.ts
export class VideoExport {
  #Encoder: Encoder
  #Decoder: Decoder

  export_start(state: State, bitrate: number) {
    // 1. Encoderを初期化
    this.#Encoder.configure([width, height], bitrate, timebase)

    // 2. エクスポートループ開始
    this.#export_process(effects, timebase)
  }

  async #export_process(effects: AnyEffect[], timebase: number) {
    // 1. デコード（Decoder）
    await this.#Decoder.get_and_draw_decoded_frame(effects, this.#timestamp)

    // 2. 合成（Compositor）
    this.compositor.compose_effects(effects, this.#timestamp, true)

    // 3. エンコード（Encoder）
    this.#Encoder.encode_composed_frame(this.compositor.app.view, this.#timestamp)

    // 4. 次フレームへ
    this.#timestamp += 1000/timebase
    requestAnimationFrame(() => this.#export_process(effects, timebase))

    // 5. 完了時
    if (this.#timestamp >= this.#timestamp_end) {
      this.#Encoder.export_process_end(effects, timebase)
    }
  }
}
```

#### Encoder実装

```typescript
// /s/context/controllers/video-export/parts/encoder.ts
export class Encoder {
  encode_worker = new Worker(new URL("./encode_worker.js", import.meta.url))
  #ffmpeg: FFmpegHelper

  configure([width, height]: number[], bitrate: number, timebase: number) {
    // Web Workerに設定送信
    this.encode_worker.postMessage({
      action: "configure",
      width, height, bitrate, timebase,
      bitrateMode: "constant"
    })
  }

  encode_composed_frame(canvas: HTMLCanvasElement, timestamp: number) {
    // PIXI.jsのcanvasからVideoFrame作成
    const frame = new VideoFrame(canvas, {
      displayWidth: canvas.width,
      displayHeight: canvas.height,
      duration: 1000/this.compositor.timebase,
      timestamp: timestamp * 1000
    })

    // Workerでエンコード
    this.encode_worker.postMessage({frame, action: "encode"})
    frame.close()
  }

  export_process_end(effects: AnyEffect[], timebase: number) {
    // 1. エンコード完了、バイナリ取得
    this.encode_worker.postMessage({action: "get-binary"})
    this.encode_worker.onmessage = async (msg) => {
      const h264Binary = msg.data.binary

      // 2. FFmpegでオーディオマージ & MP4 mux
      await this.#ffmpeg.write_composed_data(h264Binary, "composed.h264")
      await this.#ffmpeg.merge_audio_with_video_and_mux(
        effects, "composed.h264", "output.mp4", media, timebase
      )

      // 3. 完成ファイル取得
      this.file = await this.#ffmpeg.get_muxed_file("output.mp4")
    }
  }
}
```

#### FFmpegHelper実装

```typescript
// /s/context/controllers/video-export/helpers/FFmpegHelper/helper.ts
export class FFmpegHelper {
  ffmpeg = new FFmpeg()

  async #load_ffmpeg() {
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.5/dist/esm'
    await this.ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    })
  }

  async merge_audio_with_video_and_mux(
    effects: AnyEffect[],
    videoContainerName: string,
    outputFileName: string,
    media: Media,
    timebase: number
  ) {
    // 1. 動画エフェクトからオーディオ抽出
    for (const {id, start, end, file_hash} of videoEffects) {
      const file = await media.get_file(file_hash)
      await this.ffmpeg.writeFile(`${id}.mp4`, await fetchFile(file))
      await this.ffmpeg.exec([
        "-ss", `${start / 1000}`,
        "-i", `${id}.mp4`,
        "-t", `${(end - start) / 1000}`,
        "-vn", `${id}.mp3`
      ])
    }

    // 2. オーディオエフェクトも追加
    for (const {id, start, end, file_hash} of audioEffects) {
      const file = await media.get_file(file_hash)
      await this.ffmpeg.writeFile(`${id}x.mp3`, await fetchFile(file))
      await this.ffmpeg.exec(["-ss", `${start / 1000}`, "-i", `${id}x.mp3`, "-t", `${(end - start) / 1000}`, "-vn", `${id}.mp3`])
    }

    // 3. FFmpegで全オーディオをミックス & ビデオとマージ
    await this.ffmpeg.exec([
      "-r", `${timebase}`,
      "-i", videoContainerName,
      ...audios.flatMap(({id}) => `-i, ${id}.mp3`.split(", ")),
      "-filter_complex",
      `${audios.map((e, i) => `[${i+1}:a]adelay=${e.start_at_position}:all=1[a${i+1}];`).join("")}
       ${audios.map((_, i) => `[a${i+1}]`).join("")}amix=inputs=${audios.length}[amixout]`,
      "-map", "0:v:0",
      "-map", "[amixout]",
      "-c:v", "copy",
      "-c:a", "aac",
      "-b:a", "192k",
      "-y", outputFileName
    ])
  }
}
```

### 5. Project Controller

**責務**: プロジェクトのエクスポート/インポート（ZIP形式）

```typescript
// /s/context/controllers/project/controller.ts
export class Project {
  async exportProject(state: HistoricalState) {
    const zipWriter = new ZipWriter(new BlobWriter("application/zip"))

    // 1. project.json追加
    const projectJson = JSON.stringify(state, null, 2)
    await zipWriter.add("project.json", new TextReader(projectJson))

    // 2. メディアファイル追加
    for (const effect of state.effects) {
      if ("file_hash" in effect) {
        const file = await this.#media.get_file(effect.file_hash)
        const extension = this.getFileExtension(file)
        await zipWriter.add(`${effect.file_hash}.${extension}`, new BlobReader(file))
      }
    }

    // 3. ZIPダウンロード
    const zipBlob = await zipWriter.close()
    const url = URL.createObjectURL(zipBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${state.projectName}.zip`
    link.click()
  }

  async importProject(input: HTMLInputElement) {
    const zipReader = new ZipReader(new BlobReader(file))
    const entries = await zipReader.getEntries()

    let projectState: HistoricalState | null = null

    for (const entry of entries) {
      if (entry.filename === "project.json") {
        const jsonContent = await entry.getData(new TextWriter())
        projectState = JSON.parse(jsonContent)
      } else {
        // メディアファイルをIndexedDBにインポート
        const fileBlob = await entry.getData(new BlobWriter())
        const file = new File([fileBlob], entry.filename, {type: mimeType})
        await this.#media.import_file(file)
      }
    }

    return projectState
  }
}
```

### 6. Shortcuts Controller

**責務**: キーボードショートカット管理

```typescript
// /s/context/controllers/shortcuts/controller.ts
export class Shortcuts {
  #shortcutsByAction = new Map<ActionType, Shortcut>()
  #shortcutsByKey = new Map<string, Shortcut>()

  handleEvent(event: KeyboardEvent, state: State) {
    // input/textarea内では無視
    if (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA') {
      return
    }

    const shortcut = this.getKeyCombination(event).toLowerCase()
    const entry = this.#shortcutsByKey.get(shortcut)
    if (entry) {
      event.preventDefault()
      entry.action(state)
    }
  }

  getKeyCombination(event: KeyboardEvent): string {
    const keys = []
    if (event.ctrlKey) keys.push("Ctrl")
    if (event.metaKey) keys.push("Cmd")
    if (event.altKey) keys.push("Alt")
    if (event.shiftKey) keys.push("Shift")
    keys.push(this.#normalizeKey(event.key).toUpperCase())
    return keys.join("+")
  }
}

// デフォルトショートカット
const DEFAULT_SHORTCUTS = [
  { actionType: "Copy", shortcut: "ctrl+c" },
  { actionType: "Paste", shortcut: "ctrl+v" },
  { actionType: "Undo", shortcut: "ctrl+z" },
  { actionType: "Redo", shortcut: "ctrl+shift+z" },
  { actionType: "Delete", shortcut: "delete" },
  { actionType: "Split", shortcut: "ctrl+b" },
  { actionType: "Play/Pause", shortcut: "space" },
  { actionType: "Previous frame", shortcut: "ArrowLeft" },
  { actionType: "Next frame", shortcut: "ArrowRight" },
]
```

---

## PIXI.js統合

### 初期化

```typescript
// /s/context/controllers/compositor/controller.ts
export class Compositor {
  app = new PIXI.Application({
    width: 1920,
    height: 1080,
    backgroundColor: "black",
    preference: "webgl"
  })

  constructor() {
    this.app.stage.sortableChildren = true  // zIndex有効化
    this.app.stage.interactive = true       // イベント有効化
    this.app.stage.hitArea = this.app.screen
  }
}
```

### エフェクトの表示パターン

#### 1. Video表示

```typescript
const element = document.createElement('video')
element.src = URL.createObjectURL(file)
const texture = PIXI.Texture.from(element)
const sprite = new PIXI.Sprite(texture)

sprite.x = effect.rect.position_on_canvas.x
sprite.y = effect.rect.position_on_canvas.y
sprite.scale.set(effect.rect.scaleX, effect.rect.scaleY)
sprite.rotation = effect.rect.rotation * (Math.PI / 180)
sprite.pivot.set(effect.rect.pivot.x, effect.rect.pivot.y)

this.compositor.app.stage.addChild(sprite)
sprite.zIndex = tracks.length - effect.track
```

#### 2. Text表示

```typescript
const style = new PIXI.TextStyle({
  fontFamily: effect.fontFamily,
  fontSize: effect.fontSize,
  fill: effect.fill,
  stroke: effect.stroke,
  strokeThickness: effect.strokeThickness,
  dropShadow: effect.dropShadow,
  // ... 他多数のプロパティ
})

const text = new PIXI.Text(effect.text, style)
text.x = effect.rect.position_on_canvas.x
text.y = effect.rect.position_on_canvas.y
```

#### 3. Image表示

```typescript
const url = URL.createObjectURL(file)
const texture = await PIXI.Assets.load({
  src: url,
  format: file.type,
  loadParser: 'loadTextures'
})
const sprite = new PIXI.Sprite(texture)
```

### Transformer（変形機能）

```typescript
const transformer = new PIXI.Transformer({
  boxRotationEnabled: true,        // 回転有効
  translateEnabled: false,         // 移動は独自実装
  group: [sprite],
  stage: this.compositor.app.stage,
  wireframeStyle: {
    thickness: 2,
    color: 0xff0000
  }
})

sprite.on('pointerdown', (e) => {
  this.compositor.app.stage.addChild(transformer)
})
```

### ドラッグ操作

```typescript
// /s/context/controllers/compositor/controller.ts
canvasElementDrag = {
  onDragStart(event, sprite, transformer) {
    sprite.alpha = 0.5
    this.dragging = sprite

    sprite.on('pointermove', this.onDragMove)
  },

  onDragMove(event) {
    if (this.dragging) {
      const newPosition = this.dragging.parent.toLocal(event.global)
      this.dragging.x = newPosition.x
      this.dragging.y = newPosition.y

      // アライメントガイドライン表示
      const guides = this.guidelines.drawGuidesForElement(this.dragging, elements)
      this.#guidelineRect.clear()
      guides.forEach(guide => this.#guidelineRect.moveTo(guide.x1, guide.y1).lineTo(guide.x2, guide.y2))
    }
  },

  onDragEnd() {
    if (this.dragging) {
      this.dragging.alpha = 1
      this.dragging.off('pointermove', this.onDragMove)
      this.#guidelineRect.clear()
      // Stateを更新
      this.actions.set_position_on_canvas(effect, this.dragging.x, this.dragging.y)
    }
  }
}
```

---

## 動画処理パイプライン

### エクスポートフロー（全体像）

```
┌──────────────────────────────────────────────────────────┐
│ 1. 初期化                                                │
│    - Encoder設定（解像度、ビットレート、FPS）            │
│    - Decoder準備                                        │
└─────────────────────┬────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────────┐
│ 2. フレームループ（requestAnimationFrame）              │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 2.1 Decoder: 動画フレームをデコード                │ │
│  │     - Web Worker で VideoDecoder 使用              │ │
│  │     - デコードされたフレームをMapに保存             │ │
│  └───────────────────┬────────────────────────────────┘ │
│                      ↓                                   │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 2.2 Compositor: エフェクトを合成                    │ │
│  │     - PIXI.jsでタイムスタンプに対応するエフェクト描画│ │
│  │     - Canvasに出力                                  │ │
│  └───────────────────┬────────────────────────────────┘ │
│                      ↓                                   │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 2.3 Encoder: Canvasフレームをエンコード              │ │
│  │     - Web Worker で VideoEncoder 使用              │ │
│  │     - H.264形式にエンコード                        │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
└─────────────────────┬────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────────┐
│ 3. FFmpegでマージ                                         │
│    - H.264 raw video を composed.h264 として保存       │
│    - 各エフェクトからオーディオを抽出                   │
│    - FFmpeg filter_complex でオーディオミックス          │
│    - MP4コンテナにmux                                   │
└─────────────────────┬────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────────┐
│ 4. ダウンロード                                           │
│    - output.mp4 をダウンロード                          │
└──────────────────────────────────────────────────────────┘
```

### Decoder詳細

```typescript
// /s/context/controllers/video-export/parts/decode_worker.js (Web Worker)
let decoder = null

self.onmessage = async (msg) => {
  if (msg.data.action === "configure") {
    decoder = new VideoDecoder({
      output: (frame) => {
        // デコード完了したフレームをメインスレッドに送信
        self.postMessage({
          action: "new-frame",
          frame: {
            frame: frame,
            effect_id: currentEffectId,
            timestamp: frame.timestamp
          }
        }, [frame])
      },
      error: (e) => console.error("Decode error:", e)
    })

    decoder.configure(msg.data.config)
  }

  if (msg.data.action === "chunk") {
    // MP4からdemuxされたEncodedVideoChunkをデコード
    decoder.decode(msg.data.chunk)
  }
}
```

### Encoder詳細

```typescript
// /s/context/controllers/video-export/parts/encode_worker.js (Web Worker)
let encoder = null
let binaryAccumulator = []

self.onmessage = async (msg) => {
  if (msg.data.action === "configure") {
    encoder = new VideoEncoder({
      output: (chunk, metadata) => {
        // エンコードされたチャンクを蓄積
        const buffer = new Uint8Array(chunk.byteLength)
        chunk.copyTo(buffer)
        binaryAccumulator.push(buffer)
      },
      error: (e) => console.error("Encode error:", e)
    })

    encoder.configure({
      codec: "avc1.42001f",  // H.264 Baseline
      width: msg.data.width,
      height: msg.data.height,
      bitrate: msg.data.bitrate * 1000,
      framerate: msg.data.timebase,
      bitrateMode: msg.data.bitrateMode
    })
  }

  if (msg.data.action === "encode") {
    // PIXI.jsのCanvasから生成されたVideoFrameをエンコード
    encoder.encode(msg.data.frame, { keyFrame: false })
  }

  if (msg.data.action === "get-binary") {
    await encoder.flush()
    // 蓄積したバイナリを結合して返す
    const totalLength = binaryAccumulator.reduce((sum, arr) => sum + arr.length, 0)
    const binary = new Uint8Array(totalLength)
    let offset = 0
    for (const arr of binaryAccumulator) {
      binary.set(arr, offset)
      offset += arr.length
    }
    self.postMessage({ action: "binary", binary })
  }
}
```

---

## ファイル管理

### IndexedDB構造

```typescript
// データベース名: "database"
// バージョン: 3
// オブジェクトストア名: "files"
// キー: hash (SHA-256)

interface StoredMedia {
  hash: string                    // SHA-256ハッシュ
  file: File                      // 元のFileオブジェクト
  kind: "video" | "audio" | "image"
  // Video特有
  frames?: number
  duration?: number
  fps?: number
  proxy?: boolean                // 協調編集用プロキシフラグ
}
```

### ファイルハッシュ生成

```typescript
// @benev/construct の quick_hash を使用
import {quick_hash} from "@benev/construct"

const hash = await quick_hash(file)
// SHA-256ベースのハッシュを生成（重複検出用）
```

### プロジェクト保存（LocalStorage）

```typescript
// キー形式: "omniclip_${projectId}"
// 値: JSON.stringify(HistoricalState)

localStorage.setItem(`omniclip_${projectId}`, JSON.stringify({
  projectName,
  projectId,
  effects,
  tracks,
  filters,
  animations,
  transitions
}))
```

---

## Supabase移植戦略

### データベーススキーマ設計

#### 1. projects テーブル

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  
  -- 設定（JSON）
  settings JSONB DEFAULT '{
    "width": 1920,
    "height": 1080,
    "aspectRatio": "16/9",
    "bitrate": 9000,
    "standard": "1080p",
    "timebase": 25
  }'::JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- インデックス
  INDEX idx_projects_user_id ON projects(user_id),
  INDEX idx_projects_updated_at ON projects(updated_at DESC)
);

-- RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);
```

#### 2. tracks テーブル

```sql
CREATE TABLE tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  
  -- トラック設定
  track_index INTEGER NOT NULL,  -- 0, 1, 2, ...
  visible BOOLEAN DEFAULT true,
  locked BOOLEAN DEFAULT false,
  muted BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- インデックス
  INDEX idx_tracks_project_id ON tracks(project_id),
  UNIQUE(project_id, track_index)
);

-- RLS
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage tracks in own projects"
  ON tracks
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = tracks.project_id
    AND projects.user_id = auth.uid()
  ));
```

#### 3. effects テーブル（ポリモーフィック設計）

```sql
CREATE TABLE effects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  
  -- 共通プロパティ
  kind TEXT NOT NULL CHECK (kind IN ('video', 'audio', 'image', 'text')),
  track INTEGER NOT NULL,
  start_at_position INTEGER NOT NULL,  -- ミリ秒
  duration INTEGER NOT NULL,           -- ミリ秒
  start_time INTEGER NOT NULL,         -- trim開始位置
  end_time INTEGER NOT NULL,           -- trim終了位置
  
  -- メディアファイル参照（video, audio, imageのみ）
  media_file_id UUID REFERENCES media_files(id),
  
  -- エフェクト固有のプロパティ（JSON）
  properties JSONB NOT NULL DEFAULT '{}'::JSONB,
  -- Video/Image: { rect: { width, height, scaleX, scaleY, position_on_canvas, rotation, pivot }, raw_duration, frames }
  -- Audio: { raw_duration }
  -- Text: { fontFamily, text, fontSize, fontStyle, fill, rect, stroke, ... }
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- インデックス
  INDEX idx_effects_project_id ON effects(project_id),
  INDEX idx_effects_kind ON effects(kind),
  INDEX idx_effects_track ON effects(track)
);

-- RLS
ALTER TABLE effects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage effects in own projects"
  ON effects
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = effects.project_id
    AND projects.user_id = auth.uid()
  ));
```

#### 4. media_files テーブル

```sql
CREATE TABLE media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  
  -- ファイル情報
  file_hash TEXT UNIQUE NOT NULL,      -- SHA-256（重複排除用）
  filename TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  
  -- Supabase Storage パス
  storage_path TEXT NOT NULL,          -- bucket_name/user_id/file_hash.ext
  storage_bucket TEXT DEFAULT 'media-files',
  
  -- メタデータ（動画の場合）
  metadata JSONB DEFAULT '{}'::JSONB,
  -- { duration: 5000, fps: 30, frames: 150, width: 1920, height: 1080, thumbnail: "..." }
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- インデックス
  INDEX idx_media_files_user_id ON media_files(user_id),
  INDEX idx_media_files_hash ON media_files(file_hash)
);

-- RLS
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own media files"
  ON media_files FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upload media files"
  ON media_files FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own media files"
  ON media_files FOR DELETE
  USING (auth.uid() = user_id);
```

#### 5. filters テーブル

```sql
CREATE TABLE filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  effect_id UUID REFERENCES effects(id) ON DELETE CASCADE NOT NULL,
  
  -- フィルター設定
  type TEXT NOT NULL,                  -- "brightness", "contrast", etc
  value REAL NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_filters_effect_id ON filters(effect_id)
);

-- RLS
ALTER TABLE filters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage filters in own projects"
  ON filters
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = filters.project_id
    AND projects.user_id = auth.uid()
  ));
```

#### 6. animations テーブル

```sql
CREATE TABLE animations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  effect_id UUID REFERENCES effects(id) ON DELETE CASCADE NOT NULL,
  
  -- アニメーション設定
  type TEXT NOT NULL CHECK (type IN ('in', 'out')),
  for_type TEXT NOT NULL,              -- "Animation", "Filter", etc
  ease_type TEXT NOT NULL,
  duration INTEGER NOT NULL,           -- ミリ秒
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_animations_effect_id ON animations(effect_id)
);

-- RLS（同上）
```

#### 7. transitions テーブル

```sql
CREATE TABLE transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  
  -- トランジション設定
  from_effect_id UUID REFERENCES effects(id) ON DELETE CASCADE,
  to_effect_id UUID REFERENCES effects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                  -- gl-transitions名
  duration INTEGER NOT NULL,           -- ミリ秒
  
  -- params（JSON）
  params JSONB DEFAULT '{}'::JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_transitions_from_effect ON transitions(from_effect_id),
  INDEX idx_transitions_to_effect ON transitions(to_effect_id)
);

-- RLS（同上）
```

### Supabase Storage構造

```
media-files/
├── {user_id}/
│   ├── {file_hash}.mp4
│   ├── {file_hash}.png
│   ├── {file_hash}.mp3
│   └── thumbnails/
│       └── {file_hash}.jpg       # 動画サムネイル
```

**バケット設定**:
- 名前: `media-files`
- Public: `false`（RLS有効）
- ファイルサイズ制限: 500MB（プランに応じて調整）

**RLSポリシー**:
```sql
-- 自分のファイルのみアップロード可能
CREATE POLICY "Users can upload own files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'media-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 自分のファイルのみダウンロード可能
CREATE POLICY "Users can download own files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'media-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### データフロー（omniclip → ProEdit）

#### ファイルアップロード

**omniclip (IndexedDB)**:
```typescript
// クライアントサイドのみ
const hash = await quick_hash(file)
indexedDB.put({ file, hash, kind: "video" })
```

**ProEdit (Supabase)**:
```typescript
// 1. ファイルハッシュ生成
const hash = await quick_hash(file)

// 2. 重複チェック
const { data: existing } = await supabase
  .from('media_files')
  .select('id, storage_path')
  .eq('file_hash', hash)
  .single()

if (existing) {
  return existing  // 既存ファイル使用
}

// 3. Supabase Storageにアップロード
const storagePath = `${user_id}/${hash}.${extension}`
const { data: uploadData, error } = await supabase.storage
  .from('media-files')
  .upload(storagePath, file)

// 4. メタデータ取得（動画の場合）
const metadata = file.type.startsWith('video')
  ? await getVideoMetadata(file)
  : {}

// 5. media_filesテーブルに登録
const { data: mediaFile } = await supabase
  .from('media_files')
  .insert({
    user_id,
    file_hash: hash,
    filename: file.name,
    file_size: file.size,
    mime_type: file.type,
    storage_path: storagePath,
    metadata
  })
  .select()
  .single()

return mediaFile
```

#### エフェクト追加

**omniclip (メモリ内State)**:
```typescript
const effect: VideoEffect = {
  id: generate_id(),
  kind: "video",
  file_hash: video.hash,
  duration: 5000,
  start_at_position: 0,
  // ...
}
actions.add_video_effect(effect)
```

**ProEdit (Supabase)**:
```typescript
// 1. Effectをデータベースに保存
const { data: effect } = await supabase
  .from('effects')
  .insert({
    project_id,
    kind: 'video',
    track: 0,
    start_at_position: 0,
    duration: 5000,
    start_time: 0,
    end_time: 5000,
    media_file_id: mediaFile.id,
    properties: {
      rect: {
        width: 1920,
        height: 1080,
        scaleX: 1,
        scaleY: 1,
        position_on_canvas: { x: 960, y: 540 },
        rotation: 0,
        pivot: { x: 960, y: 540 }
      },
      raw_duration: video.duration,
      frames: video.frames
    }
  })
  .select()
  .single()

// 2. ローカルStateも更新（Zustand）
useEditorStore.getState().addEffect(effect)

// 3. PIXI.jsに反映
compositor.managers.videoManager.add_video_effect(effect, file)
```

#### プロジェクト保存

**omniclip (LocalStorage + ZIP)**:
```typescript
// 保存
localStorage.setItem(`omniclip_${projectId}`, JSON.stringify(state))

// エクスポート
const zip = new ZipWriter()
await zip.add("project.json", JSON.stringify(state))
await zip.add(`${file_hash}.mp4`, file)
```

**ProEdit (Supabase Realtime)**:
```typescript
// 自動保存（デバウンス）
const debouncedSave = useMemo(
  () => debounce(async (state) => {
    await supabase
      .from('projects')
      .update({
        settings: state.settings,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
  }, 1000),
  [projectId]
)

// Stateが変更されたら自動保存
useEffect(() => {
  debouncedSave(state)
}, [state])

// エクスポート（オプション）
async function exportProject() {
  // プロジェクトデータ取得
  const { data: project } = await supabase
    .from('projects')
    .select('*, tracks(*), effects(*), filters(*), animations(*), transitions(*)')
    .eq('id', projectId)
    .single()

  // メディアファイルダウンロード
  const mediaFiles = await Promise.all(
    project.effects
      .filter(e => e.media_file_id)
      .map(e => supabase.storage
        .from('media-files')
        .download(e.storage_path)
      )
  )

  // ZIPに圧縮
  const zip = new ZipWriter()
  await zip.add("project.json", JSON.stringify(project))
  mediaFiles.forEach((file, i) => {
    zip.add(`media/${i}.${extension}`, file)
  })
  return await zip.close()
}
```

### 認証フロー

```typescript
// /lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// /app/(auth)/login/page.tsx
async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/editor`
    }
  })
}

// /app/(editor)/layout.tsx
export default async function EditorLayout({ children }) {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  return <>{children}</>
}
```

### リアルタイム同期（協調編集の代替）

**omniclip (WebRTC)**:
- `sparrow-rtc` でP2P接続
- State変更をブロードキャスト

**ProEdit (Supabase Realtime)**:
```typescript
// /hooks/useProjectSync.ts
export function useProjectSync(projectId: string) {
  useEffect(() => {
    const channel = supabase
      .channel(`project:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'effects',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          // リモート変更をローカルStateに反映
          if (payload.eventType === 'INSERT') {
            useEditorStore.getState().addEffect(payload.new)
          } else if (payload.eventType === 'UPDATE') {
            useEditorStore.getState().updateEffect(payload.new)
          } else if (payload.eventType === 'DELETE') {
            useEditorStore.getState().removeEffect(payload.old.id)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId])
}
```

---

## 移植優先順位

### Phase 1: MVPコア機能（2週間）

1. **認証** ✅
   - Google OAuth（Supabase Auth）
   - `/app/(auth)/login` ページ

2. **プロジェクト管理** ✅
   - プロジェクト作成・一覧・削除
   - Supabase `projects` テーブル

3. **メディアアップロード** ✅
   - 動画・画像のアップロード
   - Supabase Storage統合
   - `media_files` テーブル

4. **基本タイムライン** ✅
   - トラック表示
   - エフェクト配置（ドラッグ&ドロップなし）
   - `tracks`, `effects` テーブル

5. **シンプルプレビュー** ✅
   - PIXI.js初期化
   - 動画・画像表示のみ

### Phase 2: 編集機能（2週間）

6. **ドラッグ&ドロップ** 🔄
   - エフェクトの移動・リサイズ
   - タイムライン上のドラッグ
   - Canvas上のドラッグ

7. **トリミング・分割** 🔄
   - エフェクトのトリム
   - 分割機能

8. **テキストエフェクト** 🔄
   - PIXI.Text統合
   - テキストスタイル編集UI

9. **Undo/Redo** 🔄
   - Zustandでヒストリー管理

10. **動画エクスポート** 🔄
    - FFmpeg.wasm統合
    - WebCodecs Encoder/Decoder
    - 720p出力

### Phase 3: 拡張機能（2週間）

11. **トランジション** 🔜
    - gl-transitions統合

12. **フィルター** 🔜
    - PIXI.jsフィルター

13. **複数解像度** 🔜
    - 1080p, 4K対応

14. **プロジェクト共有** 🔜
    - Supabase Realtime

---

## 重要な移植ポイント

### ✅ そのまま使える実装

1. **PIXI.js統合**
   - Compositorのロジックほぼそのまま
   - VideoManager, TextManager, ImageManager

2. **FFmpeg処理**
   - FFmpegHelperクラスそのまま
   - オーディオマージロジック

3. **WebCodecs処理**
   - Encoder/Decoder Worker
   - VideoFrame → Canvas → Encode

4. **エフェクトの型定義**
   - `Effect`, `VideoEffect`, `TextEffect` など

5. **タイムライン計算ロジック**
   - `find_place_for_new_effect`
   - `calculate_proposed_timecode`

### ⚠️ 大きく変更が必要な部分

1. **State管理**
   - omniclip: @benev/slate（カスタムリアクティビティ）
   - ProEdit: Zustand（標準的なReact状態管理）

2. **ファイルストレージ**
   - omniclip: IndexedDB（クライアントサイド）
   - ProEdit: Supabase Storage（クラウド）

3. **プロジェクト保存**
   - omniclip: LocalStorage + ZIP
   - ProEdit: PostgreSQL（リアルタイム同期）

4. **UI Components**
   - omniclip: Lit Web Components
   - ProEdit: React Server Components + Tailwind CSS

5. **協調編集**
   - omniclip: WebRTC（P2P）
   - ProEdit: Supabase Realtime（Server経由）

### 🔧 適応が必要な実装

1. **Actions → Zustand Actions**

**omniclip**:
```typescript
const actions = actionize_historical({
  add_video_effect: state => (effect: VideoEffect) => {
    state.effects.push(effect)
  }
})
```

**ProEdit**:
```typescript
// /stores/editorStore.ts
import { create } from 'zustand'

interface EditorStore {
  effects: AnyEffect[]
  addVideoEffect: (effect: VideoEffect) => Promise<void>
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  effects: [],
  
  addVideoEffect: async (effect: VideoEffect) => {
    // 1. Supabaseに保存
    const { data } = await supabase
      .from('effects')
      .insert({
        project_id: get().projectId,
        kind: 'video',
        ...effect
      })
      .select()
      .single()

    // 2. ローカルState更新
    set(state => ({
      effects: [...state.effects, data]
    }))

    // 3. PIXI.jsに反映
    compositor.managers.videoManager.add_video_effect(data, file)
  }
}))
```

2. **Media Controller → React Hooks + Supabase**

**omniclip**:
```typescript
class Media extends Map<string, AnyMedia> {
  async import_file(file: File) {
    const hash = await quick_hash(file)
    const transaction = indexedDB.transaction(["files"], "readwrite")
    transaction.objectStore("files").add({ file, hash })
  }
}
```

**ProEdit**:
```typescript
// /hooks/useMediaUpload.ts
export function useMediaUpload(projectId: string) {
  const [uploading, setUploading] = useState(false)

  const uploadFile = async (file: File) => {
    setUploading(true)

    try {
      // 1. ハッシュ生成
      const hash = await quick_hash(file)

      // 2. 重複チェック
      const { data: existing } = await supabase
        .from('media_files')
        .select()
        .eq('file_hash', hash)
        .single()

      if (existing) return existing

      // 3. Storageアップロード
      const path = `${user_id}/${hash}.${extension}`
      await supabase.storage.from('media-files').upload(path, file)

      // 4. DBに登録
      const { data } = await supabase
        .from('media_files')
        .insert({ file_hash: hash, storage_path: path, ... })
        .select()
        .single()

      return data
    } finally {
      setUploading(false)
    }
  }

  return { uploadFile, uploading }
}
```

---

## パフォーマンス最適化の移植

### omniclipの最適化手法

1. **Web Workers活用**
   - VideoEncoder/Decoder はWorkerで並列処理
   - → ProEditでもそのまま採用

2. **requestAnimationFrame使用**
   - エクスポートループで60fps維持
   - → そのまま使用

3. **PIXI.jsのzIndex**
   - `sortableChildren = true` でソート回避
   - → そのまま使用

4. **OPFS（Origin Private File System）**
   - 協調編集での一時ファイル
   - → ProEditでは不要（Supabase使用）

5. **デバウンス/スロットル**
   - Zoom, Scroll イベント
   - → React hookで実装

---

## まとめ

### ✅ 移植戦略まとめ

1. **コアロジックは80%再利用可能**
   - PIXI.js統合、FFmpeg処理、WebCodecs、エフェクト計算

2. **State管理をZustandに移行**
   - Actions → Zustand actions
   - Historical → React状態 + Supabase

3. **ストレージをSupabaseに統合**
   - IndexedDB → Supabase Storage
   - LocalStorage → PostgreSQL

4. **UIをReactに書き直し**
   - Lit → React Server Components
   - カスタムCSS → Tailwind CSS

5. **段階的な開発**
   - Phase 1: 認証 + 基本機能
   - Phase 2: 編集機能
   - Phase 3: 高度な機能

---

**このドキュメントは、omniclipの実装を完全に理解し、ProEditへの移植を最適化するための完全ガイドです。**
