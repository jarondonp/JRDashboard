-- Add progress_percentage column to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0;

-- Set progress to 100 for completed tasks
UPDATE tasks 
SET progress_percentage = 100 
WHERE status IN ('completada', 'completed') AND progress_percentage = 0;

-- Set progress to 0 for pending tasks
UPDATE tasks 
SET progress_percentage = 0 
WHERE status IN ('pendiente', 'pending') AND progress_percentage IS NULL;
