export const name = '013_password_reset_attempts'

export const up = `
  ALTER TABLE password_resets ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 0;
`
