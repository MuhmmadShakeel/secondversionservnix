export const name = '009_employee_signup_organization'

export const up = `
  ALTER TABLE employee_profiles ALTER COLUMN phone DROP NOT NULL;
  ALTER TABLE employee_profiles ALTER COLUMN city DROP NOT NULL;
  ALTER TABLE employee_profiles ALTER COLUMN address DROP NOT NULL;
  ALTER TABLE employee_profiles ALTER COLUMN job_title DROP NOT NULL;
  ALTER TABLE employee_profiles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
  CREATE INDEX IF NOT EXISTS employee_profiles_organization_id_index ON employee_profiles(organization_id);
`
