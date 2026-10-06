export const name = '010_employee_duty_assignments'

export const up = `
  CREATE TABLE IF NOT EXISTS employee_duty_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS employee_duty_assignments_employee_index
    ON employee_duty_assignments(employee_user_id);
  CREATE INDEX IF NOT EXISTS employee_duty_assignments_organization_index
    ON employee_duty_assignments(organization_id);
`
