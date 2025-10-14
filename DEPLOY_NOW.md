# 🚀 即座にデプロイする手順

**問題**: `Environment Variable "NEXT_PUBLIC_SUPABASE_URL" references Secret "s..."`  
**原因**: vercel.jsonでシークレット参照構文を使用していた  
**解決**: ✅ 修正完了

---

## ✅ 修正内容

### 1. vercel.json 修正
```diff
- "env": {
-   "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
-   "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key"
- },
- "build": {
-   "env": { ... }
- }
+ // 環境変数定義を削除 → Vercel Dashboardで設定
```

### 2. 新規ドキュメント追加
- ✅ `VERCEL_ENV_SETUP.md` - 環境変数設定の詳細ガイド
- ✅ `VERCEL_DEPLOYMENT_GUIDE.md` - 更新済み

---

## 🔥 今すぐデプロイ（3ステップ）

### ステップ1: 修正をコミット＆プッシュ

```bash
# 変更を確認
git status

# ファイルを追加
git add vercel.json VERCEL_ENV_SETUP.md VERCEL_DEPLOYMENT_GUIDE.md

# コミット
git commit -m "fix: Remove env secret references from vercel.json

- Remove @secret references from vercel.json
- Add VERCEL_ENV_SETUP.md for environment variable configuration
- Update VERCEL_DEPLOYMENT_GUIDE.md with correct instructions
- Environment variables should be set directly in Vercel Dashboard"

# プッシュ
git push origin feature/phase5-8-timeline-compositor-export
```

### ステップ2: Vercel環境変数を設定

#### 2.1 Supabase情報を取得
1. https://supabase.com/dashboard を開く
2. プロジェクトを選択
3. **Settings** → **API** に移動
4. 以下をコピー:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: `eyJhbGc...`（長い文字列）

#### 2.2 Vercelに環境変数を追加
1. https://vercel.com/dashboard を開く
2. ProEditプロジェクトを選択
3. **Settings** → **Environment Variables**
4. 以下の2つを追加:

**変数1:**
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://xxxxx.supabase.co （Supabaseからコピー）
Environment: ✓ Production ✓ Preview ✓ Development
```

**変数2:**
```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGc... （Supabaseからコピー）
Environment: ✓ Production ✓ Preview ✓ Development
```

5. **Save** をクリック

### ステップ3: 再デプロイ

#### 方法A: 自動デプロイ（プッシュ後に自動開始）
- プッシュ後、Vercelが自動的に再デプロイを開始
- 約2-3分で完了

#### 方法B: 手動デプロイ
1. Vercel Dashboard → **Deployments**
2. 最新のデプロイの **...** メニュー
3. **Redeploy** をクリック

---

## ✅ 成功の確認

デプロイ成功時、以下が表示されます:

```
✓ Creating an optimized production build
✓ Linting and checking validity of types
✓ Generating static pages (8/8)
✓ Build completed
✓ Deployment ready
🌐 https://your-app.vercel.app
```

### アプリケーションテスト
1. デプロイURLにアクセス
2. **「Googleでサインイン」**をクリック
3. 認証成功 → ダッシュボード表示 ✅

---

## 🐛 まだエラーが出る場合

### エラー: "Invalid Supabase URL"
- URLの最後にスラッシュ `/` がないか確認
- 正: `https://xxxxx.supabase.co`
- 誤: `https://xxxxx.supabase.co/`

### エラー: "Invalid API key"
- キーを全てコピーできているか確認
- 前後に余分なスペースがないか確認

### エラー: "OAuth redirect URI mismatch"
Supabase設定を確認:
1. Supabase Dashboard → **Authentication** → **URL Configuration**
2. **Site URL**: `https://your-app.vercel.app`
3. **Redirect URLs**: `https://your-app.vercel.app/auth/callback`

---

## 📋 クイックチェックリスト

```
✅ vercel.json修正（env削除）
✅ 修正をコミット＆プッシュ
✅ Supabase URL取得
✅ Supabase anon key取得
✅ Vercelで NEXT_PUBLIC_SUPABASE_URL 設定
✅ Vercelで NEXT_PUBLIC_SUPABASE_ANON_KEY 設定
✅ 再デプロイ実行
✅ アプリケーション動作確認
```

---

## 💡 重要ポイント

### ✅ DO（これをする）
- Vercel Dashboardで環境変数を直接設定
- 全環境（Production/Preview/Development）にチェック
- 環境変数追加後に必ず再デプロイ

### ❌ DON'T（これをしない）
- vercel.jsonに環境変数を書かない
- `@secret-name` のような参照構文を使わない
- 環境変数の値をGitにコミットしない

---

## 📞 詳細ガイド

さらに詳しい手順は以下を参照:
- **環境変数設定**: [VERCEL_ENV_SETUP.md](./VERCEL_ENV_SETUP.md)
- **デプロイ全般**: [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md)

---

**これで確実にデプロイできます！** 🚀✨

**作成日**: 2024年10月15日  
**ステータス**: ✅ Ready to Deploy
