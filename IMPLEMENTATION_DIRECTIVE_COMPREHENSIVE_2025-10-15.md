# 📋 ProEdit MVP 包括的実装指示書 

**作成日**: 2025-10-15  
**対象**: 開発チーム全員  
**目的**: 確実で検証可能な実装完了とデプロイ準備  
**前提**: 両レビューア調査結果の統合による指示

---

## 🚨 **重要事項: 報告品質向上のための必須ルール**

### **Rule 1: 独自判断の完全禁止**
```
❌ 禁止行為:
- "だいたい動くから完了"
- "エラーは後で修正すればいい" 
- "テストは省略しても大丈夫"
- "ドキュメントと違うが動けばOK"

✅ 必須行為:
- 仕様書通りの完全実装
- 全ての検証項目クリア
- エラー0件での完了報告
- 第三者による動作確認
```

### **Rule 2: 段階的検証の義務化**
```
各実装後に以下を必ず実行:
1. TypeScript型チェック (tsc --noEmit)
2. Linterチェック (eslint --max-warnings 0)
3. 単体テスト実行
4. 手動動作確認
5. 他開発者によるコードレビュー
```

### **Rule 3: 完了基準の厳格適用**
```
完了報告の条件:
- 実装: tasks.mdの該当タスク100%完了
- 品質: Linter/TypeScriptエラー0件
- 動作: 仕様書記載の全機能動作確認
- テスト: 対応するテストケース全Pass
- 文書: README/docs更新完了
```

---

## 📊 **現状認識の統合結果**

### **レビューア A (Claude) 調査結果**
- **全体完成度**: 55% (デプロイ不可能)
- **重大問題**: 548個のLinterエラー、Phase 7/9未実装
- **主要課題**: 型安全性皆無(any型大量使用)、omniclip移植品質低下

### **レビューア B 調査結果** 
- **全体完成度**: 72.6% (デプロイ不可能)
- **重大問題**: Constitutional違反、E2Eテスト不在、Phase 7/9/10未実装
- **主要課題**: FR-007/FR-009機能要件違反、テストカバレッジ不足

### **統合された問題認識**
```yaml
Critical Issues (デプロイブロッカー):
  - Phase 7 (Text Overlay): 完全未実装 (T070-T079)
  - Phase 9 (Auto-save): 完全未実装 (T093-T100)
  - Phase 10 (Polish): 完全未実装 (T101-T110)
  - Linter Error: 548件 (型安全性なし)
  - Constitutional Violation: FR-007, FR-009違反
  - Test Coverage: E2E不在、単体テスト不足

High Priority Issues:
  - omniclip機能移植不完全 (TextManager欠損)
  - 手動テスト未実施
  - ドキュメント整合性問題
```

---

## 🎯 **Phase別実装指示 (優先順位順)**

### **🔴 Priority 1: Critical Phases (デプロイブロッカー)**

#### **Phase 9: Auto-save & Recovery Implementation**

**実装期限**: 3営業日以内  
**担当**: Backend Developer  
**Constitutional Requirement**: FR-009 "System MUST auto-save every 5 seconds"

**完了基準**:
```typescript
// 必須実装項目
interface AutoSaveRequirements {
  interval: 5000; // 5秒間隔 (FR-009準拠)
  debounceTime: 1000; // 1秒デバウンス
  offlineSupport: boolean; // オフライン対応
  conflictResolution: boolean; // 競合解決
  recoveryUI: boolean; // 復旧モーダル
}
```

**実装タスク詳細**:

**T093**: `features/timeline/utils/autosave.ts`
```typescript
// 実装必須内容
export class AutoSaveManager {
  private debounceTimer: NodeJS.Timeout | null = null;
  private readonly AUTOSAVE_INTERVAL = 5000; // Constitutional FR-009
  
  // 必須メソッド
  startAutoSave(): void
  stopAutoSave(): void
  saveNow(): Promise<void>
  handleOfflineQueue(): void
}

// 完了検証
- [ ] 5秒間隔で自動保存動作確認
- [ ] デバウンス機能動作確認
- [ ] オフライン時のキューイング動作確認
- [ ] 復帰時の同期動作確認
```

