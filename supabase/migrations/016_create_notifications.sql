-- 016: Create notifications table and enum

-- Enum for all notification types in the system
CREATE TYPE notification_type AS ENUM (
  'order_created',        -- new order placed → notify focal_point(s)
  'order_approved',       -- order approved   → notify requester
  'order_rejected',       -- order rejected   → notify requester
  'user_approved',        -- account approved → notify user
  'user_rejected',        -- account rejected → notify user
  'peroxide_quarantine',  -- lot quarantined  → notify admin + compliance
  'shelf_life_request',   -- extension requested → notify compliance
  'shelf_life_approved',  -- extension approved  → notify requester
  'shelf_life_rejected'   -- extension rejected  → notify requester
);

-- Notifications inbox per user
CREATE TABLE notifications (
  id         UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID             NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  type       notification_type NOT NULL,
  title      TEXT             NOT NULL,
  body       TEXT             NOT NULL,
  link       TEXT,            -- optional deep-link, e.g. '/orders/uuid'
  is_read    BOOLEAN          NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ      NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_id ON notifications (user_id);
CREATE INDEX idx_notifications_unread  ON notifications (user_id, is_read) WHERE is_read = false;

-- ================================================================
-- RLS Policies
-- ================================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only read their own notifications
CREATE POLICY "Notifications: read own"
  ON notifications FOR SELECT
  USING (user_id = get_current_profile_id());

-- Users can mark their own notifications as read (is_read update only)
CREATE POLICY "Notifications: mark own as read"
  ON notifications FOR UPDATE
  USING (user_id = get_current_profile_id())
  WITH CHECK (user_id = get_current_profile_id());

-- INSERT is done exclusively by triggers running as SECURITY DEFINER (no anon access)
CREATE POLICY "Notifications: service role can insert"
  ON notifications FOR INSERT
  WITH CHECK (true);
