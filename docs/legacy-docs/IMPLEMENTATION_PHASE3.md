# Phase 3: User Story 1 - 完全実装指示書

> **実装者**: AI開発アシスタント  
> **目的**: Google認証 + プロジェクト管理機能の実装  
> **推定時間**: 6時間  
> **タスク**: T022-T032（11タスク）

---

## ✅ 前提条件

### 完了済み
- ✅ データベーステーブル作成（8テーブル）
- ✅ Row Level Security設定
- ✅ Supabaseクライアント設定（lib/supabase/）
- ✅ Zustand store基盤（stores/index.ts）
- ✅ 型定義（types/）
- ✅ レイアウト構造（app/(auth)/layout.tsx, app/(editor)/layout.tsx）

### 手動完了が必要
- ⚠️ Storage bucket `media-files` 作成（Phase 4で必要）
- ⚠️ Google OAuth設定

---

## 📋 実装タスク一覧

### グループ1: 認証基盤（T022-T024）

#### T022: ログインページ作成
**ファイル**: `app/(auth)/login/page.tsx`

**要件**:
- Google OAuth ログインボタン
- Google SVGアイコン付き
- ローディング状態の表示
- エラーハンドリング
- shadcn/ui Card コンポーネント使用

**実装ポイント**:
```typescript
- createClient() でブラウザ用Supabaseクライアント取得
- signInWithOAuth({ provider: 'google', options: { redirectTo: '/auth/callback' }})
- ローディング中はボタン無効化
- エラー時はalertで表示（Phase 4でtoast化）
```

**スタイル**:
- Adobe Premiere Pro風ダークテーマ
- カード中央配置
- レスポンシブ対応

---

#### T023: 認証コールバックハンドラー
**ファイル**: `app/auth/callback/route.ts`

**要件**:
- OAuth codeをsessionに変換
- 成功時: `/editor` へリダイレクト
- 失敗時: `/login?error=...` へリダイレクト

**実装ポイント**:
```typescript
- GET リクエストハンドラー
- createClient() でサーバー用クライアント取得
- exchangeCodeForSession(code) でセッション確立
- NextResponse.redirect() でリダイレクト
```

---

#### T024: 認証Server Actions
**ファイル**: `app/actions/auth.ts`

**要件**:
- `signOut()`: ログアウト処理
- `getSession()`: セッション取得
- `getUser()`: ユーザー情報取得

**実装ポイント**:
```typescript
'use server'

export async function signOut() {
  - supabase.auth.signOut()
  - revalidatePath('/', 'layout')
  - redirect('/login')
}

export async function getSession() {
  - supabase.auth.getSession()
  - エラーハンドリング
  - { session, error } を返す
}

export async function getUser() {
  - supabase.auth.getUser()
  - エラーハンドリング
  - { user, error } を返す
}
```

---

### グループ2: プロジェクト管理（T025-T029）

#### T025: ダッシュボードページ
**ファイル**: `app/(editor)/page.tsx`

**要件**:
- 認証チェック（未ログイン時 → /login）
- プロジェクト一覧をSupabaseから取得
- グリッドレイアウトでProjectCard表示
- 空状態の処理
- NewProjectDialogトリガーボタン

**実装ポイント**:
```typescript
- Server Component（async function）
- await createClient() でサーバークライアント
- await supabase.auth.getUser() で認証チェック
- await supabase.from('projects').select('*').eq('user_id', user.id).order('updated_at', { ascending: false })
- レスポンシブグリッド: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
```

**レイアウト構造**:
```
<div className="h-full flex flex-col">
  {/* ヘッダー */}
  <div className="border-b ...">
    <h1>プロジェクト</h1>
    <p>{projects.length} 個のプロジェクト</p>
    <NewProjectDialog><Button /></NewProjectDialog>
  </div>
  
  {/* プロジェクト一覧 */}
  <div className="flex-1 overflow-auto p-6">
    {projects.length > 0 ? (
      <div className="grid ...">
        {projects.map(project => <ProjectCard key={project.id} project={project} />)}
      </div>
    ) : (
      <div className="empty-state">...</div>
    )}
  </div>
</div>
```

---

#### T026: プロジェクトServer Actions
**ファイル**: `app/actions/projects.ts`

**要件**:
- `createProject(formData)`: 新規作成
- `updateProject(projectId, formData)`: 更新
- `deleteProject(projectId)`: 削除

