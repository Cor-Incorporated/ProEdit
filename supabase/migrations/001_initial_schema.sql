-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 255),
  settings JSONB NOT NULL DEFAULT '{"width": 1920, "height": 1080, "fps": 30, "aspectRatio": "16:9", "bitrate": 9000, "standard": "1080p"}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Media files table
CREATE TABLE media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_hash TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_size BIGINT NOT NULL CHECK (file_size > 0),
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, file_hash)
);

-- Tracks table
CREATE TABLE tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  track_index INTEGER NOT NULL CHECK (track_index >= 0),
  visible BOOLEAN NOT NULL DEFAULT true,
  locked BOOLEAN NOT NULL DEFAULT false,
  muted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, track_index)
);

-- Effects table (polymorphic)
CREATE TABLE effects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('video', 'audio', 'image', 'text')),
  track INTEGER NOT NULL CHECK (track >= 0),
  start_at_position INTEGER NOT NULL CHECK (start_at_position >= 0),
  duration INTEGER NOT NULL CHECK (duration > 0),
  start_time INTEGER NOT NULL CHECK (start_time >= 0),
  end_time INTEGER NOT NULL CHECK (end_time >= 0),
  media_file_id UUID REFERENCES media_files(id) ON DELETE CASCADE,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Filters table
CREATE TABLE filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  effect_id UUID NOT NULL REFERENCES effects(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('brightness', 'contrast', 'saturation', 'blur', 'hue')),
  value REAL NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Animations table
CREATE TABLE animations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  effect_id UUID NOT NULL REFERENCES effects(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('in', 'out')),
  for_type TEXT NOT NULL,
  ease_type TEXT NOT NULL,
  duration INTEGER NOT NULL CHECK (duration > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transitions table
CREATE TABLE transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  from_effect_id UUID REFERENCES effects(id) ON DELETE CASCADE,
  to_effect_id UUID REFERENCES effects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration INTEGER NOT NULL CHECK (duration > 0),
  params JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Export jobs table
CREATE TABLE export_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_url TEXT,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_updated_at ON projects(updated_at DESC);
CREATE INDEX idx_media_files_user_id ON media_files(user_id);
CREATE INDEX idx_media_files_hash ON media_files(user_id, file_hash);
CREATE INDEX idx_effects_project_id ON effects(project_id);
CREATE INDEX idx_effects_track ON effects(project_id, track);
CREATE INDEX idx_effects_timeline ON effects(project_id, start_at_position);
CREATE INDEX idx_tracks_project_id ON tracks(project_id, track_index);
CREATE INDEX idx_filters_effect_id ON filters(effect_id);
CREATE INDEX idx_animations_effect_id ON animations(effect_id);
CREATE INDEX idx_transitions_effects ON transitions(from_effect_id, to_effect_id);
CREATE INDEX idx_export_jobs_project ON export_jobs(project_id, status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to projects and effects
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_effects_updated_at BEFORE UPDATE ON effects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
