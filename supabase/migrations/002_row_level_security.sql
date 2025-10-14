-- Enable Row Level Security on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE effects ENABLE ROW LEVEL SECURITY;
ALTER TABLE filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE animations ENABLE ROW LEVEL SECURITY;
ALTER TABLE transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_jobs ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Media files policies
CREATE POLICY "Users can view own media"
  ON media_files FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upload media"
  ON media_files FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own media"
  ON media_files FOR DELETE
  USING (auth.uid() = user_id);

-- Tracks policies (access through project ownership)
CREATE POLICY "Users can manage tracks in own projects"
  ON tracks
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = tracks.project_id
    AND projects.user_id = auth.uid()
  ));

-- Effects policies (access through project ownership)
CREATE POLICY "Users can manage effects in own projects"
  ON effects
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = effects.project_id
    AND projects.user_id = auth.uid()
  ));

-- Filters policies (access through project ownership)
CREATE POLICY "Users can manage filters in own projects"
  ON filters
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = filters.project_id
    AND projects.user_id = auth.uid()
  ));

-- Animations policies (access through project ownership)
CREATE POLICY "Users can manage animations in own projects"
  ON animations
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = animations.project_id
    AND projects.user_id = auth.uid()
  ));

-- Transitions policies (access through project ownership)
CREATE POLICY "Users can manage transitions in own projects"
  ON transitions
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = transitions.project_id
    AND projects.user_id = auth.uid()
  ));

-- Export jobs policies (access through project ownership)
CREATE POLICY "Users can manage export jobs in own projects"
  ON export_jobs
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = export_jobs.project_id
    AND projects.user_id = auth.uid()
  ));
