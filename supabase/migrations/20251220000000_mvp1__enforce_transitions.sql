-- Migration to enforce state transitions
-- 20250101000000_mvp1__enforce_transitions.sql

-- Job Transitions
CREATE OR REPLACE FUNCTION validate_job_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  IF OLD.status = 'draft' AND NEW.status IN ('sent') THEN RETURN NEW; END IF;
  IF OLD.status = 'sent' AND NEW.status IN ('approved') THEN RETURN NEW; END IF;
  IF OLD.status = 'approved' AND NEW.status IN ('in_progress') THEN RETURN NEW; END IF;
  IF OLD.status = 'in_progress' AND NEW.status IN ('completed', 'archived') THEN RETURN NEW; END IF;
  IF OLD.status = 'completed' AND NEW.status IN ('invoiced', 'archived') THEN RETURN NEW; END IF;
  IF OLD.status = 'invoiced' AND NEW.status IN ('paid') THEN RETURN NEW; END IF;
  IF OLD.status = 'paid' AND NEW.status IN ('archived') THEN RETURN NEW; END IF;

  RAISE EXCEPTION 'Illegal job status transition from % to %', OLD.status, NEW.status;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_job_status_transition ON jobs;
CREATE TRIGGER check_job_status_transition
BEFORE UPDATE OF status ON jobs
FOR EACH ROW
EXECUTE FUNCTION validate_job_status_transition();

-- Invoice Transitions
CREATE OR REPLACE FUNCTION validate_invoice_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- draft -> sent, void
  IF OLD.status = 'draft' AND NEW.status IN ('sent', 'void') THEN RETURN NEW; END IF;
  -- sent -> paid, void, overdue
  IF OLD.status = 'sent' AND NEW.status IN ('paid', 'void', 'overdue') THEN RETURN NEW; END IF;
  -- overdue -> paid, void, sent
  IF OLD.status = 'overdue' AND NEW.status IN ('paid', 'void', 'sent') THEN RETURN NEW; END IF;
  -- paid -> void
  IF OLD.status = 'paid' AND NEW.status IN ('void') THEN RETURN NEW; END IF;

  RAISE EXCEPTION 'Illegal invoice status transition from % to %', OLD.status, NEW.status;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_invoice_status_transition ON invoices;
CREATE TRIGGER check_invoice_status_transition
BEFORE UPDATE OF status ON invoices
FOR EACH ROW
EXECUTE FUNCTION validate_invoice_status_transition();
