-- Compass Time Tracking Database Schema
-- PostgreSQL Schema for migrating from localStorage

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  tag TEXT NOT NULL,
  target_hours INTEGER NOT NULL,
  target_date TEXT NOT NULL,
  weekly_target INTEGER NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID,
  task_name TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  duration INTEGER NOT NULL,
  duration_formatted TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE NOT NULL,
  date TEXT NOT NULL,
  pomodoro_count INTEGER DEFAULT 0,
  productivity_rating INTEGER
);

-- Interruptions table
CREATE TABLE IF NOT EXISTS interruptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID,
  type TEXT NOT NULL CHECK (type IN ('distraction', 'external', 'thought', 'break', 'admin')),
  cause TEXT NOT NULL,
  duration INTEGER NOT NULL,
  note TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  recovery_time INTEGER NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Reflections table
CREATE TABLE IF NOT EXISTS reflections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date TEXT UNIQUE NOT NULL,
  mood INTEGER NOT NULL,
  accomplishments TEXT[] DEFAULT '{}',
  challenges TEXT[] DEFAULT '{}',
  improvements TEXT[] DEFAULT '{}',
  rating INTEGER NOT NULL,
  wins TEXT[] DEFAULT '{}',
  tomorrow_plan TEXT NOT NULL,
  notes TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Weekly Objectives table
CREATE TABLE IF NOT EXISTS weekly_objectives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in-progress', 'completed')),
  week_start TEXT NOT NULL,
  week_end TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
);

-- Daily Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  objective_id UUID,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  estimated_time INTEGER NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'in-progress', 'completed')),
  scheduled_date TEXT NOT NULL,
  scheduled_time TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  session_id UUID,
  pomodoro_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (objective_id) REFERENCES weekly_objectives(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL
);

-- Task Checklist Items table
CREATE TABLE IF NOT EXISTS checklist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL,
  text TEXT NOT NULL,
  done BOOLEAN DEFAULT FALSE,
  order_index INTEGER NOT NULL,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Roadmap Nodes table (hierarchical structure)
CREATE TABLE IF NOT EXISTS roadmap_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('phase', 'objective', 'task')),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  goal_id UUID NOT NULL,
  parent_id UUID,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in-progress', 'completed')),
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES roadmap_nodes(id) ON DELETE CASCADE
);

-- Legacy Roadmap Phases table (for backward compatibility)
CREATE TABLE IF NOT EXISTS roadmap_phases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID NOT NULL,
  name TEXT NOT NULL,
  done BOOLEAN DEFAULT FALSE,
  order_index INTEGER NOT NULL,
  FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
);

-- Settings table (for app configuration like onboarding status)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sessions_task_id ON sessions(task_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
CREATE INDEX IF NOT EXISTS idx_interruptions_session_id ON interruptions(session_id);
CREATE INDEX IF NOT EXISTS idx_reflections_date ON reflections(date);
CREATE INDEX IF NOT EXISTS idx_weekly_objectives_goal_id ON weekly_objectives(goal_id);
CREATE INDEX IF NOT EXISTS idx_weekly_objectives_week_start ON weekly_objectives(week_start);
CREATE INDEX IF NOT EXISTS idx_tasks_objective_id ON tasks(objective_id);
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_date ON tasks(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_tasks_session_id ON tasks(session_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_task_id ON checklist_items(task_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_nodes_goal_id ON roadmap_nodes(goal_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_nodes_parent_id ON roadmap_nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_phases_goal_id ON roadmap_phases(goal_id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
