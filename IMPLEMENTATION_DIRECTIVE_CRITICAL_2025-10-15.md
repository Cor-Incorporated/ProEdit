# 🚨 ProEdit MVP Critical Implementation Directive

**作成日**: 2025-10-15  
**緊急度**: CRITICAL - 即時対応必須  
**対象**: 開発チーム全員  
**根拠**: 両レビューア統合調査結果  
**準拠**: specs/001-proedit-mvp-browser/tasks.md 厳密遵守

---

## 📋 **統合調査結果サマリー**

### **レビューアA調査結果**
- **全体完成度**: 55% (デプロイ不可能)
- **Linterエラー**: 549個 (前回548個から微増)
- **主要問題**: Phase 7完全未実装、型安全性皆無

### **レビューアB調査結果**  
- **全体完成度**: 65% (ビルドエラーあり)
- **Production build**: FAILURE (Critical)
- **主要問題**: Constitutional違反、テストカバレッジ0%

### **統合判定**
```yaml
Status: 🚨 DEPLOYMENT BLOCKED
Critical Issues: 4件 (すべて即時修正必須)
High Issues: 3件
Medium Issues: 2件
```

---

## 🔥 **CRITICAL ISSUES - 即時修正必須**

### **C1: Production Build Failure**
**Impact**: アプリケーションがビルドできない = デプロイ100%不可能  
**Root Cause**: Client Component ← Server Component import違反

**修正指示 (tasks.mdの該当なし - 緊急修正)**:

```typescript
// ❌ 現状 (ビルドエラーの原因)
// features/export/utils/getMediaFile.ts
import { createClient } from '@/lib/supabase/server'  // Server Component

// ✅ 修正1: Server Actionに変更
// app/actions/media.ts に以下を追加
"use server"
export async function getMediaFileByHash(fileHash: string): Promise<File> {
  const supabase = await createClient() // Server Action内でOK
  
  const { data: mediaFile, error } = await supabase
    .from('media_files')
    .select('*')
    .eq('file_hash', fileHash)
    .single()

  if (error) throw error

  const { data: signedUrl } = await supabase.storage
    .from('media-files')
    .createSignedUrl(mediaFile.storage_path, 3600)

  const response = await fetch(signedUrl.signedUrl)
  const blob = await response.blob()
  
  return new File([blob], mediaFile.filename, { type: mediaFile.mime_type })
}

// ✅ 修正2: getMediaFile.ts を削除
// rm features/export/utils/getMediaFile.ts

// ✅ 修正3: Import文更新
// features/export/utils/ExportController.ts
- import { getMediaFileByHash } from './getMediaFile'
+ import { getMediaFileByHash } from '@/app/actions/media'
```

**検証コマンド**:
```bash
npm run build  # SUCCESS必須
```

**担当**: Backend Developer  
**期限**: 今日中 (1時間以内)

---

### **C2: Phase 7 Complete Absence**
**Constitutional Violation**: FR-007 "System MUST support text overlay creation"  
**Tasks**: T070-T079 (全10タスク 0%実装)

**tasks.md準拠実装指示**:

#### **T073: TextManager移植 (最優先)**
**移植元**: `vendor/omniclip/s/context/controllers/compositor/parts/text-manager.ts`  
**移植先**: `features/compositor/managers/TextManager.ts`

