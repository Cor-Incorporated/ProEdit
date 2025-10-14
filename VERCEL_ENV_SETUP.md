# Vercel 環境変数設定ガイド

**ProEdit MVP - 環境変数の正しい設定方法**

---

## ⚠️ 重要: vercel.jsonの修正完了

`vercel.json`から環境変数定義を削除しました。
これにより、Vercel Dashboardで直接環境変数を設定できます。

---

## 🔧 環境変数設定手順

### 1. Supabase情報の取得

#### 1.1 Supabase Dashboardにアクセス
1. [https://supabase.com/dashboard](https://supabase.com/dashboard) を開く
2. ProEditプロジェクトを選択

#### 1.2 API情報をコピー
1. 左サイドバーで **Settings** (⚙️) をクリック
2. **API** を選択
3. 以下の2つの値をコピー:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public** key: `eyJhbGc...` (長い文字列)

📋 メモ帳などに一時保存しておきましょう。

---

### 2. Vercel環境変数の設定

#### 2.1 Vercelプロジェクトを開く
1. [https://vercel.com/dashboard](https://vercel.com/dashboard) を開く
2. ProEditプロジェクトを選択

#### 2.2 環境変数ページに移動
1. 上部タブで **Settings** をクリック
2. 左サイドバーで **Environment Variables** を選択

#### 2.3 環境変数を追加

##### 変数1: NEXT_PUBLIC_SUPABASE_URL
1. **Name**: `NEXT_PUBLIC_SUPABASE_URL` と入力
2. **Value**: Supabaseの **Project URL** を貼り付け
   ```
   例: https://xxxxxxxxxxxxx.supabase.co
   ```
3. **Environment**: 
   - ✅ Production
   - ✅ Preview
   - ✅ Development
   （全てにチェック）
4. **Add** ボタンをクリック

##### 変数2: NEXT_PUBLIC_SUPABASE_ANON_KEY
1. **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY` と入力
2. **Value**: Supabaseの **anon public** キーを貼り付け
   ```
   例: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...（長い文字列）
   ```
3. **Environment**: 
   - ✅ Production
   - ✅ Preview  
   - ✅ Development
   （全てにチェック）
4. **Add** ボタンをクリック

---

### 3. 再デプロイ

環境変数を追加したら、**必ず再デプロイ**が必要です:

#### 方法1: Gitプッシュで自動再デプロイ（推奨）
```bash
git add vercel.json
git commit -m "fix: Remove env vars from vercel.json"
git push origin main
```

#### 方法2: Vercel Dashboardから手動再デプロイ
1. **Deployments** タブに移動
2. 最新のデプロイメントの右側の **...** (3点メニュー) をクリック
3. **Redeploy** を選択
4. **Redeploy** ボタンをクリック

---

## ✅ 設定完了の確認

### デプロイログで確認
再デプロイ後、ビルドログに以下が表示されればOK:

```
✓ Creating an optimized production build
✓ Linting and checking validity of types
✓ Generating static pages (8/8)
```

### アプリケーションで確認
1. デプロイされたURLにアクセス: `https://your-app.vercel.app`
2. **「Googleでサインイン」**をクリック
3. Google認証が成功すればOK ✅

---

## 🐛 トラブルシューティング

### エラー: "Invalid Supabase URL"
**原因**: URLの末尾に余分なスラッシュや文字がある  
**解決**: 
```
❌ https://xxxxx.supabase.co/
✅ https://xxxxx.supabase.co
```

### エラー: "Invalid API key"
**原因**: キーがコピー時に途切れている  
**解決**: 
- **anon public** キー全体をコピー
- 前後に余分なスペースがないか確認

### 認証エラー: "OAuth redirect mismatch"
**原因**: SupabaseでVercelドメインが登録されていない  
**解決**:
1. Supabase Dashboard → **Authentication** → **URL Configuration**
2. **Site URL**: `https://your-app.vercel.app` を追加
3. **Redirect URLs**: `https://your-app.vercel.app/auth/callback` を追加

### ビルドエラー: "Environment variables not found"
**原因**: 環境変数名が間違っている  
**解決**:
- 大文字小文字を正確に: `NEXT_PUBLIC_SUPABASE_URL`
- アンダースコア `_` を忘れずに

---

## 📸 スクリーンショット付き手順

### Supabase API設定画面
```
Supabase Dashboard
└─ Settings (⚙️)
   └─ API
      ├─ Project URL: https://xxxxx.supabase.co
      └─ API Keys
         └─ anon public: eyJhbGc...
```

### Vercel環境変数設定画面
```
Vercel Dashboard
└─ Your Project
   └─ Settings
      └─ Environment Variables
         ├─ + Add New
         │  ├─ Name: NEXT_PUBLIC_SUPABASE_URL
         │  ├─ Value: (paste URL)
         │  └─ Environment: [✓] Production [✓] Preview [✓] Development
         └─ + Add New
            ├─ Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
            ├─ Value: (paste key)
            └─ Environment: [✓] Production [✓] Preview [✓] Development
```

---

## 🎯 チェックリスト

設定前の確認:
```
✅ Supabaseプロジェクトが作成されている
✅ Google OAuth設定が完了している
✅ Database migrationsが実行されている
✅ Storage bucketが作成されている
```

環境変数設定:
```
✅ NEXT_PUBLIC_SUPABASE_URL を追加
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY を追加
✅ 全ての環境（Production/Preview/Development）にチェック
✅ 再デプロイを実行
```

動作確認:
```
✅ ビルドが成功
✅ アプリケーションが開く
✅ Google認証が動作
✅ ダッシュボードが表示
```

---

## 💡 ヒント

### 環境変数の値を確認したい場合
Vercel環境変数画面で、値の最初の数文字だけが表示されます:
- `NEXT_PUBLIC_SUPABASE_URL`: `https://xx...`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `eyJhb...`

これで正しくコピーできているか確認できます。

### 複数の環境を使う場合
- **Production**: 本番環境（mainブランチ）
- **Preview**: プレビュー環境（PRやブランチ）
- **Development**: ローカル開発

通常は全てにチェックで問題ありません。

---

## 📞 サポート

問題が解決しない場合:
1. Vercelのデプロイログを確認
2. ブラウザ開発者ツールのコンソールを確認
3. Supabase Dashboardでプロジェクトの状態を確認

---

**設定完了後、ProEditアプリケーションをお楽しみください！** 🎉

**作成日**: 2024年10月15日  
**バージョン**: 1.0.0
