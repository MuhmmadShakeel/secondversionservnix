export const name = '014_appointment_history'

export const up = `
  CREATE TABLE IF NOT EXISTS appointment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(30) NOT NULL CHECK (event_type IN ('cancelled', 'rescheduled', 'expired')),
    previous_status VARCHAR(30) NOT NULL,
    new_status VARCHAR(30) NOT NULL,
    previous_scheduled_at TIMESTAMPTZ NOT NULL,
    new_scheduled_at TIMESTAMPTZ NOT NULL,
    previous_employee_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS appointment_history_booking_created_index
    ON appointment_history(booking_id, created_at DESC);
`