```typescript
// 必須実装内容 (omniclip Line 15-89の移植)
export class TextManager {
  private app: PIXI.Application
  private container: PIXI.Container
  private getMediaFileUrl: (mediaFileId: string) => Promise<string>
  private fonts: Map<string, boolean> = new Map() // 読み込み済みフォント

  constructor(
    app: PIXI.Application,
    getMediaFileUrl: (mediaFileId: string) => Promise<string>
  ) {
    this.app = app
    this.container = new PIXI.Container()
    this.getMediaFileUrl = getMediaFileUrl
    app.stage.addChild(this.container)
  }

  // omniclip移植メソッド (完全実装必須)
  createTextEffect(config: TextConfig): PIXI.Text {
    // omniclip Line 25-45の移植
    const text = new PIXI.Text(config.content, {
      fontFamily: config.fontFamily || 'Arial',
      fontSize: config.fontSize || 24,
      fill: config.color || '#ffffff',
      align: config.align || 'left',
      fontWeight: config.fontWeight || 'normal',
    })
    
    text.x = config.x || 0
    text.y = config.y || 0
    text.anchor.set(0.5)
    
    this.container.addChild(text)
    return text
  }

  updateTextStyle(text: PIXI.Text, style: Partial<TextStyle>): void {
    // omniclip Line 46-62の移植
    if (style.fontSize !== undefined) text.style.fontSize = style.fontSize
    if (style.color !== undefined) text.style.fill = style.color
    if (style.fontFamily !== undefined) {
      text.style.fontFamily = style.fontFamily
      void this.loadFont(style.fontFamily)
    }
    if (style.align !== undefined) text.style.align = style.align
  }

  async loadFont(fontFamily: string): Promise<void> {
    // omniclip Line 63-89の移植
    if (this.fonts.has(fontFamily)) return

    try {
      await document.fonts.load(`16px "${fontFamily}"`)
      this.fonts.set(fontFamily, true)
      console.log(`[TextManager] Font loaded: ${fontFamily}`)
    } catch (error) {
      console.warn(`[TextManager] Font failed to load: ${fontFamily}`, error)
      this.fonts.set(fontFamily, false)
    }
  }

  removeText(text: PIXI.Text): void {
    this.container.removeChild(text)
    text.destroy()
  }

  clear(): void {
    this.container.removeChildren()
  }
}

// 型定義 (types/effects.tsに追加)
export interface TextConfig {
  content: string
  x?: number
  y?: number
  fontFamily?: string
  fontSize?: number
  color?: string
  align?: 'left' | 'center' | 'right'
  fontWeight?: 'normal' | 'bold'
}

export interface TextStyle {
  fontFamily?: string
  fontSize?: number
  color?: string
  align?: 'left' | 'center' | 'right'
  fontWeight?: 'normal' | 'bold'
}
```

#### **T070: TextEditor Panel**
**ファイル**: `features/effects/components/TextEditor.tsx`  
**UI Framework**: shadcn/ui Sheet (tasks.md指定通り)

```typescript
"use client"

import { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FontPicker } from './FontPicker' // T071
import { ColorPicker } from './ColorPicker' // T072
import { TextEffect } from '@/types/effects'

interface TextEditorProps {
  effect?: TextEffect
  onSave: (effect: TextEffect) => void
  onClose: () => void
  open: boolean
}

export function TextEditor({ effect, onSave, onClose, open }: TextEditorProps) {
  const [content, setContent] = useState(effect?.content || 'Enter text')
  const [fontSize, setFontSize] = useState(effect?.fontSize || 24)
  const [fontFamily, setFontFamily] = useState(effect?.fontFamily || 'Arial')
  const [color, setColor] = useState(effect?.color || '#ffffff')
  const [x, setX] = useState(effect?.x || 100)
  const [y, setY] = useState(effect?.y || 100)

  const handleSave = () => {
    const textEffect: TextEffect = {
      ...effect,
      id: effect?.id || crypto.randomUUID(),
      type: 'text',
      content,
      fontSize,
      fontFamily,
      color,
      x,
      y,
      start_at_position: effect?.start_at_position || 0,
      duration: effect?.duration || 5000,
      track_number: effect?.track_number || 1,
      start: 0,
      end: content.length
    }
    onSave(textEffect)
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle>Text Editor</SheetTitle>
          <SheetDescription>
            Create and edit text overlays
          </SheetDescription>
        </SheetHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="content">Text Content</Label>
            <Input
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label>Font</Label>
            <FontPicker
              value={fontFamily}
              onChange={setFontFamily}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="fontSize">Font Size</Label>
            <Input
              id="fontSize"
              type="number"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              min="8"
              max="200"
            />
          </div>

          <div className="grid gap-2">
            <Label>Color</Label>
            <ColorPicker
              value={color}
              onChange={setColor}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="x">X Position</Label>
              <Input
                id="x"
                type="number"
                value={x}
                onChange={(e) => setX(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="y">Y Position</Label>
              <Input
                id="y"
                type="number"
                value={y}
                onChange={(e) => setY(Number(e.target.value))}
              />
            </div>
          </div>

          <Button onClick={handleSave}>
            Save Text
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

#### **T071: FontPicker Component**
**ファイル**: `features/effects/components/FontPicker.tsx`  
**UI Framework**: shadcn/ui Select (tasks.md指定通り)

```typescript
"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// tasks.mdに基づく標準フォント一覧
const SUPPORTED_FONTS = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Verdana',
  'Courier New',
  'Impact',
  'Comic Sans MS',
  'Trebuchet MS',
  'Arial Black'
] as const

interface FontPickerProps {
  value: string
  onChange: (font: string) => void
}

