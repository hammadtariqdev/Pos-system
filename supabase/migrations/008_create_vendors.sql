
CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL,
    category_id UUID NOT NULL,

    name VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    email VARCHAR(255),
    address TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT vendors_business_fk
        FOREIGN KEY (tenant_id)
        REFERENCES businesses(id)
        ON DELETE RESTRICT,

    CONSTRAINT vendors_category_tenant_fk
        FOREIGN KEY (tenant_id, category_id)
        REFERENCES categories(tenant_id, id)
        ON DELETE RESTRICT,

    CONSTRAINT vendors_tenant_id_id_unique
        UNIQUE (tenant_id, id)
);

CREATE INDEX vendors_tenant_id_idx
    ON vendors (tenant_id);

CREATE INDEX vendors_tenant_category_id_idx
    ON vendors (tenant_id, category_id);

CREATE INDEX vendors_tenant_name_idx
    ON vendors (tenant_id, name);
