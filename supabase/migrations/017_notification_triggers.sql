-- 017: Notification triggers
--
-- All notification rows are inserted by SECURITY DEFINER triggers so they
-- bypass RLS and fire reliably regardless of the calling session's role.

-- ================================================================
-- Shared helper: insert a single notification row
-- ================================================================
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type    notification_type,
  p_title   TEXT,
  p_body    TEXT,
  p_link    TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, body, link)
  VALUES (p_user_id, p_type, p_title, p_body, p_link);
END;
$$;

-- ================================================================
-- Trigger 1: purchase_orders AFTER INSERT
-- Notifies all focal_point users in the same village.
-- ================================================================
CREATE OR REPLACE FUNCTION notify_on_order_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item_name TEXT;
  v_recipient RECORD;
BEGIN
  -- Resolve the item name for a human-readable title
  SELECT name INTO v_item_name FROM item_master WHERE id = NEW.item_id;

  -- Notify every focal_point (and admin) in the same village
  FOR v_recipient IN
    SELECT id FROM user_profiles
    WHERE village_id = NEW.village_id
      AND role IN ('focal_point', 'admin')
      AND status = 'active'
      AND id <> NEW.requester_id
  LOOP
    PERFORM create_notification(
      v_recipient.id,
      'order_created',
      'New Order Request',
      'A new order for "' || COALESCE(v_item_name, 'unknown item') || '" has been submitted.',
      '/approvals'
    );
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_order_created_notify
  AFTER INSERT ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_order_created();

-- ================================================================
-- Trigger 2: purchase_orders AFTER UPDATE
-- Detects status changes pending→approved or pending→rejected
-- and notifies the original requester.
-- ================================================================
CREATE OR REPLACE FUNCTION notify_on_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item_name TEXT;
BEGIN
  -- Only fire on meaningful status transitions
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  SELECT name INTO v_item_name FROM item_master WHERE id = NEW.item_id;

  IF NEW.status = 'approved' THEN
    PERFORM create_notification(
      NEW.requester_id,
      'order_approved',
      'Order Approved',
      'Your order for "' || COALESCE(v_item_name, 'unknown item') || '" (PO: ' || COALESCE(NEW.po_number, NEW.id::TEXT) || ') has been approved.',
      '/orders'
    );

  ELSIF NEW.status = 'rejected' THEN
    PERFORM create_notification(
      NEW.requester_id,
      'order_rejected',
      'Order Rejected',
      'Your order for "' || COALESCE(v_item_name, 'unknown item') || '" was rejected.' ||
        CASE WHEN NEW.reject_reason IS NOT NULL THEN ' Reason: ' || NEW.reject_reason ELSE '' END,
      '/orders'
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_order_status_notify
  AFTER UPDATE ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_order_status_change();

-- ================================================================
-- Trigger 3: user_profiles AFTER UPDATE
-- Notifies the user when their account status changes to
-- active (approved) or rejected.
-- ================================================================
CREATE OR REPLACE FUNCTION notify_on_user_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'active' AND OLD.status = 'pending' THEN
    PERFORM create_notification(
      NEW.id,
      'user_approved',
      'Account Approved',
      'Your account has been approved. You can now log in and start using the system.',
      '/dashboard'
    );

  ELSIF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
    PERFORM create_notification(
      NEW.id,
      'user_rejected',
      'Account Not Approved',
      'Unfortunately your account registration was not approved. Please contact your administrator.',
      NULL
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_user_status_notify
  AFTER UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_user_status_change();

-- ================================================================
-- Trigger 4: peroxide_inspections AFTER INSERT
-- Notifies admin and compliance users in the same village
-- whenever a lot is quaternary (status = 'quarantine').
-- ================================================================
CREATE OR REPLACE FUNCTION notify_on_peroxide_quarantine()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lot_village UUID;
  v_item_name   TEXT;
  v_recipient   RECORD;
BEGIN
  IF NEW.status <> 'quarantine' THEN
    RETURN NEW;
  END IF;

  -- Resolve the lot's village and item name
  SELECT il.village_id, im.name
  INTO   v_lot_village, v_item_name
  FROM   item_lots il
  JOIN   item_master im ON im.id = il.item_id
  WHERE  il.id = NEW.lot_id;

  FOR v_recipient IN
    SELECT id FROM user_profiles
    WHERE village_id = v_lot_village
      AND role IN ('admin', 'compliance')
      AND status = 'active'
  LOOP
    PERFORM create_notification(
      v_recipient.id,
      'peroxide_quarantine',
      '⚠ Peroxide Lot Quarantined',
      '"' || COALESCE(v_item_name, 'Unknown item') || '" has been quarantined after a peroxide inspection.',
      '/peroxide'
    );
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_peroxide_quarantine_notify
  AFTER INSERT ON peroxide_inspections
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_peroxide_quarantine();

-- ================================================================
-- Trigger 5: shelf_life_extensions AFTER INSERT
-- Notifies compliance officers in the same village.
-- ================================================================
CREATE OR REPLACE FUNCTION notify_on_shelf_life_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lot_village UUID;
  v_item_name   TEXT;
  v_recipient   RECORD;
BEGIN
  SELECT il.village_id, im.name
  INTO   v_lot_village, v_item_name
  FROM   item_lots il
  JOIN   item_master im ON im.id = il.item_id
  WHERE  il.id = NEW.lot_id;

  FOR v_recipient IN
    SELECT id FROM user_profiles
    WHERE village_id = v_lot_village
      AND role IN ('compliance', 'admin')
      AND status = 'active'
      AND id <> NEW.requested_by
  LOOP
    PERFORM create_notification(
      v_recipient.id,
      'shelf_life_request',
      'Shelf Life Extension Requested',
      'A shelf life extension has been requested for "' || COALESCE(v_item_name, 'a lot') || '".',
      '/shelf-life'
    );
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_shelf_life_request_notify
  AFTER INSERT ON shelf_life_extensions
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_shelf_life_request();

-- ================================================================
-- Trigger 6: shelf_life_extensions AFTER UPDATE
-- Notifies the requester when a decision is made.
-- ================================================================
CREATE OR REPLACE FUNCTION notify_on_shelf_life_decision()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item_name TEXT;
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  SELECT im.name
  INTO   v_item_name
  FROM   item_lots il
  JOIN   item_master im ON im.id = il.item_id
  WHERE  il.id = NEW.lot_id;

  IF NEW.status = 'approved' THEN
    PERFORM create_notification(
      NEW.requested_by,
      'shelf_life_approved',
      'Shelf Life Extension Approved',
      'Your shelf life extension request for "' || COALESCE(v_item_name, 'a lot') || '" has been approved.',
      '/shelf-life'
    );
  ELSIF NEW.status = 'rejected' THEN
    PERFORM create_notification(
      NEW.requested_by,
      'shelf_life_rejected',
      'Shelf Life Extension Rejected',
      'Your shelf life extension request for "' || COALESCE(v_item_name, 'a lot') || '" was not approved.',
      '/shelf-life'
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_shelf_life_decision_notify
  AFTER UPDATE ON shelf_life_extensions
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_shelf_life_decision();