export function FontPicker({ value, onChange }: FontPickerProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select font" />
      </SelectTrigger>
      <SelectContent>
        {SUPPORTED_FONTS.map((font) => (
          <SelectItem key={font} value={font}>
            <span style={{ fontFamily: font }}>{font}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
```

#### **T072: ColorPicker Component**
**ファイル**: `features/effects/components/ColorPicker.tsx`  
**UI Framework**: shadcn/ui Popover (tasks.md指定通り)

```typescript
"use client"

import { useState } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const PRESET_COLORS = [
  '#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff',
  '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080'
]

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start"
        >
          <div
            className="mr-2 h-4 w-4 rounded border"
            style={{ backgroundColor: value }}
          />
          {value}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div>
            <label htmlFor="color-input" className="text-sm font-medium">
              Custom Color
            </label>
            <Input
              id="color-input"
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Preset Colors</label>
            <div className="mt-2 grid grid-cols-5 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  className="h-8 w-8 rounded border-2 border-muted hover:border-ring"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    onChange(color)
                    setOpen(false)
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
```

#### **T074-T079: 残りタスクの実装指示**

**T074**: `features/compositor/utils/text.ts`
```typescript
// PIXI.Text creation utilities
import * as PIXI from 'pixi.js'
import { TextConfig } from '@/types/effects'

export function createPIXIText(config: TextConfig): PIXI.Text {
  // TextManagerから分離されたユーティリティ関数
}
```

**T075**: `features/effects/components/TextStyleControls.tsx` - スタイル詳細制御  
**T076**: `app/actions/effects.ts` - Text CRUD拡張  
**T077**: Timeline統合 - EffectBlock.tsxにText表示  
**T078**: `features/effects/presets/text.ts` - アニメーション定義  
**T079**: Canvas real-time updates - CompositorにTextManager統合  

**Phase 7完了基準**:
```bash
# 必須ファイル存在確認
ls features/compositor/managers/TextManager.ts
ls features/effects/components/TextEditor.tsx
ls features/effects/components/FontPicker.tsx
ls features/effects/components/ColorPicker.tsx

# TypeScript確認
npx tsc --noEmit  # エラー0件

# 手動テスト
# 1. EditorでTextボタンクリック
# 2. TextEditor panel表示
# 3. テキスト入力・スタイル変更
# 4. Canvas上でテキスト表示確認
```

**担当**: Frontend Developer  
**期限**: 5営業日以内

---

### **C3: Test Coverage Constitutional Violation**
**Requirement**: "Test coverage MUST exceed 70%"  
**Current**: 0%

**E2Eテストセットアップ (tasks.mdに記載なし - Constitutional必須)**:

```bash
# Playwright インストール
npm install -D @playwright/test
npx playwright install

# テストディレクトリ作成
mkdir -p tests/e2e tests/unit tests/integration
```

**必須E2Eシナリオ**:
```typescript
// tests/e2e/full-workflow.spec.ts
import { test, expect } from '@playwright/test'

test.describe('ProEdit Full Workflow', () => {
  test('should complete video editing with text overlay', async ({ page }) => {
    // 1. Authentication
    await page.goto('/login')
    await page.click('[data-testid="google-login"]')
    await expect(page).toHaveURL(/\/editor/)

    // 2. Project Creation
    await page.click('[data-testid="new-project"]')
    await page.fill('[data-testid="project-name"]', 'E2E Test Project')
    await page.click('[data-testid="create-project"]')

    // 3. Media Upload
    await page.setInputFiles(
      '[data-testid="file-input"]', 
      'tests/fixtures/test-video.mp4'
    )
    await expect(page.locator('[data-testid="media-item"]')).toBeVisible()

    // 4. Timeline Placement
    await page.dragAndDrop(
      '[data-testid="media-item"]',
      '[data-testid="timeline-track"]'
    )
    await expect(page.locator('[data-testid="effect-block"]')).toBeVisible()

    // 5. Text Overlay (Phase 7実装後)
    await page.click('[data-testid="add-text"]')
    await page.fill('[data-testid="text-content"]', 'Test Overlay')
    await page.click('[data-testid="save-text"]')
    await expect(page.locator('canvas')).toContainText('Test Overlay')

    // 6. Export
    await page.click('[data-testid="export-button"]')
    await page.click('[data-testid="export-720p"]')
    
    // 7. Export Completion
    await expect(page.locator('[data-testid="export-complete"]')).toBeVisible({
      timeout: 60000
    })
  })
})
```

**単体テスト実装**:
```typescript
// tests/unit/TextManager.test.ts
import { TextManager } from '@/features/compositor/managers/TextManager'
import * as PIXI from 'pixi.js'

describe('TextManager', () => {
  let app: PIXI.Application
  let textManager: TextManager

  beforeEach(() => {
    app = new PIXI.Application()
    textManager = new TextManager(app, () => Promise.resolve(''))
  })

  it('should create text effect', () => {
    const text = textManager.createTextEffect({
      content: 'Test Text',
      fontSize: 24,
      color: '#ffffff'
    })
    
    expect(text.text).toBe('Test Text')
    expect(text.style.fontSize).toBe(24)
    expect(text.style.fill).toBe('#ffffff')
  })

  it('should load fonts', async () => {
    await textManager.loadFont('Arial')
    // Font loading verification
  })
})
```

**カバレッジ設定**:
```json
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      reporter: ['text', 'json', 'html'],
      lines: 70,
      functions: 70,
      branches: 70,
      statements: 70
    }
  }
})
```

**担当**: QA Lead  
**期限**: 3営業日以内

---

### **C4: ESLint Error Resolution**
**Current**: 549 errors, 119 warnings  
**Target**: 0 errors, 0 warnings

**段階的修正戦略**:

```bash
# Stage 1: Auto-fix (10分)
npx eslint . --ext .ts,.tsx --fix