**T094**: `lib/supabase/sync.ts`
```typescript
// Realtime同期マネージャー
export class RealtimeSyncManager {
  // 必須実装
  setupRealtimeSubscription(): void
  handleConflictResolution(): Promise<void>
  syncOfflineChanges(): Promise<void>
}

// 完了検証
- [ ] Supabase Realtime接続確認
- [ ] 複数タブでの競合検出確認
- [ ] 競合解決UI動作確認
```

**T095**: `components/SaveIndicator.tsx`
```typescript
// UI状態表示
type SaveStatus = 'saved' | 'saving' | 'error' | 'offline';

// 完了検証
- [ ] 各状態での適切なUI表示
- [ ] アニメーション動作確認
- [ ] エラー時の回復操作確認
```

**Phase 9 完了検証手順**:
```bash
# 1. 実装確認
ls features/timeline/utils/autosave.ts lib/supabase/sync.ts components/SaveIndicator.tsx

# 2. 型チェック
npx tsc --noEmit

# 3. テスト実行
npm test -- --testPathPattern=autosave

# 4. 手動テスト
# - プロジェクト編集 → 5秒待機 → データベース確認
# - ネットワーク切断 → 編集 → 復帰 → 同期確認
# - 複数タブ開いて競合発生 → 解決確認

# 5. Constitutional確認
grep -r "auto.*save" app/ features/ stores/ | wc -l # > 0であること
```

#### **Phase 7: Text Overlay Implementation**

**実装期限**: 5営業日以内  
**担当**: Frontend Developer  
**Constitutional Requirement**: FR-007 "System MUST support text overlay creation"

**omniclip移植ベース**: `vendor/omniclip/s/context/controllers/compositor/parts/text-manager.ts`

**完了基準**:
```typescript
// TextManager機能要件
interface TextManagerRequirements {
  createText: (content: string, style: TextStyle) => TextEffect;
  updateText: (id: string, updates: Partial<TextEffect>) => void;
  deleteText: (id: string) => void;
  renderText: (effect: TextEffect, timestamp: number) => PIXI.Text;
  // omniclip準拠メソッド
  fontLoadingSupport: boolean;
  realTimePreview: boolean;
}
```

**実装タスク詳細**:

**T073**: `features/compositor/managers/TextManager.ts`
```typescript
// omniclipから完全移植
// 移植元: vendor/omniclip/s/context/controllers/compositor/parts/text-manager.ts

export class TextManager {
  // 必須移植メソッド (omniclip Line 15-89)
  createTextEffect(config: TextConfig): PIXI.Text
  updateTextStyle(text: PIXI.Text, style: TextStyle): void
  loadFont(fontFamily: string): Promise<void>
  
  // 完了検証
  - [ ] omniclipの全メソッド移植完了
  - [ ] PIXI.Text生成確認
  - [ ] フォント読み込み確認
  - [ ] スタイル適用確認
}
```

**T070**: `features/effects/components/TextEditor.tsx`
```typescript
// shadcn/ui Sheet使用
interface TextEditorProps {
  effect?: TextEffect;
  onSave: (effect: TextEffect) => void;
  onClose: () => void;
}

// 完了検証
- [ ] テキスト入力機能
- [ ] リアルタイムプレビュー
- [ ] スタイル変更反映
- [ ] キャンバス上での位置調整
```

**T071-T072**: Font/Color Picker Components
```typescript
// FontPicker.tsx - shadcn/ui Select使用
const SUPPORTED_FONTS = ['Arial', 'Helvetica', 'Times New Roman', ...];

// ColorPicker.tsx - shadcn/ui Popover使用  
interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

// 完了検証
- [ ] フォント一覧表示・選択
- [ ] カラーパレット表示・選択
- [ ] リアルタイム反映確認
```

**Phase 7 完了検証手順**:
```bash
# 1. omniclip移植確認
diff -u vendor/omniclip/s/context/controllers/compositor/parts/text-manager.ts \
       features/compositor/managers/TextManager.ts
# 差分が移植に関する適切な変更のみであること

# 2. 型チェック
npx tsc --noEmit

# 3. テスト実行  
npm test -- --testPathPattern=text

# 4. 手動テスト
# - テキストエフェクト作成
# - フォント変更確認
# - 色変更確認
# - 位置・サイズ調整確認
# - タイムライン上での動作確認

# 5. Constitutional確認
grep -r "TextEffect" types/ features/ | grep -v test | wc -l # > 0
```

