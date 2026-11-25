import { pool } from "../../database/index.ts";
import type { Product } from "./products.types.ts";
import type {
  CreateProductInput,
  ProductRepository,
  UpdateProductInput,
} from "./products.repository.ts";

interface ProductRow {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  description: string | null;

  vendor_cost_price: string;
  sale_price: string;
  box_sale_price: string | null;
  wholesale_piece_price: string | null;
  wholesale_box_price: string | null;
  wholesale_carton_price: string | null;
  old_sale_price: string | null;

  unit: string;
  pieces_per_box: number | null;
  boxes_per_carton: number | null;

  piece_qr_code: string | null;
  box_qr_code: string | null;
  carton_qr_code: string | null;

  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const productColumns = `
  id, name, sku, barcode, description,
  vendor_cost_price, sale_price, box_sale_price,
  wholesale_piece_price, wholesale_box_price,
  wholesale_carton_price, old_sale_price,
  unit, pieces_per_box, boxes_per_carton,
  piece_qr_code, box_qr_code, carton_qr_code,
  is_active, created_at, updated_at
`;

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    barcode: row.barcode,
    description: row.description,

    vendorCostPrice: row.vendor_cost_price,
    salePrice: row.sale_price,
    boxSalePrice: row.box_sale_price,
    wholesalePiecePrice: row.wholesale_piece_price,
    wholesaleBoxPrice: row.wholesale_box_price,
    wholesaleCartonPrice: row.wholesale_carton_price,
    oldSalePrice: row.old_sale_price,

    unit: row.unit,
    piecesPerBox: row.pieces_per_box,
    boxesPerCarton: row.boxes_per_carton,

    pieceQrCode: row.piece_qr_code,
    boxQrCode: row.box_qr_code,
    cartonQrCode: row.carton_qr_code,

    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class PostgresProductRepository implements ProductRepository {
  async create(tenantId: string, input: CreateProductInput): Promise<Product> {
    const result = await pool.query<ProductRow>(
      `INSERT INTO products (
        tenant_id, name, sku, barcode, description,
        vendor_cost_price, sale_price, box_sale_price,
        wholesale_piece_price, wholesale_box_price,
        wholesale_carton_price, old_sale_price,
        unit, pieces_per_box, boxes_per_carton,
        piece_qr_code, box_qr_code, carton_qr_code
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10, $11, $12,
        $13, $14, $15, $16, $17, $18
      )
      RETURNING ${productColumns}`,
      [
        tenantId,
        input.name,
        input.sku ?? null,
        input.barcode ?? null,
        input.description ?? null,

        input.vendorCostPrice,
        input.salePrice,
        input.boxSalePrice ?? null,
        input.wholesalePiecePrice ?? null,
        input.wholesaleBoxPrice ?? null,
        input.wholesaleCartonPrice ?? null,
        input.oldSalePrice ?? null,

        input.unit,
        input.piecesPerBox ?? null,
        input.boxesPerCarton ?? null,

        input.pieceQrCode ?? null,
        input.boxQrCode ?? null,
        input.cartonQrCode ?? null,
      ],
    );

    return mapProduct(result.rows[0]!);
  }

  async findById(tenantId: string, id: string): Promise<Product | null> {
    const result = await pool.query<ProductRow>(
      `SELECT ${productColumns}
       FROM products
       WHERE tenant_id = $1 AND id = $2
       LIMIT 1`,
      [tenantId, id],
    );

    const row = result.rows[0];

    return row ? mapProduct(row) : null;
  }

  async findAll(tenantId: string): Promise<Product[]> {
    const result = await pool.query<ProductRow>(
      `SELECT ${productColumns}
       FROM products
       WHERE tenant_id = $1
       ORDER BY created_at DESC`,
      [tenantId],
    );

    return result.rows.map(mapProduct);
  }

  async update(
    tenantId: string,
    id: string,
    input: UpdateProductInput,
  ): Promise<Product | null> {
    const fields = [
      ["name", input.name],
      ["sku", input.sku],
      ["barcode", input.barcode],
      ["description", input.description],

      ["vendor_cost_price", input.vendorCostPrice],
      ["sale_price", input.salePrice],
      ["box_sale_price", input.boxSalePrice],
      ["wholesale_piece_price", input.wholesalePiecePrice],
      ["wholesale_box_price", input.wholesaleBoxPrice],
      ["wholesale_carton_price", input.wholesaleCartonPrice],
      ["old_sale_price", input.oldSalePrice],

      ["unit", input.unit],
      ["pieces_per_box", input.piecesPerBox],
      ["boxes_per_carton", input.boxesPerCarton],

      ["piece_qr_code", input.pieceQrCode],
      ["box_qr_code", input.boxQrCode],
      ["carton_qr_code", input.cartonQrCode],
    ] as const;

    const values: unknown[] = [tenantId, id];
    const assignments: string[] = [];

    for (const [column, value] of fields) {
      if (value !== undefined) {
        values.push(value);
        assignments.push(`${column} = $${values.length}`);
      }
    }

    if (assignments.length === 0) {
      return this.findById(tenantId, id);
    }

    assignments.push("updated_at = NOW()");

    const result = await pool.query<ProductRow>(
      `UPDATE products
       SET ${assignments.join(", ")}
       WHERE tenant_id = $1 AND id = $2
       RETURNING ${productColumns}`,
      values,
    );

    const row = result.rows[0];

    return row ? mapProduct(row) : null;
  }

  async setActive(
    tenantId: string,
    id: string,
    isActive: boolean,
  ): Promise<Product | null> {
    const result = await pool.query<ProductRow>(
      `UPDATE products
       SET is_active = $3, updated_at = NOW()
       WHERE tenant_id = $1 AND id = $2
       RETURNING ${productColumns}`,
      [tenantId, id, isActive],
    );

    const row = result.rows[0];

    return row ? mapProduct(row) : null;
  }
}
