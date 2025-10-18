# ProEdit MVP - デプロイガイド

**最終更新**: 2025年10月18日  
**対象**: Vercel + Supabase構成

---

## 📋 前提条件

- ✅ GitHubリポジトリにコードがプッシュ済み
- ✅ Supabaseプロジェクトが作成済み
- ✅ ローカルでビルドが成功している

---

## 🚀 クイックデプロイ（3ステップ）

### Step 1: Supabase情報を取得

1. [Supabase Dashboard](https://supabase.com/dashboard) を開く
2. プロジェクトを選択 → **Settings** → **API**
3. 以下をコピー：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...`

### Step 2: Vercelプロジェクトを作成

1. [Vercel Dashboard](https://vercel.com/dashboard) を開く
2. **New Project** → GitHubリポジトリを選択
3. **環境変数を設定**:
   - `NEXT_PUBLIC_SUPABASE_URL` = (Step 1のProject URL)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (Step 1のanon key)
   - 全環境（Production/Preview/Development）にチェック

### Step 3: デプロイ

1. **Deploy** ボタンをクリック
2. 2-3分待つ
3. ✅ 完了！

---

## 📖 詳細な手順

### 1. ローカルビルド確認

デプロイ前に、ローカルで問題がないことを確認：

```bash
# 型チェック
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

### 2. Vercelプロジェクト設定

#### 2.1 プロジェクト作成

1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. **New Project** をクリック
3. GitHubリポジトリを選択
4. **Import** をクリック

#### 2.2 ビルド設定（デフォルトのまま）

```
Framework Preset: Next.js
Build Command: npm run build
Output Directory: .next
Install Command: npm install
Node.js Version: 20.x
```

#### 2.3 環境変数設定 ⚠️ 重要

**Vercel Dashboard**で以下の2つの環境変数を設定：

| Name                            | Value                       | Environment                    |
|---------------------------------|-----------------------------|--------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`      | `https://xxxxx.supabase.co` | Production/Preview/Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGc...`                | Production/Preview/Development |

**設定手順**:

1. **Settings** タブをクリック
2. 左サイドバーで **Environment Variables** を選択
3. **変数1**: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: SupabaseのProject URLを貼り付け
   - Environment: 全てにチェック ✅
   - **Add** をクリック
4. **変数2**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: Supabaseのanon keyを貼り付け
   - Environment: 全てにチェック ✅
   - **Add** をクリック

**重要**: 
- ❌ `vercel.json`に環境変数を書かない
- ✅ Vercel Dashboardで直接設定する

---

### 3. Supabase設定

#### 3.1 認証設定

1. **Authentication** → **URL Configuration**
2. **Site URL**: Vercelドメインを設定
   ```
   https://your-app.vercel.app
   ```
3. **Redirect URLs**: 以下を追加
   ```
   https://your-app.vercel.app/auth/callback
   http://localhost:3000/auth/callback
   ```

#### 3.2 Google OAuth設定

1. **Authentication** → **Providers** → **Google**
2. **Enable Google Provider**: ON
3. **Google Client ID**: Google Cloud Consoleから取得
4. **Google Client Secret**: Google Cloud Consoleから取得

**Google Cloud Console設定**:
1. [Google Cloud Console](https://console.cloud.google.com/) を開く
2. プロジェクト作成 → **APIs & Services** → **Credentials**
3. **Create Credentials** → **OAuth 2.0 Client ID**
4. **Authorized redirect URIs**: 以下を追加
   ```
   https://xxxxx.supabase.co/auth/v1/callback
   ```

#### 3.3 Storage設定

1. **Storage** → **Policies**
2. `media-files`バケットのポリシーを確認
3. 認証ユーザーのアップロード権限を確認

#### 3.4 RLS（Row Level Security）確認

```sql
-- プロジェクトテーブル
SELECT * FROM projects WHERE user_id = auth.uid();

-- メディアファイルテーブル
SELECT * FROM media_files WHERE project_id IN (
  SELECT id FROM projects WHERE user_id = auth.uid()
);
```

---

### 4. デプロイ実行

#### 4.1 初回デプロイ

1. Vercel Dashboard で **Deploy** ボタンをクリック
2. ビルドログを確認
   ```
   ✅ Building...
   ✅ Compiled successfully
   ✅ Deploying...
   ✅ Ready!
   ```
3. デプロイURL（例: `https://proedit-xxxxx.vercel.app`）をクリック

#### 4.2 カスタムドメイン設定（オプション）

1. **Settings** → **Domains**
2. **Add Domain**
3. ドメイン名を入力（例: `proedit.example.com`）
4. DNSレコードを設定
   ```
   Type: CNAME
   Name: proedit
   Value: cname.vercel-dns.com
   ```

---

### 5. 動作確認

#### 5.1 基本機能チェック

- [ ] トップページが表示される
- [ ] Google OAuthログインが動作する
- [ ] プロジェクトを作成できる
- [ ] メディアをアップロードできる
- [ ] タイムライン編集ができる
- [ ] プレビュー再生ができる
- [ ] エクスポートができる

#### 5.2 CORS/ヘッダー確認

ブラウザのDevToolsで確認：

```
Cross-Origin-Embedder-Policy: require-corp ✅
Cross-Origin-Opener-Policy: same-origin ✅
```

これらのヘッダーは`vercel.json`で設定済み。

#### 5.3 FFmpeg.wasm動作確認

1. プロジェクトを開く
2. エクスポートボタンをクリック
3. FFmpegが正常に読み込まれることを確認

**CDNフォールバック**:
- ローカルファイル: `/ffmpeg/ffmpeg-core.wasm`
- CDN: `https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm`

---

## 🔧 トラブルシューティング

### 問題1: ビルドエラー

**症状**: `npm run build`が失敗する

**解決策**:
```bash
# ローカルでビルド確認
npm run build

# 型エラーを確認
npm run type-check

# Lintエラーを確認
npm run lint
```

### 問題2: 認証エラー

**症状**: Google OAuthが動作しない

**解決策**:
1. Supabase Dashboardで**Authentication** → **URL Configuration**を確認
2. **Redirect URLs**にVercelドメインが追加されているか確認
3. Google Cloud Consoleで**Authorized redirect URIs**を確認

### 問題3: 環境変数エラー

**症状**: `NEXT_PUBLIC_SUPABASE_URL is not defined`

**解決策**:
1. Vercel Dashboard → **Settings** → **Environment Variables**を確認
2. 環境変数が正しく設定されているか確認
3. **Redeploy**ボタンで再デプロイ

### 問題4: FFmpegが動作しない

**症状**: エクスポート時にエラー

**解決策**:
1. ブラウザのDevToolsでCORSヘッダーを確認
2. `vercel.json`のヘッダー設定を確認
3. CDNフォールバックが動作しているか確認

### 問題5: Supabaseストレージエラー

**症状**: メディアアップロードが失敗する

**解決策**:
1. Supabase Dashboard → **Storage** → **Policies**を確認
2. `media-files`バケットが存在するか確認
3. ポリシーが正しく設定されているか確認
   ```sql
   -- アップロード許可
   CREATE POLICY "Authenticated users can upload"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'media-files');
   ```

---

## 📊 デプロイ後の監視

### Vercel Analytics

1. **Analytics**タブを開く
2. 以下を監視：
   - ページビュー
   - ユーザー数
   - レスポンスタイム
   - エラー率

### Supabase Logs

1. **Logs**タブを開く
2. 以下を監視：
   - API呼び出し
   - 認証イベント
   - ストレージ操作
   - エラーログ

### エラートラッキング（推奨）

Sentryなどのエラートラッキングサービスを導入：

```bash
npm install @sentry/nextjs
```

---

## 🔄 継続的デプロイ（CI/CD）

### 自動デプロイ設定

Vercelは自動的にGitHubと連携：

1. **mainブランチ**にプッシュ → 本番環境にデプロイ
2. **その他のブランチ**にプッシュ → プレビュー環境にデプロイ
3. **Pull Request**作成 → プレビューURLが自動生成

### デプロイフック（オプション）

特定のイベントで自動デプロイ：

1. Vercel Dashboard → **Settings** → **Git**
2. **Deploy Hooks**を作成
3. Webhook URLを取得
4. GitHub Actionsなどで使用

---

## 📝 デプロイチェックリスト

デプロイ前に確認：

- [ ] ローカルビルドが成功している
- [ ] 型エラーが0件
- [ ] Lintエラーが0件
- [ ] Supabaseプロジェクトが作成済み
- [ ] Supabase環境変数が設定済み
- [ ] Google OAuth設定が完了
- [ ] Storageバケットが作成済み
- [ ] RLSポリシーが設定済み
- [ ] `vercel.json`が正しく設定されている
- [ ] `.env.local.example`が最新

デプロイ後に確認：

- [ ] トップページが表示される
- [ ] 認証が動作する
- [ ] メディアアップロードが動作する
- [ ] タイムライン編集が動作する
- [ ] プレビュー再生が動作する
- [ ] エクスポートが動作する
- [ ] CORSヘッダーが正しく設定されている

---

## 📖 関連ドキュメント

- **README.md** - プロジェクト概要
- **QUICK_START.md** - ローカル開発セットアップ
- **USER_GUIDE.md** - ユーザー向け操作ガイド
- **supabase/SETUP_INSTRUCTIONS.md** - Supabaseセットアップ

---

## 🆘 サポート

問題が解決しない場合：

1. [Vercel Documentation](https://vercel.com/docs)
2. [Supabase Documentation](https://supabase.com/docs)
3. [Next.js Documentation](https://nextjs.org/docs)
4. GitHubリポジトリのIssues

---

**ステータス**: ✅ **デプロイ準備完了**  
**最終更新**: 2025年10月18日