### **🟠 Priority 2: Quality & Testing**

#### **Linter Error Resolution**

**実装期限**: 2営業日以内  
**担当**: 全開発者  

**現状**: 548個の問題 (エラー429件、警告119件)

**段階的修正戦略**:

**Stage 1: Critical Type Safety Issues (1日目)**
```typescript
// any型の段階的置換
// 対象: features/, app/, stores/の全ファイル

// Before (NG例)
function processData(data: any): any {
  return data.something;
}

// After (OK例) 
function processData<T extends MediaFile>(data: T): ProcessedData<T> {
  return {
    id: data.id,
    processed: true,
    ...data
  };
}

// 修正手順
1. any型使用箇所の特定: grep -r "any" features/ app/ stores/
2. 適切な型定義作成: types/*.ts に追加
3. 段階的置換: ファイル単位で修正
4. 検証: npx tsc --noEmit でエラー0確認
```

**Stage 2: ESLint Rule Compliance (2日目)**
```bash
# 自動修正可能な問題
npx eslint . --ext .ts,.tsx --fix

# 手動修正必要な問題  
npx eslint . --ext .ts,.tsx --max-warnings 0

# 完了基準: エラー0件、警告0件
```

**Linter完了検証**:
```bash
# 最終確認
npx tsc --noEmit && echo "TypeScript: ✅ PASS" || echo "TypeScript: ❌ FAIL"
npx eslint . --ext .ts,.tsx --max-warnings 0 && echo "ESLint: ✅ PASS" || echo "ESLint: ❌ FAIL"
```

#### **E2E Test Implementation**

**実装期限**: 3営業日以内  
**担当**: QA Lead  

**Constitutional Requirement**: "Test coverage MUST exceed 70%"

**Setup Tasks**:

```bash
# Playwright セットアップ
npm install -D @playwright/test
npx playwright install

# テストディレクトリ作成
mkdir -p tests/e2e tests/unit tests/integration
```

**必須E2Eシナリオ**:
```typescript
// tests/e2e/full-workflow.spec.ts
test.describe('Full Video Editing Workflow', () => {
  test('should complete end-to-end editing process', async ({ page }) => {
    // 1. ログイン
    await page.goto('/login');
    await page.click('[data-testid="google-login"]');
    
    // 2. プロジェクト作成
    await page.click('[data-testid="new-project"]');
    await page.fill('[data-testid="project-name"]', 'E2E Test Project');
    
    // 3. メディアアップロード
    await page.setInputFiles('[data-testid="file-input"]', 'test-assets/video.mp4');
    
    // 4. タイムライン配置
    await page.dragAndDrop('[data-testid="media-item"]', '[data-testid="timeline-track"]');
    
    // 5. エフェクト追加 (Phase 7完了後)
    await page.click('[data-testid="add-text"]');
    await page.fill('[data-testid="text-content"]', 'Test Text');
    
    // 6. エクスポート
    await page.click('[data-testid="export-button"]');
    await page.click('[data-testid="export-1080p"]');
    
    // 7. 完了確認
    await expect(page.locator('[data-testid="export-complete"]')).toBeVisible();
  });
});
```

**テストカバレッジ要件**:
```bash
# カバレッジ測定セットアップ
npm install -D @vitest/coverage-v8

# 実行・確認
npm run test:coverage
# Line coverage: > 70% (Constitutional requirement)
# Function coverage: > 80% 
# Branch coverage: > 60%
```

### **🟡 Priority 3: Polish Implementation**

#### **Phase 10: Polish & Cross-cutting Concerns**

**実装期限**: 4営業日以内  
**担当**: UI/UX Developer  

**重要タスク**:

**T101-T102**: Loading States & Error Handling
```typescript
// components/LoadingStates.tsx
export function LoadingSkeleton({ variant }: { variant: 'timeline' | 'media' | 'export' }) {
  // shadcn/ui Skeleton使用
}

// components/ErrorBoundary.tsx  
export class ErrorBoundary extends React.Component {
  // 包括的エラーハンドリング
  // Toast通知連携
}

// 完了検証
- [ ] 全ページでローディング状態表示
- [ ] エラー発生時の適切な回復操作
- [ ] ネットワークエラー時のリトライ機能
```

