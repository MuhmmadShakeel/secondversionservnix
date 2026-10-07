export const name = '003_hiring'

export const up = `
  CREATE TABLE hiring_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(160) NOT NULL,
    category VARCHAR(80) NOT NULL,
    description VARCHAR(5000) NOT NULL,
    budget_min NUMERIC(12, 2) NOT NULL CHECK (budget_min >= 0),
    budget_max NUMERIC(12, 2) NOT NULL CHECK (budget_max >= budget_min),
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'awarded')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX hiring_requirements_owner_idx ON hiring_requirements(owner_user_id, created_at DESC);
  CREATE INDEX hiring_requirements_open_idx ON hiring_requirements(created_at DESC) WHERE status = 'open';

  CREATE TABLE hiring_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requirement_id UUID NOT NULL REFERENCES hiring_requirements(id) ON DELETE CASCADE,
    worker_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cover_letter VARCHAR(3000) NOT NULL,
    bid_amount NUMERIC(12, 2) NOT NULL CHECK (bid_amount >= 0),
    delivery_days INTEGER NOT NULL CHECK (delivery_days BETWEEN 1 AND 365),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(requirement_id, worker_user_id)
  );
  CREATE INDEX hiring_proposals_worker_idx ON hiring_proposals(worker_user_id, created_at DESC);
  CREATE INDEX hiring_proposals_requirement_idx ON hiring_proposals(requirement_id, created_at DESC);
  CREATE UNIQUE INDEX hiring_one_accepted_proposal_idx ON hiring_proposals(requirement_id) WHERE status = 'accepted';

  CREATE TABLE hiring_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requirement_id UUID NOT NULL REFERENCES hiring_requirements(id) ON DELETE CASCADE,
    kind VARCHAR(10) NOT NULL CHECK (kind IN ('photo', 'video', 'audio')),
    mime_type VARCHAR(80) NOT NULL,
    file_name VARCHAR(180) NOT NULL,
    content BYTEA NOT NULL,
    size_bytes INTEGER NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 8388608),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX hiring_media_requirement_idx ON hiring_media(requirement_id);
`
