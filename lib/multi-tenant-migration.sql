-- Add user_id to all data tables for multi-tenant isolation
-- Run this as the first step of the data-leakage fix.

ALTER TABLE goals ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE interruptions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE reflections ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE weekly_objectives ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE roadmap_nodes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE roadmap_phases ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Backfill: assign existing records to the first user (admin fix-up)
-- If no users exist yet, these columns stay NULL until new data is created.
-- (Only runs if the user_id column is still entirely NULL)
UPDATE goals SET user_id = (SELECT id FROM users LIMIT 1) WHERE user_id IS NULL AND EXISTS (SELECT 1 FROM users);
UPDATE sessions SET user_id = (SELECT id FROM users LIMIT 1) WHERE user_id IS NULL AND EXISTS (SELECT 1 FROM users);
UPDATE tasks SET user_id = (SELECT id FROM users LIMIT 1) WHERE user_id IS NULL AND EXISTS (SELECT 1 FROM users);
UPDATE interruptions SET user_id = (SELECT id FROM users LIMIT 1) WHERE user_id IS NULL AND EXISTS (SELECT 1 FROM users);
UPDATE reflections SET user_id = (SELECT id FROM users LIMIT 1) WHERE user_id IS NULL AND EXISTS (SELECT 1 FROM users);
UPDATE weekly_objectives SET user_id = (SELECT id FROM users LIMIT 1) WHERE user_id IS NULL AND EXISTS (SELECT 1 FROM users);
UPDATE roadmap_nodes SET user_id = (SELECT id FROM users LIMIT 1) WHERE user_id IS NULL AND EXISTS (SELECT 1 FROM users);
UPDATE roadmap_phases SET user_id = (SELECT id FROM users LIMIT 1) WHERE user_id IS NULL AND EXISTS (SELECT 1 FROM users);

-- Indexes for user-scoped queries
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_interruptions_user_id ON interruptions(user_id);
CREATE INDEX IF NOT EXISTS idx_reflections_user_id ON reflections(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_objectives_user_id ON weekly_objectives(user_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_nodes_user_id ON roadmap_nodes(user_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_phases_user_id ON roadmap_phases(user_id);
