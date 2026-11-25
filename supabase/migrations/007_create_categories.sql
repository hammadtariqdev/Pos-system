CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL,

    name VARCHAR(100) NOT NULL,
    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT categories_business_fk
        FOREIGN KEY (tenant_id)
        REFERENCES businesses(id)
        ON DELETE RESTRICT,

    CONSTRAINT categories_tenant_id_id_unique
        UNIQUE (tenant_id, id)
);

CREATE UNIQUE INDEX categories_tenant_name_unique
    ON categories (tenant_id, LOWER(name));

CREATE INDEX categories_tenant_id_idx
    ON categories (tenant_id);

ALTER TABLE products
ADD COLUMN category_id UUID;

ALTER TABLE products
ADD CONSTRAINT products_category_tenant_fk
    FOREIGN KEY (tenant_id, category_id)
    REFERENCES categories (tenant_id, id)
    ON DELETE RESTRICT;

CREATE INDEX products_tenant_category_id_idx
    ON products (tenant_id, category_id);