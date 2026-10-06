export const name = '018_appointment_timeline'

export const up = `
  ALTER TABLE appointment_history DROP CONSTRAINT IF EXISTS appointment_history_event_type_check;
  ALTER TABLE appointment_history ADD CONSTRAINT appointment_history_event_type_check
    CHECK (event_type IN ('cancelled', 'rescheduled', 'expired', 'rejected', 'confirmed', 'completed'));
`
