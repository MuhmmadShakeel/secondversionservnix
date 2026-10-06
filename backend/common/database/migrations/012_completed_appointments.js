export const name = '012_completed_appointments'

export const up = `
  ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
  ALTER TABLE appointments ADD CONSTRAINT appointments_status_check
    CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled', 'completed', 'expired'));
`
