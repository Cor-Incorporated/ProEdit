# 🚨 CRITICAL: 即座に読むこと

**日付**: 2025-10-14  
**対象**: ProEdit開発エンジニア  
**優先度**: 🔴 **CRITICAL - 最優先**

---

## ⚠️ 致命的な問題が発覚

### 2名のレビュアーによる緊急指摘

**Phase 1-6実装品質**: ✅ **A+（95/100点）**  
**MVPとしての完全性**: ❌ **D（60/100点）**

### 問題の核心

**現状**: 「動画編集アプリ」ではなく「動画プレビューアプリ」

```
✅ できること:
- メディアアップロード
- タイムライン編集（Trim, Drag, Split）
- 60fpsプレビュー再生
- Undo/Redo

❌ できないこと（致命的）:
- 編集結果を動画ファイルとして出力（Export） ← 最重要
- テキストオーバーレイ追加
- 自動保存（ブラウザリフレッシュでデータロス）
```

**例え**: メモ帳で文書を書けるが保存できない状態

---

## 🎯 即座に実施すべきこと

### **Phase 8: Export実装（12-16時間）を最優先で開始**

**⚠️ 警告**: Phase 8完了前に他のPhaseに着手することは**厳禁**

### なぜPhase 8が最優先なのか

1. **Export機能がなければMVPではない**
   - 動画編集の最終成果物を出力できない
   - ユーザーは編集結果を保存できない

2. **他機能は全てExportに依存**
   - Text Overlay → Exportで出力必要
   - Auto-save → Export設定も保存必要

3. **顧客価値の実現**
   - Export機能 = 顧客が対価を払う価値
   - Preview機能 = デモには良いが製品ではない

---

## 📋 実装指示書

### 1. 詳細な実装指示を読む（10分）

```bash
# 以下のファイルを熟読すること
cat PHASE8_IMPLEMENTATION_DIRECTIVE.md

# 詳細レポートも確認
cat PHASE1-6_VERIFICATION_REPORT_DETAILED.md
```

### 2. Phase 8タスク一覧（T080-T092）

| Day       | タスク       | 時間 | 内容                 |
|-----------|-----------|------|----------------------|
| **Day 1** | T084      | 1.5h | FFmpegHelper実装     |
|           | T082      | 3h   | Encoder実装          |
|           | T083      | 1.5h | Decoder実装          |
| **Day 2** | T085      | 3h   | ExportController実装 |
|           | T087      | 1h   | Worker通信           |
|           | T088      | 1h   | WebCodecs Detection  |
| **Day 3** | T080-T081 | 2.5h | Export UI            |
|           | T086      | 1h   | Progress表示         |
|           | T091      | 1.5h | オーディオミキシング           |
|           | T092      | 1h   | ダウンロード処理           |
|           | 統合テスト   | 1h   | 全体動作確認         |

**合計**: 12-16時間

### 3. 必須参照ファイル（omniclip）

```bash
# Export機能の参照元（未移植）
ls vendor/omniclip/s/context/controllers/video-export/

# 確認すべきファイル:
# - controller.ts          ← T085で使用
# - parts/encoder.ts       ← T082で使用
# - parts/decoder.ts       ← T083で使用
# - helpers/FFmpegHelper/helper.ts ← T084で使用
```

---

## ✅ 実装時の厳格なルール

### 必ず守ること

1. **omniclipコードを必ず参照する**
   - 各メソッド実装時に該当行番号を確認
   - コメントに記載: `// Ported from omniclip: Line XX-YY`

2. **tasks.mdの順序を守る**
   - T080 → T081 → T082 → ... → T092
   - 前のタスク完了後のみ次へ進む

3. **型安全性を維持する**
   - `any`型禁止
   - TypeScriptエラー0件維持

4. **エラーハンドリング必須**
   - try/catch必須
   - toast通知必須

5. **プログレス監視必須**
   - ユーザーに進捗表示

### 絶対にやってはいけないこと

1. ❌ omniclipと異なるアルゴリズム使用
2. ❌ tasks.mdにないタスク追加
3. ❌ Phase 8完了前に他のPhase着手
4. ❌ 品質プリセット変更
5. ❌ UIライブラリ変更

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
- [ ] メモリリークなし
- [ ] 処理速度: 10秒動画を30秒以内に出力（1080p）

