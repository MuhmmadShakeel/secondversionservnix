export const name = '004_service_bookings'

export const up = `
  CREATE TABLE service_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
    buyer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_title VARCHAR(120) NOT NULL,
    agreed_price NUMERIC(12, 2) NOT NULL CHECK (agreed_price >= 0),
    contact_phone VARCHAR(30) NOT NULL,
    service_address VARCHAR(300) NOT NULL,
    request_details VARCHAR(2000) NOT NULL,
    preferred_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (buyer_user_id <> owner_user_id)
  );
  CREATE INDEX service_bookings_buyer_idx ON service_bookings(buyer_user_id, created_at DESC);
  CREATE INDEX service_bookings_owner_idx ON service_bookings(owner_user_id, created_at DESC);
  CREATE INDEX service_bookings_service_idx ON service_bookings(service_id, created_at DESC);
  CREATE UNIQUE INDEX service_bookings_one_pending_idx ON service_bookings(service_id, buyer_user_id) WHERE status = 'pending';
`
