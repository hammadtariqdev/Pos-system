CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    bill_number VARCHAR(50) NOT NULL,
    customer_name VARCHAR(150),
    customer_phone VARCHAR(30),

    subtotal NUMERIC(12,2) NOT NULL,
    discount NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(12,2) NOT NULL,

    paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(20) NOT NULL DEFAULT 'cash',

    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT sales_bill_number_unique
        UNIQUE (tenant_id, bill_number),

    CONSTRAINT sales_subtotal_non_negative
        CHECK (subtotal >= 0),

    CONSTRAINT sales_discount_non_negative
        CHECK (discount >= 0),

    CONSTRAINT sales_total_non_negative
        CHECK (total_amount >= 0),

    CONSTRAINT sales_paid_non_negative
        CHECK (paid_amount >= 0),

    CONSTRAINT sales_paid_not_greater_than_total
        CHECK (paid_amount <= total_amount),

    CONSTRAINT sales_payment_method_check
        CHECK (
            payment_method IN (
                'cash',
                'credit',
                'partial'
            )
        )
);

CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    product_id UUID NOT NULL,

    product_name VARCHAR(150) NOT NULL,
    sku VARCHAR(100),

    quantity INTEGER NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT sale_items_quantity_positive
        CHECK (quantity > 0),

    CONSTRAINT sale_items_unit_price_non_negative
        CHECK (unit_price >= 0),

    CONSTRAINT sale_items_subtotal_non_negative
        CHECK (subtotal >= 0),

    CONSTRAINT sale_items_tenant_sale_fk
        FOREIGN KEY (tenant_id, sale_id)
        REFERENCES sales(tenant_id, id)
        ON DELETE CASCADE
);

CREATE INDEX sales_tenant_created_idx
    ON sales (tenant_id, created_at DESC);

CREATE INDEX sale_items_sale_idx
    ON sale_items (tenant_id, sale_id);

CREATE INDEX sale_items_product_idx
    ON sale_items (tenant_id, product_id);