### 品質要件
- [ ] 出力動画がVLC/QuickTimeで再生可能
- [ ] 出力動画の解像度・FPSが設定通り
- [ ] 音声が正しく同期している
- [ ] エフェクト（Trim, Position）が正確に反映

---

## 📅 実装スケジュール

### Week 1: Phase 8 Export（12-16時間）🚨 CRITICAL
```
Day 1: FFmpegHelper, Encoder, Decoder実装
Day 2: ExportController, Worker通信実装
Day 3: UI, オーディオ、ダウンロード、統合テスト
```

**検証**: 動画が出力できることを確認

### Week 2: Phase 7 Text Overlay（6-8時間）🟡 HIGH
```
Export完了後のみ開始可能
```

### Week 3: Phase 9 Auto-save（4-6時間）🟡 HIGH
```
Text完了後のみ開始可能
```

### Week 4: Phase 10 Polish（2-4時間）🟢 NORMAL
```
Auto-save完了後のみ開始可能
```

---

## 🚀 今すぐ開始する手順

### ステップ1: 環境確認（5分）
```bash
cd /Users/teradakousuke/Developer/proedit

# 依存関係確認
npm list @ffmpeg/ffmpeg  # 0.12.15
npm list pixi.js         # v8.x

# TypeScriptエラー確認
npx tsc --noEmit  # 0 errors expected
```

### ステップ2: ディレクトリ作成（2分）
```bash
mkdir -p features/export/ffmpeg
mkdir -p features/export/workers
mkdir -p features/export/utils
mkdir -p features/export/components
```

### ステップ3: T084開始（今すぐ）
```bash
# FFmpegHelper実装開始
touch features/export/ffmpeg/FFmpegHelper.ts

# omniclipを参照しながら実装
code vendor/omniclip/s/context/controllers/video-export/helpers/FFmpegHelper/helper.ts
code features/export/ffmpeg/FFmpegHelper.ts
```

### ステップ4: 実装ガイド参照
```bash
# 詳細な実装指示を確認
cat PHASE8_IMPLEMENTATION_DIRECTIVE.md
```

---

## 📝 各タスク完了時に報告すること

```markdown
## T0XX: [タスク名] 完了報告

### 実装内容
- ファイル: features/export/...
- omniclip参照: Line XX-YY
- 実装行数: XXX行

### omniclip移植状況
- [X] メソッドA（omniclip Line XX-YY）
- [X] メソッドB（omniclip Line XX-YY）

### テスト結果
- [X] 単体テスト通過
- [X] TypeScriptエラー0件

### 次のタスク
T0XX: [タスク名]
```

---

## 📚 参照ドキュメント

| ドキュメント                                                | 用途                           |
|-------------------------------------------------------|------------------------------|
| `PHASE8_IMPLEMENTATION_DIRECTIVE.md`                  | **Phase 8実装の詳細指示**（必読） |
| `PHASE1-6_VERIFICATION_REPORT_DETAILED.md`            | Phase 1-6検証レポート              |
| `specs/001-proedit-mvp-browser/tasks.md`              | 全タスク定義                      |
| `vendor/omniclip/s/context/controllers/video-export/` | omniclip参照コード                |

---

## ⚠️ 最終確認

### 理解度チェック

- [ ] Export機能が最優先であることを理解した
- [ ] Phase 8完了前に他のPhaseに着手しないことを理解した
- [ ] omniclipコードを参照しながら実装することを理解した
- [ ] tasks.mdの順序を守ることを理解した
- [ ] 各タスク完了時に報告することを理解した

### 質問がある場合

計画からの逸脱が必要な場合、**実装前に**報告すること:
- tasks.mdにないタスクの追加
- omniclipと異なるアプローチ
- 新しいライブラリの導入
- 技術的制約によるタスクスキップ

**報告方法**: GitHubでIssueを作成、またはチームに直接連絡

---

## 🎉 Phase 8完了後

Phase 8が完了したら:
1. **Phase 7**: Text Overlay Creation (T070-T079)
2. **Phase 9**: Auto-save and Recovery (T093-T100)
3. **Phase 10**: Polish & Cross-Cutting Concerns (T101-T110)

**現在地**: Phase 1-6完了 → **Phase 8 Export実装中**

---

**今すぐ開始してください！ 🚀**

*作成日: 2025年10月14日*
*優先度: 🔴 CRITICAL*
*推定時間: 12-16時間*
*Phase 8完了後のみ次のPhaseへ進むこと*

