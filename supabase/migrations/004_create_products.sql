
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL,

    name VARCHAR(150) NOT NULL,
    sku VARCHAR(100),
    barcode VARCHAR(100),
    description TEXT,

    purchase_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    selling_price NUMERIC(12, 2) NOT NULL,

    unit VARCHAR(30) NOT NULL DEFAULT 'piece',

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT products_business_fk
        FOREIGN KEY (tenant_id)
        REFERENCES businesses(id)
        ON DELETE RESTRICT,

    CONSTRAINT products_purchase_price_check
        CHECK (purchase_price >= 0),

    CONSTRAINT products_selling_price_check
        CHECK (selling_price >= 0)
);

CREATE INDEX products_tenant_id_idx
    ON products (tenant_id);

CREATE INDEX products_name_idx
    ON products (tenant_id, name);

CREATE UNIQUE INDEX products_tenant_sku_unique
    ON products (tenant_id, sku)
    WHERE sku IS NOT NULL;

CREATE UNIQUE INDEX products_tenant_barcode_unique
    ON products (tenant_id, barcode)
    WHERE barcode IS NOT NULL;
