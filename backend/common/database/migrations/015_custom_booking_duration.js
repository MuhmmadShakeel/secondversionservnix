export const name = '015_custom_booking_duration'

export const up = `
  ALTER TABLE appointments ADD COLUMN IF NOT EXISTS rate_duration_minutes INTEGER;
  ALTER TABLE appointments ADD COLUMN IF NOT EXISTS rate_price NUMERIC(12, 2);
`
