export const name = '005_booking_customer_details'

export const up = `
  CREATE TABLE IF NOT EXISTS booking_customer_details (
    booking_id UUID PRIMARY KEY REFERENCES appointments(id) ON DELETE CASCADE,
    full_name VARCHAR(120) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    address VARCHAR(300) NOT NULL,
    city VARCHAR(100) NOT NULL,
    instructions VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`
