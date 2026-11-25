
-- Rename the existing price columns to make their purpose explicit.
ALTER TABLE products
RENAME COLUMN purchase_price TO vendor_cost_price;

ALTER TABLE products
RENAME COLUMN selling_price TO sale_price;

-- Replace the old price constraints with clearly named constraints.
ALTER TABLE products
DROP CONSTRAINT products_purchase_price_check;

ALTER TABLE products
DROP CONSTRAINT products_selling_price_check;

ALTER TABLE products
ADD CONSTRAINT products_vendor_cost_price_check
CHECK (vendor_cost_price >= 0);

ALTER TABLE products
ADD CONSTRAINT products_sale_price_check
CHECK (sale_price >= 0);

-- Retail box price and the three wholesale prices.
ALTER TABLE products
ADD COLUMN box_sale_price NUMERIC(12, 2),
ADD COLUMN wholesale_piece_price NUMERIC(12, 2),
ADD COLUMN wholesale_box_price NUMERIC(12, 2),
ADD COLUMN wholesale_carton_price NUMERIC(12, 2),
ADD COLUMN old_sale_price NUMERIC(12, 2);

-- Optional prices must be non-negative when provided.
ALTER TABLE products
ADD CONSTRAINT products_box_sale_price_check
CHECK (box_sale_price IS NULL OR box_sale_price >= 0);

ALTER TABLE products
ADD CONSTRAINT products_wholesale_piece_price_check
CHECK (wholesale_piece_price IS NULL OR wholesale_piece_price >= 0);

ALTER TABLE products
ADD CONSTRAINT products_wholesale_box_price_check
CHECK (wholesale_box_price IS NULL OR wholesale_box_price >= 0);

ALTER TABLE products
ADD CONSTRAINT products_wholesale_carton_price_check
CHECK (wholesale_carton_price IS NULL OR wholesale_carton_price >= 0);

ALTER TABLE products
ADD CONSTRAINT products_old_sale_price_check
CHECK (old_sale_price IS NULL OR old_sale_price >= 0);


-- Packaging quantities.
ALTER TABLE products
ADD COLUMN pieces_per_box INTEGER,
ADD COLUMN boxes_per_carton INTEGER;

-- QR identifiers for each packaging unit.
ALTER TABLE products
ADD COLUMN piece_qr_code VARCHAR(100),
ADD COLUMN box_qr_code VARCHAR(100),
ADD COLUMN carton_qr_code VARCHAR(100);

-- Packaging quantities must be positive when configured.
ALTER TABLE products
ADD CONSTRAINT products_pieces_per_box_check
CHECK (pieces_per_box IS NULL OR pieces_per_box > 0);

ALTER TABLE products
ADD CONSTRAINT products_boxes_per_carton_check
CHECK (boxes_per_carton IS NULL OR boxes_per_carton > 0);

-- QR identifiers must be unique within each business.
CREATE UNIQUE INDEX products_tenant_piece_qr_unique
ON products (tenant_id, piece_qr_code)
WHERE piece_qr_code IS NOT NULL;

CREATE UNIQUE INDEX products_tenant_box_qr_unique
ON products (tenant_id, box_qr_code)
WHERE box_qr_code IS NOT NULL;

CREATE UNIQUE INDEX products_tenant_carton_qr_unique
ON products (tenant_id, carton_qr_code)
WHERE carton_qr_code IS NOT NULL;
