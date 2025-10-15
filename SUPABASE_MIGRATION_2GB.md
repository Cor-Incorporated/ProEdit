# Supabase Storage 2GB File Size Limit Migration

## 概要

Supabase Storageのファイルサイズ制限を **500MB → 2GB** に更新するマイグレーション。

## 背景

- **フロントエンド設定:** `types/media.ts`で`MAX_FILE_SIZE = 2GB`に更新済み
- **バックエンド設定:** Supabaseのストレージバケットはまだ500MBに設定されている
- **目的:** フロントエンドとバックエンドの設定を一致させる

---

## マイグレーションファイル

**ファイル名:** `supabase/migrations/005_update_file_size_limit.sql`

**内容:**
```sql
-- Update storage bucket file size limit from 500MB to 2GB
UPDATE storage.buckets
SET file_size_limit = 2147483648 -- 2GB in bytes
WHERE id = 'media-files';
```

---

## 適用方法

### 方法1: Supabase CLI（推奨）

```bash
# 1. Dry run（変更内容を確認）
supabase db push --dry-run

# 2. マイグレーション適用
supabase db push

# 3. 確認
supabase db diff
```

### 方法2: Supabase Dashboard

1. [Supabase Dashboard](https://app.supabase.com/) にアクセス
2. プロジェクトを選択
3. **Database** → **SQL Editor** を開く
4. 以下のSQLを実行:

```sql
UPDATE storage.buckets
SET file_size_limit = 2147483648
WHERE id = 'media-files';
```

5. 確認クエリを実行:

```sql
SELECT id, name, file_size_limit, file_size_limit / 1024 / 1024 / 1024 as limit_gb
FROM storage.buckets
WHERE id = 'media-files';
```

**期待される結果:**
```
id           | name        | file_size_limit | limit_gb
-------------|-------------|-----------------|----------
media-files  | media-files | 2147483648      | 2
```

---

## 確認手順

### 1. データベース確認

```sql
SELECT
  id,
  name,
  file_size_limit,
  file_size_limit / 1024 / 1024 AS limit_mb,
  file_size_limit / 1024 / 1024 / 1024 AS limit_gb
FROM storage.buckets
WHERE id = 'media-files';
```

### 2. アプリケーション確認

1. アプリケーションを起動: `npm run dev`
2. エディタページに移動
3. **Media Library**を開く
4. 500MB以上のファイルをアップロード
5. 成功することを確認

---

## トラブルシューティング

### エラー: "File size limit exceeded"

**原因:** マイグレーションが適用されていない

**解決策:**
```bash
# 現在のマイグレーション状態を確認
supabase migration list

# 適用されていない場合
supabase db push
```

### エラー: "relation 'storage.buckets' does not exist"

**原因:** Storageが有効化されていない

**解決策:**
1. Supabase Dashboard → **Storage**
2. Storageを有効化
3. マイグレーションを再実行

### エラー: "permission denied"

**原因:** データベース権限不足

**解決策:**
```bash
# Supabase service roleで実行
supabase db push --db-url "postgresql://postgres:[PASSWORD]@[PROJECT_REF].supabase.co:5432/postgres"
```

---

## 関連ファイル

- **Frontend:** `types/media.ts` - `MAX_FILE_SIZE = 2GB`
- **Frontend:** `features/media/components/MediaUpload.tsx` - UI text更新
- **Backend:** `supabase/migrations/003_storage_setup.sql` - 初期設定（500MB）
- **Backend:** `supabase/migrations/005_update_file_size_limit.sql` - **このマイグレーション（2GB）**

---

## 注意事項

⚠️ **重要:**
- 2GB制限はSupabase Free Planでもサポートされていますが、**ストレージ容量制限（無料プランは1GB）**に注意してください
- 大容量ファイルのアップロードには時間がかかります（進捗バーを確認）
- ネットワークタイムアウトを避けるため、安定した接続環境で実施してください

---

## 実行コマンド（まとめ）

```bash
# 1. マイグレーション確認
supabase migration list

# 2. Dry run
supabase db push --dry-run

# 3. 適用
supabase db push

# 4. 確認
psql "$DATABASE_URL" -c "SELECT id, name, file_size_limit/1024/1024/1024 AS limit_gb FROM storage.buckets WHERE id='media-files';"
```

適用完了後、アプリケーションで2GBまでのファイルをアップロードできるようになります！