**実装ポイント**:
```typescript
'use server'

const DEFAULT_PROJECT_SETTINGS = {
  width: 1920,
  height: 1080,
  fps: 30,
  aspectRatio: '16:9',
  bitrate: 9000,
  standard: '1080p',
}

export async function createProject(formData: FormData) {
  1. name取得とバリデーション
  2. ユーザー認証チェック
  3. supabase.from('projects').insert({ user_id, name, settings: DEFAULT_PROJECT_SETTINGS })
  4. revalidatePath('/editor')
  5. redirect(`/editor/${project.id}`) ← 作成後すぐエディタへ
}

export async function updateProject(projectId: string, formData: FormData) {
  1. name取得とバリデーション
  2. ユーザー認証チェック
  3. supabase.from('projects').update({ name, updated_at }).eq('id', projectId).eq('user_id', user.id)
  4. revalidatePath('/editor')
  5. { success: true } を返す
}

export async function deleteProject(projectId: string) {
  1. ユーザー認証チェック
  2. supabase.from('projects').delete().eq('id', projectId).eq('user_id', user.id)
  3. revalidatePath('/editor')
  4. { success: true } を返す
}
```

**エラーハンドリング**:
- 各関数で `{ error: string }` を返す
- RLSにより自動的にuser_idチェック

---

#### T027: 新規プロジェクトダイアログ
**ファイル**: `components/projects/NewProjectDialog.tsx`

**要件**:
- shadcn/ui Dialog使用
- プロジェクト名入力フォーム
- 作成/キャンセルボタン
- ローディング状態
- sonner toast通知

**実装ポイント**:
```typescript
'use client'

export function NewProjectDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    const result = await createProject(formData)
    
    if (result?.error) {
      toast.error('エラー', { description: result.error })
      setLoading(false)
    } else {
      setOpen(false)
      toast.success('成功', { description: 'プロジェクトを作成しました' })
      // redirect は createProject 内で実行される
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>新規プロジェクト</DialogTitle>
            <DialogDescription>新しいプロジェクトを作成します</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="name">プロジェクト名</Label>
            <Input id="name" name="name" placeholder="無題のプロジェクト" required autoFocus />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              キャンセル
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '作成中...' : '作成'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

---

#### T028: プロジェクトカード
**ファイル**: `components/projects/ProjectCard.tsx`

**要件**:
- shadcn/ui Card使用
- サムネイル表示（プレースホルダー）
- プロジェクト名と更新日
- DropdownMenu（編集・削除）
- 削除確認AlertDialog
- toast通知

**実装ポイント**:
```typescript
'use client'

interface Project {
  id: string
  name: string
  created_at: string
  updated_at: string
  settings: any
}

