export const name = '001_initial_setup'
export const up = `
  CREATE EXTENSION IF NOT EXISTS "pgcrypto";

  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'customer'
      CHECK (role IN ('customer', 'service_provider', 'platform_admin')),
    status VARCHAR(30) NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending', 'active', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50);
  DO $$
  BEGIN
    IF to_regclass('public.roles') IS NOT NULL
       AND EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'role_id'
       ) THEN
      UPDATE users AS u SET role = r.code FROM roles AS r
      WHERE u.role_id = r.id AND u.role IS NULL;
      ALTER TABLE users DROP COLUMN role_id;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check') THEN
      ALTER TABLE users ADD CONSTRAINT users_role_check
      CHECK (role IN ('customer', 'service_provider', 'platform_admin'));
    END IF;
  END $$;
  UPDATE users SET role = 'customer' WHERE role IS NULL;
  ALTER TABLE users ALTER COLUMN role SET NOT NULL;
  ALTER TABLE users ALTER COLUMN role SET DEFAULT 'customer';
  CREATE OR REPLACE FUNCTION normalize_user_role() RETURNS trigger AS $$
  BEGIN
    NEW.role := LOWER(BTRIM(NEW.role));
    IF NEW.role = 'admin' THEN NEW.role := 'platform_admin'; END IF;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
  DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'users_normalize_role_trigger') THEN
      CREATE TRIGGER users_normalize_role_trigger
      BEFORE INSERT OR UPDATE OF role ON users
      FOR EACH ROW EXECUTE FUNCTION normalize_user_role();
    END IF;
  END $$;
  DROP INDEX IF EXISTS users_role_id_index;
  CREATE INDEX IF NOT EXISTS users_role_index ON users(role);
  DROP TABLE IF EXISTS roles;

  CREATE TABLE IF NOT EXISTS auth_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS auth_sessions_user_id_index ON auth_sessions(user_id);
`
