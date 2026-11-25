
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