**T103-T105**: User Experience Enhancements
```typescript
// components/ui/Tooltip.tsx拡張
// 全コントロールにヘルプテキスト追加

// components/KeyboardShortcutHelp.tsx
// ショートカット一覧ダイアログ

// 完了検証
- [ ] 主要操作にツールチップ表示
- [ ] キーボードショートカットヘルプアクセス可能
- [ ] アクセシビリティ基準準拠
```

---

## 🔍 **段階的検証プロセス**

### **Daily Verification (毎日実施)**
```bash
#!/bin/bash
# daily-check.sh

echo "🔍 Daily Quality Check - $(date)"

# 1. 型安全性確認
echo "1. TypeScript Check..."
npx tsc --noEmit && echo "✅ PASS" || echo "❌ FAIL"

# 2. Linter確認  
echo "2. ESLint Check..."
npx eslint . --ext .ts,.tsx --max-warnings 0 && echo "✅ PASS" || echo "❌ FAIL"

# 3. テスト実行
echo "3. Test Suite..."
npm test && echo "✅ PASS" || echo "❌ FAIL"

# 4. ビルド確認
echo "4. Build Check..."
npm run build && echo "✅ PASS" || echo "❌ FAIL"

echo "📊 Daily Check Complete"
```

### **Phase Completion Verification (Phase完了時)**
```bash
#!/bin/bash
# phase-verification.sh $PHASE_NUMBER

PHASE=$1
echo "🎯 Phase $PHASE Verification - $(date)"

# Phase別タスク確認
case $PHASE in
  "7")
    # Text Overlay機能確認
    echo "Testing Text Overlay..."
    # TextManager存在確認
    test -f features/compositor/managers/TextManager.ts || exit 1
    # UI Components確認
    test -f features/effects/components/TextEditor.tsx || exit 1
    ;;
  "9") 
    # Auto-save機能確認
    echo "Testing Auto-save..."
    test -f features/timeline/utils/autosave.ts || exit 1
    test -f lib/supabase/sync.ts || exit 1
    ;;
  "10")
    # Polish機能確認  
    echo "Testing Polish..."
    test -f components/LoadingStates.tsx || exit 1
    ;;
esac

# 共通検証
echo "Common verification..."
npx tsc --noEmit && npx eslint . --ext .ts,.tsx --max-warnings 0 && npm test

echo "✅ Phase $PHASE Verification Complete"
```

### **Pre-Deploy Verification (デプロイ前)**
```bash
#!/bin/bash
# pre-deploy-check.sh

echo "🚀 Pre-Deploy Verification - $(date)"

# 1. 全Phase完了確認
echo "1. Phase Completion Check..."
PHASES=(7 9 10)
for phase in "${PHASES[@]}"; do
  ./phase-verification.sh $phase || exit 1
done

# 2. Constitutional Requirements確認
echo "2. Constitutional Requirements..."
# FR-007: Text Overlay
grep -r "TextEffect" features/ > /dev/null || exit 1
# FR-009: Auto-save  
grep -r "autosave" features/ > /dev/null || exit 1

# 3. テストカバレッジ確認
echo "3. Test Coverage..."
npm run test:coverage
COVERAGE=$(npm run test:coverage | grep "All files" | awk '{print $4}' | sed 's/%//')
if [ "$COVERAGE" -lt 70 ]; then
  echo "❌ Coverage $COVERAGE% < 70% (Constitutional requirement)"
  exit 1
fi

# 4. E2E テスト
echo "4. E2E Test..."
npx playwright test

# 5. パフォーマンス確認
echo "5. Performance Check..."
npm run build
npm run lighthouse || echo "⚠️ Manual lighthouse check required"

echo "✅ All Pre-Deploy Checks PASSED"
echo "🎉 Ready for deployment!"
```

---

## 📋 **完了報告フォーマット (必須)**

