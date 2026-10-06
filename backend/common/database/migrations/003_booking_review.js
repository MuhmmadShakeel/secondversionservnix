export const name = '003_booking_review'

export const up = `
  ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
  ALTER TABLE appointments ADD CONSTRAINT appointments_status_check
    CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled', 'completed', 'expired'));

  ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_one_per_customer_service;
  ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_one_per_service_slot;

  CREATE UNIQUE INDEX IF NOT EXISTS appointments_active_customer_service_index
    ON appointments(customer_id, service_id)
    WHERE status IN ('pending', 'confirmed');
  CREATE UNIQUE INDEX IF NOT EXISTS appointments_active_service_slot_index
    ON appointments(service_id, scheduled_at)
    WHERE status IN ('pending', 'confirmed');
`
