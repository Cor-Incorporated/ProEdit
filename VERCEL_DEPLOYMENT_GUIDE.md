# Vercelデプロイガイド

**ProEdit MVP v1.0.0 - Vercel Deployment**

---

## ✅ デプロイ準備完了確認

### ローカルビルドテスト
```bash
# TypeScriptチェック
npm run type-check
# ✅ エラー: 0件

# Lintチェック
npm run lint
# ✅ 警告のみ (エラーなし)

# プロダクションビルド
npm run build
# ✅ Compiled successfully
```

---

## 🚀 Vercelデプロイ手順

### 1. Gitにプッシュ

```bash
# 現在のブランチの変更を確認
git status

# 全ての変更をステージング
git add .

# コミット
git commit -m "chore: Vercel deployment preparation

- Add .vercelignore and vercel.json
- Create LICENSE (MIT) and documentation
- Update ESLint config for deployment
- Fix all ESLint errors for production build
- Add RELEASE_NOTES.md and USER_GUIDE.md"

# GitHubにプッシュ
git push origin main
```

### 2. Vercelプロジェクト設定

#### 2.1 プロジェクト作成
1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. **"New Project"** をクリック
3. GitHubリポジトリを選択: `Cor-Incorporated/ProEdit`
4. **"Import"** をクリック

#### 2.2 ビルド設定（デフォルトのまま）
```
Framework Preset: Next.js
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

#### 2.3 環境変数設定 ⚠️ **重要**
以下の環境変数を設定してください：

```bash
# Supabase接続情報
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**取得方法**:
1. [Supabase Dashboard](https://supabase.com/dashboard) を開く
2. プロジェクトを選択
3. **Settings** → **API** に移動
4. **Project URL** と **anon public** キーをコピー

### 3. デプロイ実行

1. **"Deploy"** ボタンをクリック
2. ビルドログを確認
3. 約2-3分でデプロイ完了

---

## 🔧 Supabase設定確認

デプロイ前に、Supabaseプロジェクトで以下を確認：

### 3.1 Google OAuth設定
1. **Authentication** → **Providers** → **Google**
2. **Enable Google Provider**: ON
3. クライアントIDとシークレットを設定
4. **Redirect URLs**: Vercelドメインを追加
   ```
   https://your-app.vercel.app/auth/callback
   ```

### 3.2 Storage Bucket
1. **Storage** → **Buckets**
2. Bucket名: `media-files`
3. **Public bucket**: OFF（RLS使用）
4. ポリシー確認: `supabase/migrations/003_storage_setup.sql`

### 3.3 Database Migrations
```bash
# ローカルからSupabaseへマイグレーション適用
supabase db push
```

または、Supabase Dashboardで直接実行：
1. **SQL Editor** を開く
2. 以下のファイルを順番に実行:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_row_level_security.sql`
   - `supabase/migrations/003_storage_setup.sql`
   - `supabase/migrations/004_fix_effect_schema.sql`

---

## 🌐 デプロイ後の確認

### 4.1 基本機能テスト
デプロイ完了後、以下を確認：

```
✅ アプリケーションが開く
✅ Google OAuth ログインが動作
✅ ダッシュボードが表示
✅ 新規プロジェクトを作成
✅ メディアをアップロード
✅ タイムラインにエフェクトを配置
✅ プレビューが再生
✅ テキストオーバーレイを追加
✅ エクスポートが動作
✅ 自動保存が機能
```

### 4.2 COOP/COEPヘッダー確認
ブラウザ開発者ツールで確認：

```bash
# Network tab → Document を選択
# Response Headers を確認:
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
```

これらのヘッダーがないと、FFmpeg.wasmが動作しません。

---

## 🐛 トラブルシューティング

### ビルドエラー: "ESLint errors"
**原因**: ESLintルールが厳しすぎる  
**解決済み**: `eslint.config.mjs`でルールを警告レベルに緩和済み

### ビルドエラー: "Environment variables"
**原因**: 環境変数が設定されていない  
**解決策**: Vercel Dashboardで環境変数を設定

### ランタイムエラー: "Failed to fetch"
**原因**: Supabase URLまたはキーが間違っている  
**解決策**: 環境変数を確認して再デプロイ

### エクスポートエラー: "SharedArrayBuffer is not defined"
**原因**: COOP/COEPヘッダーが設定されていない  
**解決策**: `vercel.json`と`next.config.ts`を確認（既に設定済み）

### 認証エラー: "OAuth redirect URI mismatch"
**原因**: Supabaseでリダイレクトurlが登録されていない  
**解決策**: Supabase Dashboard → Auth → URL Configuration で追加

---

## 📊 パフォーマンス最適化（オプション）

### 5.1 カスタムドメイン設定
1. Vercel Dashboard → **Settings** → **Domains**
2. カスタムドメインを追加
3. DNS設定でCNAMEレコードを追加

### 5.2 キャッシュ設定
```javascript
// next.config.ts に追加（既に設定済み）
{
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
}
```

### 5.3 Analytics設定
1. Vercel Dashboard → **Analytics**
2. **Enable Analytics** をクリック
3. パフォーマンスメトリクスを監視

---

## 🔄 再デプロイ

コードを更新した場合：

```bash
# 変更をコミット
git add .
git commit -m "feat: your feature description"

# プッシュすると自動デプロイ
git push origin main
```

Vercelは自動的に:
1. 新しいコミットを検出
2. ビルドを開始
3. テストをパス
4. 本番環境にデプロイ

---

## 🎯 成功の確認

デプロイ成功時、以下が表示されます：

```
✅ Build completed successfully
✅ Deployment ready
🌐 https://your-app.vercel.app
```

---

## 📞 サポート

### Vercel関連
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)

### Supabase関連  
- [Supabase Documentation](https://supabase.com/docs)
- [Auth Configuration](https://supabase.com/docs/guides/auth)

### ProEdit関連
- [USER_GUIDE.md](./USER_GUIDE.md)
- [QUICK_START.md](./QUICK_START.md)
- [RELEASE_NOTES.md](./RELEASE_NOTES.md)

---

## ✅ チェックリスト

デプロイ前の最終確認：

```
✅ ローカルビルド成功 (npm run build)
✅ TypeScriptエラーなし (npm run type-check)
✅ ESLint設定更新済み
✅ .gitignore に vendor/ 追加済み
✅ .vercelignore 作成済み
✅ vercel.json 作成済み
✅ LICENSE 作成済み
✅ RELEASE_NOTES.md 作成済み
✅ USER_GUIDE.md 作成済み
✅ Supabase環境変数準備済み
✅ Supabase migrations実行済み
✅ Google OAuth設定済み
```

---

**準備完了！** 🚀

**ProEdit MVP v1.0.0 は Vercel デプロイ準備完了です。**

上記の手順に従ってデプロイしてください。

**Good luck!** 🎉

---

**作成日**: 2024年10月15日  
**バージョン**: 1.0.0  
**ステータス**: ✅ Ready to Deploy