# Stage 2: any型の手動置換 (2時間)
# 対象ファイル特定
grep -r "any" features/ app/ stores/ --include="*.ts" --include="*.tsx" > any-usage.txt

# 頻出パターンの修正例
# Before: data: any
# After:  data: MediaFile | ProjectData | EffectData

# Stage 3: unused variables (30分)
# @typescript-eslint/no-unused-vars の修正

# Stage 4: React rules (30分)  
# react/no-unescaped-entities の修正

# 検証
npx eslint . --ext .ts,.tsx --max-warnings 0
# 必須: エラー0件、警告0件
```

**specific修正例**:
```typescript
// app/actions/effects.ts:44
// Before
function updateEffect(id: string, data: any) {

// After  
function updateEffect(id: string, data: Partial<Effect>) {

// app/not-found.tsx:23
// Before
<p>The page you're looking for doesn't exist.</p>

// After
<p>The page you&apos;re looking for doesn&apos;t exist.</p>
```

**担当**: 全開発者 (分担)  
**期限**: 2営業日以内

---

## 🟠 **HIGH PRIORITY ISSUES**

### **H1: Phase 8 Export Integration Completion**
**Current**: 80% complete, UI統合済みだがビルドエラーあり

**修正指示** (C1のビルドエラー修正後):
- ✅ getMediaFileByHash修正完了後
- ✅ ExportDialog進捗コールバック動作確認  
- ✅ renderFrameForExport API動作確認

### **H2: Phase 10 Polish Implementation**
**Tasks**: T101-T110 (tasks.md Phase 10)

**実装優先順位**:
1. T101: Loading states (shadcn/ui Skeleton)
2. T102: Error handling (Toast notifications)  
3. T103: Tooltips (shadcn/ui Tooltip)
4. T104: Performance optimization
5. T105: Keyboard shortcut help

### **H3: omniclip移植品質向上**
**TextManager移植後の追加移植**:
- FilterManager (エフェクトフィルター)
- AnimationManager (アニメーション)
- TransitionManager (トランジション)

---

## 📋 **実装スケジュール (厳守)**

### **Day 1 (今日) - CRITICAL修正**
```
09:00-10:00: C1 Build Error修正 (Backend Dev)
10:00-12:00: C4 ESLint Error修正 開始 (全員)
14:00-16:00: C3 E2E Setup (QA Lead)  
16:00-18:00: C2 Phase 7実装 開始 (Frontend Dev)
```

### **Day 2-5 - Phase 7完全実装**
```
T073: TextManager移植 (Day 2-3)
T070-T072: UI Components (Day 4)  
T074-T079: 統合・テスト (Day 5)
```

### **Day 6-10 - 品質向上**
```
Phase 10実装
テストカバレッジ70%達成
最終統合テスト
```

---

## ✅ **検証ゲート (必須通過基準)**

### **Daily Check**
```bash
# 毎日実行必須
npx tsc --noEmit && echo "TypeScript: PASS" || echo "TypeScript: FAIL"
npx eslint . --ext .ts,.tsx --max-warnings 0 && echo "ESLint: PASS" || echo "ESLint: FAIL"  
npm run build && echo "Build: PASS" || echo "Build: FAIL"
```

### **Phase 7完了ゲート**
```bash
# Phase 7完了時必須チェック
test -f features/compositor/managers/TextManager.ts || exit 1
test -f features/effects/components/TextEditor.tsx || exit 1
grep -r "FR-007" features/ > /dev/null || exit 1  # Constitutional確認
npm test -- --testPathPattern=text && echo "Text Tests: PASS"
```

### **デプロイ前最終ゲート**
```bash
# すべてPASSが必須
npm run build                                    # Build success
npx tsc --noEmit                                # 0 TypeScript errors  
npx eslint . --ext .ts,.tsx --max-warnings 0   # 0 ESLint errors
npx playwright test                             # All E2E tests pass
npm run test:coverage                           # Coverage > 70%
```

---

## 🚫 **絶対禁止事項 (Constitutional Rules)**

### **独自判断の完全禁止**
```
❌ "だいたい動くから完了"
❌ "エラーは後で修正"  
❌ "テストは省略"
❌ "tasks.mdと違うがより良い方法"

✅ tasks.md完全準拠
✅ Constitutional要件100%遵守
✅ エラー0件での完了
✅ 相互レビュー必須
```

### **品質基準の妥協禁止**
```
- TypeScript errors: 0 (許容なし)
- ESLint errors: 0 (許容なし)
- Test coverage: 70%以上 (Constitutional)
- Build success: 必須 (デプロイ前提)
```

---

## 📋 **報告フォーマット (厳守)**

### **Daily Progress Report**
```markdown
# Daily Progress Report - [YYYY-MM-DD]

## Completed Tasks
- [x] C1: Build Error修正 - ✅ COMPLETED
- [x] T073: TextManager移植 (50%) - 🚧 IN PROGRESS

## Verification Results  
```bash
$ npx tsc --noEmit
[結果貼り付け]

$ npx eslint . --ext .ts,.tsx --max-warnings 0
[結果貼り付け]

$ npm run build  
[結果貼り付け]
```

## Tomorrow's Plan
- [ ] T073: TextManager移植完了
- [ ] T070: TextEditor実装開始

## Blockers
- なし / [具体的問題記述]
```

### **Critical Task Completion Report**
```markdown  
# Critical Task Completion: [Task ID]

## Implementation Details
**Task**: [tasks.mdのタスク番号と内容]
**Files Modified**: 
- `[filepath]` - [変更内容]

## Verification
**TypeScript**: ✅ 0 errors
**ESLint**: ✅ 0 errors  
**Build**: ✅ SUCCESS
**Tests**: ✅ ALL PASS

## Constitutional Compliance
- [ ] FR-XXX: [該当要件] - ✅ COMPLIANT

## Manual Testing
1. [具体的テスト手順1] - ✅ PASS
2. [具体的テスト手順2] - ✅ PASS

**Ready for Review**: ✅ YES / ❌ NO
```

---

## 🎯 **Success Metrics (測定可能)**

### **Technical Metrics**
```yaml
Code Quality:
  TypeScript_Errors: 0
  ESLint_Errors: 0
  ESLint_Warnings: 0
  Build_Status: SUCCESS

Functionality:
  Phase_7_Tasks: 10/10
  Constitutional_FR_007: COMPLIANT
  Constitutional_FR_009: COMPLIANT (既達成)

Testing:
  E2E_Tests: >5 scenarios
  Unit_Tests: >20 tests  
  Coverage_Line: >70%
  Coverage_Function: >70%
```

### **Business Metrics**
```yaml
User_Stories:
  US1_Auth: 100% (既達成)
  US2_Media: 100% (既達成)  
  US3_Preview: 100% (既達成)
  US4_Editing: 100% (既達成)
  US5_Text: 0% → 100% (Critical)
  US6_Export: 80% → 100%
  US7_Autosave: 100% (既達成)
```

---

## 📞 **Escalation Process**

### **Issue発生時の対応**
```
Level 1: 30分で解決できない → チーム内相談
Level 2: 2時間で解決できない → Tech Lead escalation  
Level 3: Constitutional違反可能性 → 即座にProject Manager通知
Level 4: デプロイブロッカー → 即座にステークホルダー通知
```

### **緊急連絡先**
- **Technical Issues**: Tech Lead
- **Constitutional Questions**: Project Manager  
- **Build/Deploy Issues**: DevOps Lead
- **Timeline Concerns**: Product Owner

---

**この実装指示書は、tasks.mdに厳密準拠し、両レビューアの統合調査結果に基づく確実で検証可能な指示です。独自判断・妥協・省略は一切認められません。全開発者は本指示書に従い、段階的検証を経て、Constitutional要件を100%満たす実装を完了してください。**

---
**Document Version**: 2.0.0  
**Authority**: 統合レビューア調査結果  
**Compliance**: specs/001-proedit-mvp-browser/tasks.md  
**Next Review**: C1修正完了時  
**Final Approval Required**: Technical Lead + Product Owner