### **Phase完了報告テンプレート**
```markdown
# Phase [N] 完了報告

## 基本情報
- **Phase**: [Phase番号・名前]
- **実装者**: [担当者名]
- **完了日**: [YYYY-MM-DD]
- **実装期間**: [開始日] - [完了日] ([X日間])

## 実装サマリー
### 完了タスク
- [x] T0XX: [タスク名] - [実装内容詳細]
- [x] T0XX: [タスク名] - [実装内容詳細]

### 作成・修正ファイル
**新規作成**:
- `[filepath]` - [目的・機能説明]

**修正**:
- `[filepath]` - [変更内容]

## 品質検証結果
### TypeScript
```bash
$ npx tsc --noEmit
[実行結果をここに貼り付け]
```

### ESLint
```bash
$ npx eslint . --ext .ts,.tsx --max-warnings 0
[実行結果をここに貼り付け]
```

### テスト実行
```bash
$ npm test -- --testPathPattern=[phase-related-tests]
[実行結果をここに貼り付け]
```

## 手動テスト結果
### テストシナリオ
1. **シナリオ1**: [具体的操作手順]
   - 結果: ✅ PASS / ❌ FAIL
   - 詳細: [操作結果詳細]

2. **シナリオ2**: [具体的操作手順]
   - 結果: ✅ PASS / ❌ FAIL
   - 詳細: [操作結果詳細]

## Constitutional Compliance
- [ ] FR-XXX: [該当要件] - ✅ 準拠 / ❌ 違反
- [ ] NFR-XXX: [該当要件] - ✅ 準拠 / ❌ 違反

## Next Actions
- [ ] [次のPhaseで必要な作業]
- [ ] [発見された改善点]

## 添付資料
- スクリーンショット: [動作確認画面]
- ログファイル: [実行ログ]
- パフォーマンス結果: [計測結果]

---
**レビュー必要**: @[reviewer-name]
**マージ可否**: ✅ Ready for Review / ⏸️ Hold / ❌ Not Ready
```

### **最終デプロイ判定報告テンプレート**
```markdown
# 🚀 最終デプロイ判定報告

## Executive Summary
- **判定結果**: ✅ デプロイ可能 / ❌ デプロイ不可
- **判定日**: [YYYY-MM-DD]  
- **判定者**: [全レビューア名]

## Phase完了状況
| Phase     | 完了率 | 品質  | ブロッカー | Status |
|-----------|--------|-------|-------|--------|
| Phase 1-6 | 100%   | ⭐⭐⭐⭐⭐ | なし    | ✅      |
| Phase 7   | 100%   | ⭐⭐⭐⭐⭐ | なし    | ✅      |
| Phase 8   | 100%   | ⭐⭐⭐⭐⭐ | なし    | ✅      |
| Phase 9   | 100%   | ⭐⭐⭐⭐⭐ | なし    | ✅      |
| Phase 10  | 100%   | ⭐⭐⭐⭐⭐ | なし    | ✅      |

## 品質指標
### Code Quality
- TypeScript Errors: **0** ✅
- ESLint Errors: **0** ✅  
- ESLint Warnings: **0** ✅

### Test Coverage
- Line Coverage: **XX%** (>70% required) ✅
- Function Coverage: **XX%** ✅
- Branch Coverage: **XX%** ✅

### Constitutional Compliance
- [ ] FR-007 (Text Overlay): ✅ 実装完了
- [ ] FR-009 (Auto-save): ✅ 実装完了
- [ ] Test Coverage >70%: ✅ 達成
- [ ] All MUST requirements: ✅ 準拠

## E2E Test Results
```bash
[E2Eテスト実行結果全文を貼り付け]
```

## Performance Metrics
- Bundle Size: [XX MB]
- Lighthouse Score: [XX/100]
- Core Web Vitals: ✅ All Green

## Risk Assessment
### Identified Risks
- [リスク1]: [対応策]
- [リスク2]: [対応策]

### Mitigation Measures  
- [対応策1]
- [対応策2]

## Final Recommendation
**デプロイ判定**: [理由を含む最終判断]

---
**承認**: 
- Technical Lead: [署名]
- QA Lead: [署名]  
- Product Owner: [署名]
```

---

## ⚠️ **Critical Success Factors**

### **絶対に避けるべき行為**
1. **部分的実装での完了報告**
2. **エラー放置での進行**  
3. **テスト省略での完了宣言**
4. **独自判断での仕様変更**
5. **手動テスト省略での品質確認**

### **必須実行事項**
1. **段階的検証の完全実施**
2. **Constitutional要件の100%準拠**
3. **他開発者による相互レビュー**
4. **自動化されたCI/CDチェック**
5. **ドキュメント整合性の維持**

