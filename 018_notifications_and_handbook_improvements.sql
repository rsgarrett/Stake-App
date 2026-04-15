-- Migration 018: Notifications System and Handbook Protocol Improvements
-- Based on General Handbook Chapter 30: Callings in the Church

-- Enhance notifications table with more fields
ALTER TABLE calling_notifications
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS action_url TEXT, -- Link to relevant page
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email_notifications BOOLEAN DEFAULT TRUE,
  in_app_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT FALSE,
  notify_on_recommendation_submitted BOOLEAN DEFAULT TRUE,
  notify_on_approval_needed BOOLEAN DEFAULT TRUE,
  notify_on_status_change BOOLEAN DEFAULT TRUE,
  notify_on_calling_extended BOOLEAN DEFAULT TRUE,
  notify_on_sustaining_scheduled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add Handbook protocol fields to callings
ALTER TABLE callings
ADD COLUMN IF NOT EXISTS requires_bishop_interview BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS bishop_interview_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS bishop_interview_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS requires_temple_recommend_review BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS temple_recommend_reviewed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS requires_high_council_sustaining BOOLEAN DEFAULT FALSE, -- For stake callings
ADD COLUMN IF NOT EXISTS high_council_sustained_date DATE,
ADD COLUMN IF NOT EXISTS requires_stake_conference_ratification BOOLEAN DEFAULT FALSE, -- For MP ordinations
ADD COLUMN IF NOT EXISTS stake_conference_ratified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stake_conference_date DATE,
ADD COLUMN IF NOT EXISTS calling_level TEXT CHECK (calling_level IN ('ward', 'stake', 'general')), -- Per Handbook
ADD COLUMN IF NOT EXISTS is_priesthood_office BOOLEAN DEFAULT FALSE, -- Distinguish priesthood from calling
ADD COLUMN IF NOT EXISTS requires_ordination BOOLEAN DEFAULT FALSE, -- For MP ordinations
ADD COLUMN IF NOT EXISTS ordination_date DATE,
ADD COLUMN IF NOT EXISTS ordination_performed_by UUID REFERENCES users(id);

-- Add fields for proper release process (Handbook protocol)
ALTER TABLE callings
ADD COLUMN IF NOT EXISTS release_requested BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS release_reason TEXT,
ADD COLUMN IF NOT EXISTS release_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS release_approved_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS release_approved_date TIMESTAMPTZ;

-- Function to create notifications based on workflow events
CREATE OR REPLACE FUNCTION create_calling_notification()
RETURNS TRIGGER AS $$
DECLARE
  notification_users UUID[];
  user_record RECORD;
  notification_message TEXT;
  notification_title TEXT;
  action_url_value TEXT;
