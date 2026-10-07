export const name = '006_products'

export const up = `
  CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(160) NOT NULL,
    category VARCHAR(80) NOT NULL,
    description VARCHAR(3000) NOT NULL,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    quantity INTEGER NOT NULL CHECK (quantity BETWEEN 0 AND 999999),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active')),
    image_mime_type VARCHAR(30),
    image_file_name VARCHAR(180),
    image_content BYTEA,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK ((image_content IS NULL AND image_mime_type IS NULL AND image_file_name IS NULL)
      OR (image_content IS NOT NULL AND image_mime_type IS NOT NULL AND image_file_name IS NOT NULL)),
    CHECK (status <> 'active' OR (image_content IS NOT NULL AND quantity > 0))
  );
  CREATE INDEX products_owner_updated_idx ON products(owner_user_id, updated_at DESC);
`
