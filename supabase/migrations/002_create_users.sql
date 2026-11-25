CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL,

    name VARCHAR(100) NOT NULL,

    email VARCHAR(255) NOT NULL,

    password_hash TEXT NOT NULL,

    role VARCHAR(20) NOT NULL
        CHECK (role IN ('owner', 'employee')),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT users_business_fk
        FOREIGN KEY (tenant_id)
        REFERENCES businesses(id)
        ON DELETE RESTRICT,

    CONSTRAINT users_email_unique
        UNIQUE (email)
);

CREATE INDEX users_tenant_id_idx
    ON users (tenant_id);

CREATE INDEX users_email_idx
    ON users (email);