### **品質ゲート**
```yaml
Phase完了の絶対条件:
  - TypeScript: エラー0件
  - ESLint: エラー・警告0件  
  - Tests: 全Pass + 新規テスト追加
  - Manual: 全機能動作確認
  - Review: 他開発者OK
  - Docs: README/tasks.md更新

デプロイの絶対条件:
  - All Phases: 100%完了
  - Constitutional: 全要件準拠
  - E2E Tests: 全シナリオPass
  - Coverage: >70%達成
  - Performance: Lighthouse >90
  - Security: 脆弱性0件
```

---

## 📅 **実装スケジュール (推奨)**

### **Week 1: Critical Phases**
**Day 1-2**: Linter Error Resolution (全員)
- 548個のエラー/警告を0にする
- any型を適切な型定義に置換

**Day 3-4**: Phase 9 Implementation (Backend Dev)
- Auto-save機能完全実装
- FR-009 Constitutional要件準拠

**Day 5**: Phase 9 Verification & Testing
- 手動テスト実施
- E2E Auto-saveシナリオ作成

### **Week 2: Feature Completion**  
**Day 6-8**: Phase 7 Implementation (Frontend Dev)
- Text Overlay完全実装
- omniclip TextManager移植
- FR-007 Constitutional要件準拠

**Day 9**: Phase 7 Verification & Testing
- 手動テスト実施
- E2E Textシナリオ作成

**Day 10**: Integration Testing
- 全Phase連携テスト
- パフォーマンス確認

### **Week 3: Polish & Deployment**
**Day 11-13**: Phase 10 Implementation (UI/UX Dev)
- Polish機能実装
- Loading/Error handling

**Day 14**: E2E Test Suite Complete
- 全シナリオ実装・実行
- テストカバレッジ70%達成

**Day 15**: Final Deployment Decision
- 最終品質確認
- デプロイ判定会議

---

## 🎯 **Success Metrics**

### **定量的成功基準**
```yaml
Code Quality:
  - TypeScript Errors: 0
  - ESLint Errors: 0
  - ESLint Warnings: 0
  - Test Coverage: >70%

Functionality:
  - Phase 7 Tasks: 10/10 完了
  - Phase 9 Tasks: 8/8 完了  
  - Phase 10 Tasks: 10/10 完了
  - Constitutional FR: 100% 準拠

Performance:
  - Bundle Size: <5MB
  - Lighthouse: >90
  - Core Web Vitals: All Green
  - E2E Test Time: <5min
```

### **定性的成功基準**  
```yaml
Team Process:
  - No surprise bugs in production
  - Clean deployment with zero rollbacks
  - Documentation accuracy at 100%
  - Team confidence in codebase quality

User Experience:
  - Text overlay creation working flawlessly
  - Auto-save preventing any data loss
  - Professional UI with proper loading states
  - Comprehensive error handling and recovery
```

---

## 📚 **Reference Documentation**

### **必読資料**
1. `specs/001-proedit-mvp-browser/spec.md` - 機能要件
2. `specs/001-proedit-mvp-browser/tasks.md` - 実装タスク
3. `vendor/omniclip/s/context/controllers/` - 移植ベース
4. `PHASE_VERIFICATION_CRITICAL_FINDINGS.md` - 品質基準

### **Constitution要件**
- FR-007: "System MUST support text overlay creation"
- FR-009: "System MUST auto-save every 5 seconds"  
- "Test coverage MUST exceed 70%"
- "No any types permitted in production code"

### **関連ツール**
- TypeScript: `npx tsc --noEmit`
- ESLint: `npx eslint . --ext .ts,.tsx --max-warnings 0`
- Vitest: `npm test`
- Playwright: `npx playwright test`
- Coverage: `npm run test:coverage`

---

**この実装指示書は、安直な判断と独自解釈を防ぎ、確実で検証可能な実装完了を保証するものです。全ての開発者は本書に厳密に従い、段階的検証を怠らず、品質基準を妥協することなく実装を進めてください。**

**最終目標: Constitutional要件を100%満たし、エラー0件、テストカバレッジ70%超の状態でのデプロイ達成**

---
**Document Version**: 1.0.0  
**Last Updated**: 2025-10-15  
**Next Review**: Phase 7完了時  
**Approved By**: [Technical Lead Signature Required]
