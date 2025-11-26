-- Add task_progress column to progress_logs to track per-log task completion
ALTER TABLE progress_logs
ADD COLUMN IF NOT EXISTS task_progress INTEGER;

-- Allow optional goal/task links for standalone logs
ALTER TABLE progress_logs
ALTER COLUMN goal_id DROP NOT NULL;

ALTER TABLE progress_logs
ALTER COLUMN task_id DROP NOT NULL;

-- Ensure task_progress stays within the 0-100 range when provided
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_name = 'progress_logs'
      AND constraint_name = 'progress_logs_task_progress_check'
  ) THEN
    ALTER TABLE progress_logs
    ADD CONSTRAINT progress_logs_task_progress_check
    CHECK (task_progress BETWEEN 0 AND 100);
  END IF;
END $$;

