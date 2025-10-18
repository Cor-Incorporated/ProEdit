-- Enhance export_jobs table with user scoping and RLS

ALTER TABLE export_jobs
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

UPDATE export_jobs ej
SET user_id = projects.user_id
FROM projects
WHERE ej.user_id IS NULL AND ej.project_id = projects.id;

ALTER TABLE export_jobs
  ALTER COLUMN user_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_export_jobs_user_status ON export_jobs(user_id, status);

ALTER TABLE export_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own export jobs"
  ON export_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert export jobs"
  ON export_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own export jobs"
  ON export_jobs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own export jobs"
  ON export_jobs FOR DELETE
  USING (auth.uid() = user_id);
