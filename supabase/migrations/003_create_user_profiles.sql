-- 003: Create user_profiles table

CREATE TABLE user_profiles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    TEXT NOT NULL,
  email        TEXT NOT NULL,
  role         user_role,
  village_id   UUID REFERENCES villages(id),
  lab_id       UUID REFERENCES labs(id),
  status       user_status NOT NULL DEFAULT 'pending',
  approved_by  UUID REFERENCES user_profiles(id),
  approved_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_profiles_auth_user_id ON user_profiles (auth_user_id);
CREATE INDEX idx_user_profiles_status       ON user_profiles (status);
CREATE INDEX idx_user_profiles_village_id   ON user_profiles (village_id);
