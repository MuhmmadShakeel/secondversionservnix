export const name = '002_organizations'

export const up = `
  CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
    business_name VARCHAR(160) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    address VARCHAR(300) NOT NULL,
    description TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  ALTER TABLE organizations ADD COLUMN IF NOT EXISTS email VARCHAR(255);
  UPDATE organizations AS o SET email = u.email FROM users AS u
  WHERE o.owner_user_id = u.id AND (o.email IS NULL OR o.email = '');
  ALTER TABLE organizations ALTER COLUMN email SET NOT NULL;
  CREATE INDEX IF NOT EXISTS organizations_status_index ON organizations(status);

  CREATE TABLE IF NOT EXISTS organization_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes BETWEEN 15 AND 480),
    price NUMERIC(12, 2) CHECK (price IS NULL OR price >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS organization_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    CHECK (start_time < end_time),
    UNIQUE (organization_id, day_of_week)
  );

  CREATE INDEX IF NOT EXISTS organization_services_organization_id_index
    ON organization_services(organization_id);
  CREATE INDEX IF NOT EXISTS organization_availability_organization_id_index
    ON organization_availability(organization_id);

  CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    service_id UUID REFERENCES organization_services(id) ON DELETE SET NULL,
    organization_name VARCHAR(160) NOT NULL,
    service_name VARCHAR(120) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    price NUMERIC(12, 2),
    scheduled_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT appointments_one_per_customer_service UNIQUE (customer_id, service_id),
    CONSTRAINT appointments_one_per_service_slot UNIQUE (service_id, scheduled_at)
  );
  CREATE INDEX IF NOT EXISTS appointments_customer_id_index ON appointments(customer_id);
  CREATE INDEX IF NOT EXISTS appointments_organization_id_index ON appointments(organization_id);
`
