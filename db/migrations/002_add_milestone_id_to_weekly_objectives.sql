-- Add milestone_id column to weekly_objectives table
-- This links a weekly objective to a specific roadmap node (milestone) within a goal.
ALTER TABLE weekly_objectives 
ADD COLUMN IF NOT EXISTS milestone_id UUID REFERENCES roadmap_nodes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_weekly_objectives_milestone_id ON weekly_objectives(milestone_id);
