-- Enforce Job Status Transitions
CREATE OR REPLACE FUNCTION validate_job_status_transition()
RETURNS TRIGGER AS $$
DECLARE
  -- Define valid transitions as a JSON object
  valid_transitions jsonb := '{
    "draft": ["sent", "approved", "archived"],
    "sent": ["approved", "archived", "draft"],
    "approved": ["in_progress", "archived", "draft"],
    "in_progress": ["completed", "archived", "approved"],
    "completed": ["invoiced", "archived", "in_progress"],
    "invoiced": ["paid", "archived", "completed"],
    "paid": ["archived", "invoiced"],
    "archived": ["draft"]
  }';
  allowed_next_states jsonb;
BEGIN
  -- Allow no change
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get allowed next states for the current state
  allowed_next_states := valid_transitions -> OLD.status;

  -- Check if transition is allowed
  IF allowed_next_states IS NULL OR NOT (allowed_next_states @> to_jsonb(NEW.status)) THEN
    RAISE EXCEPTION 'Invalid job status transition from % to %', OLD.status, NEW.status;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create Trigger
DROP TRIGGER IF EXISTS enforce_job_status_transition ON jobs;
CREATE TRIGGER enforce_job_status_transition
  BEFORE UPDATE OF status ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION validate_job_status_transition();