export function ProjectCard({ project }: { project: Project }) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    const result = await deleteProject(project.id)
    
    if (result?.error) {
      toast.error('エラー', { description: result.error })
      setDeleting(false)
    } else {
      toast.success('成功', { description: 'プロジェクトを削除しました' })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric', month: 'short', day: 'numeric'
    })
  }

  return (
    <>
      <Card className="group hover:border-premiere-accent-blue transition-colors">
        <Link href={`/editor/${project.id}`}>
          <CardContent className="p-0">
            <div className="aspect-video bg-premiere-bg-darkest flex items-center justify-center">
              <div className="text-6xl text-premiere-text-disabled">▶</div>
            </div>
          </CardContent>
        </Link>
        <CardFooter className="flex items-start justify-between p-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{project.name}</h3>
            <p className="text-sm text-premiere-text-secondary">{formatDate(project.updated_at)}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/editor/${project.id}`}>
                  <Edit className="mr-2 h-4 w-4" />
                  編集
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600" onClick={() => setDeleteDialogOpen(true)}>
                <Trash className="mr-2 h-4 w-4" />
                削除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardFooter>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>プロジェクトを削除しますか?</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。プロジェクト「{project.name}」とそのすべてのデータが完全に削除されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? '削除中...' : '削除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
```

**スタイリング**:
- ホバー時にボーダー色変更（premiere-accent-blue）
- サムネイルはaspect-video（16:9）
- テキストtruncate対応

---

#### T029: プロジェクトストア
**ファイル**: `stores/project.ts`

**要件**:
- Zustand + devtools
- プロジェクトのローカル状態管理
- Optimistic UI updates用

**実装ポイント**:
```typescript
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface Project {
  id: string
  name: string
  user_id: string
  settings: any
  created_at: string
  updated_at: string
}

interface ProjectState {
  currentProject: Project | null
  projects: Project[]
  
  setCurrentProject: (project: Project | null) => void
  setProjects: (projects: Project[]) => void
  addProject: (project: Project) => void
  updateProjectLocal: (id: string, updates: Partial<Project>) => void
  removeProject: (id: string) => void
}

export const useProjectStore = create<ProjectState>()(
  devtools(
    (set) => ({
      currentProject: null,
      projects: [],

      setCurrentProject: (project) => set({ currentProject: project }),
      setProjects: (projects) => set({ projects }),
      addProject: (project) => set((state) => ({ projects: [project, ...state.projects] })),
      updateProjectLocal: (id, updates) => set((state) => ({
        projects: state.projects.map((p) => p.id === id ? { ...p, ...updates } : p),
        currentProject: state.currentProject?.id === id 
          ? { ...state.currentProject, ...updates } 
          : state.currentProject,
      })),
      removeProject: (id) => set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        currentProject: state.currentProject?.id === id ? null : state.currentProject,
      })),
    }),
    { name: 'project-store' }
  )
)
```

**使用例**:
```typescript
// コンポーネント内
const { currentProject, setCurrentProject } = useProjectStore()
```

---

### グループ3: タイムライン表示（T030-T032）

#### T030: 空のタイムラインビュー
**ファイル**: `app/(editor)/[projectId]/page.tsx`

**要件**:
- Dynamic Route（[projectId]）
- プロジェクト取得と認証チェック
- 3パネルレイアウト（プレビュー・プロパティ・タイムライン）
- プロジェクト設定表示

**実装ポイント**:
```typescript
interface EditorPageProps {
  params: Promise<{ projectId: string }>
}

export default async function EditorPage({ params }: EditorPageProps) {
  const { projectId } = await params
  const supabase = await createClient()
  
  // 認証チェック
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  
  // プロジェクト取得
  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()
  
  if (error || !project) notFound()
  
  const settings = project.settings || {}
  
  return (
    <div className="h-screen flex flex-col bg-premiere-bg-dark">
      {/* ツールバー */}
      <div className="toolbar">
        <h1 className="text-sm font-medium">{project.name}</h1>
      </div>
      
      {/* メインエリア */}
      <div className="flex-1 flex">
        {/* プレビュー */}
        <div className="flex-1 flex items-center justify-center bg-premiere-bg-darkest">
          <div className="text-center">
            <div className="text-6xl text-premiere-text-disabled mb-4">▶</div>
            <p className="text-premiere-text-secondary">メディアを追加してプレビューを開始</p>
          </div>
        </div>
        
        {/* プロパティパネル */}
        <div className="property-panel w-80">
          <div className="property-group">
            <h3 className="font-medium text-sm mb-2">プロジェクト設定</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-premiere-text-secondary">解像度:</span>
                <span>{settings.width || 1920} × {settings.height || 1080}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-premiere-text-secondary">FPS:</span>
                <span>{settings.fps || 30}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-premiere-text-secondary">アスペクト比:</span>
                <span>{settings.aspectRatio || '16:9'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* タイムライン */}
      <div className="h-64 border-t border-premiere-border bg-premiere-bg-medium">
        <div className="flex items-center justify-center h-full">
          <p className="text-premiere-text-secondary">タイムライン（Phase 4で実装）</p>
        </div>
      </div>
    </div>
  )
}
```

**レイアウト寸法**:
- ツールバー: `h-auto` (toolbar class)
- プロパティパネル: `w-80` (320px)
- タイムライン: `h-64` (256px)
- プレビュー: `flex-1` (残り全て)

---

#### T031: ローディングスケルトン
**ファイル**: `app/(editor)/loading.tsx`（既存ファイルを更新）

**要件**:
- shadcn/ui Skeleton使用
- エディタレイアウトに合わせたスケルトン
- Suspense境界で自動表示

**実装ポイント**:
```typescript
import { Skeleton } from '@/components/ui/skeleton'

export default function EditorLoading() {
  return (
    <div className="h-screen flex flex-col bg-premiere-bg-dark">
      {/* ツールバースケルトン */}
      <div className="toolbar">
        <Skeleton className="h-6 w-48" />
      </div>

      {/* メインエリア */}
      <div className="flex-1 flex">
        {/* プレビュー */}
        <div className="flex-1 flex items-center justify-center bg-premiere-bg-darkest">
          <Skeleton className="w-3/4 aspect-video" />
        </div>

        {/* プロパティパネル */}
        <div className="property-panel w-80">
          <div className="space-y-4 p-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </div>

      {/* タイムライン */}
      <div className="h-64 border-t border-premiere-border bg-premiere-bg-medium p-4">
        <Skeleton className="h-full w-full" />
      </div>
    </div>
  )
}
```

---

#### T032: エディタレイアウト更新（Toast + ログアウト）
**ファイル**: `app/(editor)/layout.tsx`（既存ファイルを更新）

**要件**:
- Toaster コンポーネント追加
- トップバーにユーザー情報とログアウトボタン
- 認証チェック

**実装ポイント**:
```typescript
import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Toaster } from 'sonner'
import { signOut } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export default async function EditorLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* トップバー */}
      <div className="h-12 border-b border-premiere-border bg-premiere-bg-darkest px-4 flex items-center justify-between">
        <h1 className="font-bold text-lg">ProEdit</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-premiere-text-secondary">
            {user.email}
          </span>
          <form action={signOut}>
            <Button variant="ghost" size="sm" type="submit">
              <LogOut className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
      
      {/* メインコンテンツ */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
      
      {/* Toast通知 */}
      <Toaster />
    </div>
  )
}
```

**注意点**:
- Toaster は sonner から import
- ログアウトボタンは form action として Server Action を使用
- トップバーは h-12 固定

---

## 🔧 追加設定

### Sonner Toast設定
**必要なインポート**:
```typescript
import { toast } from 'sonner'
import { Toaster } from 'sonner'
```

**使用方法**:
```typescript
// 成功
toast.success('成功', { description: 'メッセージ' })

// エラー
toast.error('エラー', { description: 'エラーメッセージ' })

// 情報
toast.info('情報', { description: 'メッセージ' })
```

---

## ✅ Phase 3 完了チェックリスト

実装完了後、以下をすべて確認してください：

### 型チェックとLint
```bash
[ ] npm run type-check - エラーなし
[ ] npm run lint - エラーなし
[ ] npm run dev - 起動成功
```

### 機能テスト
```bash
[ ] http://localhost:3000/login にアクセス可能
[ ] Googleログインボタン表示
[ ] Googleログインボタンクリック → OAuth フロー開始
[ ] OAuth完了後 /editor にリダイレクト
[ ] ダッシュボードで「プロジェクトがありません」表示（初回）
[ ] 「新規プロジェクト」ボタンクリック → ダイアログ表示
[ ] プロジェクト名入力 → 作成成功
[ ] Toast通知「プロジェクトを作成しました」表示
[ ] /editor/[projectId] にリダイレクト
[ ] エディタページで3パネルレイアウト表示
[ ] プロジェクト設定パネルに解像度・FPS表示
[ ] ブラウザバック → ダッシュボードに戻る
[ ] プロジェクトカード表示
[ ] プロジェクトカードの「・・・」メニュー → 削除クリック
[ ] 削除確認ダイアログ表示
[ ] 削除実行 → Toast通知「プロジェクトを削除しました」
[ ] プロジェクトがダッシュボードから消える
[ ] トップバーのログアウトボタンクリック
[ ] /login にリダイレクト
```

### データベース確認
```sql
-- Supabase Dashboard > SQL Editor で実行

-- プロジェクトが正しく作成されているか
SELECT id, name, user_id, created_at, updated_at 
FROM projects 
ORDER BY created_at DESC 
LIMIT 5;

-- RLSが正しく動作しているか（自分のプロジェクトのみ表示）
-- → ダッシュボードで他のユーザーのプロジェクトが見えないことを確認
```

---

## 🐛 トラブルシューティング

### 問題1: Google OAuth が動作しない

**確認事項**:
```bash
1. Supabase Dashboard > Authentication > Providers
   - Google が有効化されているか
   - Client ID と Client Secret が設定されているか

2. Google Cloud Console
   - 承認済みリダイレクトURI に以下が含まれているか:
     https://blvcuxxwiykgcbsduhbc.supabase.co/auth/v1/callback
     http://localhost:3000/auth/callback

3. エラーログ確認:
   - ブラウザコンソール
   - ターミナル（Next.jsサーバーログ）
```

### 問題2: プロジェクトが作成できない

**確認事項**:
```bash
1. データベーステーブル確認:
   SELECT * FROM projects LIMIT 1;

2. RLS確認:
   SELECT auth.uid(); -- 現在のユーザーID
   
3. エラーログ:
   - ブラウザコンソール
   - ターミナル
   - Supabase Dashboard > Logs
```

### 問題3: Toast通知が表示されない

**確認事項**:
```typescript
1. app/(editor)/layout.tsx に <Toaster /> があるか
2. import { toast } from 'sonner' が正しいか
3. import { Toaster } from 'sonner' が正しいか
```

---

## 🎯 Phase 3 完了後の次のステップ

Phase 3が完了したら、**Phase 4: User Story 2（メディアアップロード + タイムライン配置）** に進みます。

Phase 4では以下を実装します:
- メディアライブラリUI
- ファイルアップロード（ドラッグ&ドロップ）
- Storage統合
- タイムライントラック
- エフェクト配置

**Phase 4は新しいチャットまたは新しい指示書で開始してください。**

---

## 📊 プロジェクト全体の進捗

```
Phase 1: Setup          ✅ 100% (完了)
Phase 2: Foundation     ✅ 100% (完了)
Phase 3: User Story 1   🎯 実装中（この指示書）
Phase 4: User Story 2   ⏳ Phase 3完了後
Phase 5-7: 編集機能     ⏳ Phase 4完了後
Phase 8-9: Export       ⏳ Phase 7完了後
Phase 10: Polish        ⏳ 最終段階
```

---

**この指示書でPhase 3の実装を完了させてください！** 🚀

**作成者**: Claude (2025-10-14)  
**ドキュメントバージョン**: 3.0.0  
**対象フェーズ**: Phase 3: User Story 1 (T022-T032)