BEGIN
  -- Determine who should be notified based on the change
  notification_users := ARRAY[]::UUID[];

  -- If calling is submitted or status changes to bishop_review, notify bishops
  IF NEW.workflow_status = 'bishop_review' AND (OLD.workflow_status IS NULL OR OLD.workflow_status != 'bishop_review') THEN
    SELECT ARRAY_AGG(id) INTO notification_users
    FROM users
    WHERE role = 'bishop' AND stake_id = NEW.stake_id;
    
    notification_title := 'New Calling Requires Bishop Approval';
    notification_message := format('%s - %s (%s Ward) requires your approval', NEW.person_name, NEW.calling_name, COALESCE(NEW.ward, 'Unknown'));
    action_url_value := format('/modules/leadership/workflow?calling=%s', NEW.id);
  END IF;

  -- If bishop approves, notify presidency
  IF NEW.bishop_approval = TRUE AND (OLD.bishop_approval IS NULL OR OLD.bishop_approval = FALSE) THEN
    SELECT ARRAY_AGG(id) INTO notification_users
    FROM users
    WHERE role IN ('stake_president', 'counselor') AND stake_id = NEW.stake_id;
    
    notification_title := 'Calling Ready for Presidency Review';
    notification_message := format('%s - %s has been approved by Bishop and needs Presidency approval', NEW.person_name, NEW.calling_name);
    action_url_value := format('/modules/leadership/workflow?calling=%s', NEW.id);
  END IF;

  -- If presidency approves, notify high council
  IF NEW.presidency_approval = TRUE AND (OLD.presidency_approval IS NULL OR OLD.presidency_approval = FALSE) THEN
    SELECT ARRAY_AGG(id) INTO notification_users
    FROM users
    WHERE role = 'high_council' AND stake_id = NEW.stake_id;
    
    notification_title := 'Calling Ready for High Council Review';
    notification_message := format('%s - %s has been approved by Presidency and needs High Council approval', NEW.person_name, NEW.calling_name);
    action_url_value := format('/modules/leadership/workflow?calling=%s', NEW.id);
  END IF;

  -- If all approvals complete, notify assigned person to extend
  IF NEW.calling_extended = FALSE 
     AND NEW.bishop_approval = TRUE 
     AND NEW.presidency_approval = TRUE 
     AND NEW.high_council_approval = TRUE
     AND (OLD.high_council_approval IS NULL OR OLD.high_council_approval = FALSE) THEN
    -- Notify stake presidency that calling is ready to extend
    SELECT ARRAY_AGG(id) INTO notification_users
    FROM users
    WHERE role IN ('stake_president', 'counselor') AND stake_id = NEW.stake_id;
    
    notification_title := 'Calling Ready to Extend';
    notification_message := format('%s - %s has all approvals and is ready to be extended', NEW.person_name, NEW.calling_name);
    action_url_value := format('/modules/leadership/workflow?calling=%s', NEW.id);
  END IF;

  -- If calling is extended, notify relevant parties
  IF NEW.calling_extended = TRUE AND (OLD.calling_extended IS NULL OR OLD.calling_extended = FALSE) THEN
    -- Notify the person who submitted it
    IF NEW.submitted_by IS NOT NULL THEN
      notification_users := ARRAY[NEW.submitted_by];
    END IF;
    
    notification_title := 'Calling Extended';
    notification_message := format('The calling for %s as %s has been extended', NEW.person_name, NEW.calling_name);
    action_url_value := format('/modules/leadership/tracker');
  END IF;

  -- Create notifications for all relevant users
  IF array_length(notification_users, 1) > 0 THEN
    FOREACH user_record IN ARRAY notification_users
    LOOP
      INSERT INTO calling_notifications (
        calling_id,
        user_id,
        notification_type,
        title,
        message,
        action_url,
        priority,
        read
      ) VALUES (
        NEW.id,
        user_record,
        'workflow_update',
        notification_title,
        notification_message,
        action_url_value,
        CASE 
          WHEN NEW.workflow_status IN ('rejected', 'completed') THEN 'normal'
          WHEN NEW.workflow_status IN ('ready_to_extend', 'extended') THEN 'high'
          ELSE 'normal'
        END,
        FALSE
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create notifications on calling updates
CREATE TRIGGER create_calling_notifications_trigger
  AFTER INSERT OR UPDATE ON callings
  FOR EACH ROW
  WHEN (NEW.workflow_status IS DISTINCT FROM OLD.workflow_status 
        OR NEW.bishop_approval IS DISTINCT FROM OLD.bishop_approval
        OR NEW.presidency_approval IS DISTINCT FROM OLD.presidency_approval
        OR NEW.high_council_approval IS DISTINCT FROM OLD.high_council_approval
        OR NEW.calling_extended IS DISTINCT FROM OLD.calling_extended)
  EXECUTE FUNCTION create_calling_notification();

-- Function to notify when recommendation is submitted
CREATE OR REPLACE FUNCTION notify_recommendation_submitted()
RETURNS TRIGGER AS $$
DECLARE
  notification_users UUID[];
BEGIN
  -- Notify stake presidency when recommendation is submitted
  SELECT ARRAY_AGG(id) INTO notification_users
  FROM users
  WHERE role IN ('stake_president', 'counselor', 'clerk') AND stake_id = NEW.stake_id;

  IF array_length(notification_users, 1) > 0 THEN
    INSERT INTO calling_notifications (
      recommendation_id,
      user_id,
      notification_type,
      title,
      message,
      action_url,
      priority,
      read
    )
    SELECT
      NEW.id,
      unnest(notification_users),
      'recommendation_submitted',
      'New Calling Recommendation Submitted',
      format('%s - %s (%s Ward) has been recommended for %s', NEW.person_name, NEW.calling_name, NEW.ward, NEW.type),
      format('/modules/leadership/workflow?recommendation=%s', NEW.id),
      'normal',
      FALSE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for recommendation notifications
CREATE TRIGGER notify_recommendation_submitted_trigger
  AFTER INSERT ON calling_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION notify_recommendation_submitted();

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_calling_notifications_user_unread ON calling_notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_calling_notifications_created_at ON calling_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calling_notifications_priority ON calling_notifications(priority, created_at DESC);

-- Add RLS policies for notifications
ALTER TABLE calling_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view their own notifications" ON calling_notifications
  FOR SELECT USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" ON calling_notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Users can manage their own notification preferences
CREATE POLICY "Users can view their own preferences" ON notification_preferences
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own preferences" ON notification_preferences
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own preferences" ON notification_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());
