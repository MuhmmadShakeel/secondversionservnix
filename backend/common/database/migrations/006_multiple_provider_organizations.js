export const name = '006_multiple_provider_organizations'

export const up = `
  ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_owner_user_id_key;
  CREATE INDEX IF NOT EXISTS organizations_owner_user_id_index ON organizations(owner_user_id);
`
