export const name = '016_expired_pending_appointments'

export const up = `
  ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
  ALTER TABLE appointments ADD CONSTRAINT appointments_status_check
    CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled', 'completed', 'expired'));
  ALTER TABLE appointment_history DROP CONSTRAINT IF EXISTS appointment_history_event_type_check;
  ALTER TABLE appointment_history ADD CONSTRAINT appointment_history_event_type_check
    CHECK (event_type IN ('cancelled', 'rescheduled', 'expired'));
`
