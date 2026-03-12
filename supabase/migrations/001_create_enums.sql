-- 001: Create all PostgreSQL enum types
-- These enums provide strict validation at the database level.

CREATE TYPE user_role AS ENUM (
  'admin', 'requester', 'focal_point', 'staff', 'compliance'
);

CREATE TYPE user_status AS ENUM (
  'pending', 'active', 'rejected', 'inactive'
);

CREATE TYPE item_category AS ENUM (
  'chemical_reagent', 'calibration_std', 'gas', 'material_supply', 'peroxide'
);

CREATE TYPE order_status AS ENUM (
  'pending', 'approved', 'rejected', 'ordered',
  'partially_received', 'received', 'closed'
);

CREATE TYPE lot_status AS ENUM (
  'active', 'depleted', 'expired', 'quarantined', 'disposed'
);

CREATE TYPE inspection_status AS ENUM ('normal', 'warning', 'quarantine');

CREATE TYPE extension_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TYPE regulatory_status AS ENUM ('active', 'expired', 'pending_review');

CREATE TYPE transaction_type AS ENUM (
  'order_created', 'order_approved', 'order_rejected',
  'check_in', 'check_out', 'inspection',
  'shelf_life_extension', 'regulatory_update', 'user_approved'
);
