import type { Pool, PoolClient } from "pg";

import type {
  CreateSaleInput,
  Sale,
  SaleItem,
  SaleListItem,
  SalesRepository,
} from "./sales.types";

interface ProductRow {
  id: string;
  name: string;
  sku: string | null;
  sale_price: string;
}

interface StockRow {
  stock_pieces: number;
}

export class PostgresSalesRepository implements SalesRepository {
  constructor(private readonly pool: Pool) {}

  async createSale(
    tenantId: string,
    userId: string,
    input: CreateSaleInput,
  ): Promise<Sale> {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      const productMap = new Map<string, ProductRow>();

      for (const item of input.items) {
        const result = await client.query<ProductRow>(
          `
          SELECT id, name, sku, sale_price
          FROM products
          WHERE tenant_id = $1
            AND id = $2
            AND is_active = true
          FOR SHARE
          `,
          [tenantId, item.productId],
        );

        const product = result.rows[0];

        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        productMap.set(product.id, product);
      }

      let subtotal = 0;

      const preparedItems = [];

      for (const item of input.items) {
        const product = productMap.get(item.productId);

        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        const unitPrice = item.unitPrice ?? Number(product.sale_price);

        const itemSubtotal = unitPrice * item.quantity;

        subtotal += itemSubtotal;

        preparedItems.push({
          ...item,
          productName: product.name,
          sku: product.sku,
          unitPrice,
          subtotal: itemSubtotal,
        });
      }

      const discount = input.discount ?? 0;
      const totalAmount = Math.max(0, subtotal - discount);
      const paidAmount = input.paidAmount ?? 0;

      if (paidAmount > totalAmount) {
        throw new Error("Paid amount cannot exceed total amount");
      }

      const paymentMethod =
        input.paymentMethod ??
        (paidAmount === totalAmount
          ? "cash"
          : paidAmount === 0
            ? "credit"
            : "partial");

      const saleResult = await client.query<{
        id: string;
        tenant_id: string;
        bill_number: string;
        customer_name: string | null;
        customer_phone: string | null;
        subtotal: string;
        discount: string;
        total_amount: string;
        paid_amount: string;
        payment_method: "cash" | "credit" | "partial";
        created_by: string;
        created_at: Date;
      }>(
        `
        INSERT INTO sales (
          tenant_id,
          bill_number,
          customer_name,
          customer_phone,
          subtotal,
          discount,
          total_amount,
          paid_amount,
          payment_method,
          created_by
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
        )
        RETURNING *
        `,
        [
          tenantId,
          input.billNumber,
          input.customerName ?? null,
          input.customerPhone ?? null,
          subtotal,
          discount,
          totalAmount,
          paidAmount,
          paymentMethod,
          userId,
        ],
      );

      const sale = saleResult.rows[0];

      if (!sale) {
        throw new Error("Failed to create sale");
      }

      const items: SaleItem[] = [];

      for (const item of preparedItems) {
        const stockResult = await client.query<StockRow>(
          `
          SELECT stock_pieces
          FROM inventory_stock
          WHERE tenant_id = $1
            AND product_id = $2
          FOR UPDATE
          `,
          [tenantId, item.productId],
        );

        const stock = stockResult.rows[0];

        if (!stock) {
          throw new Error(`Inventory not found for product: ${item.productId}`);
        }

        if (stock.stock_pieces < item.quantity) {
          throw new Error(
            `Insufficient stock for product: ${item.productName}`,
          );
        }

        await client.query(
          `
          UPDATE inventory_stock
          SET
            stock_pieces = stock_pieces - $1,
            updated_at = NOW()
          WHERE tenant_id = $2
            AND product_id = $3
          `,
          [item.quantity, tenantId, item.productId],
        );

        await client.query(
          `
          INSERT INTO inventory_movements (
            tenant_id,
            product_id,
            quantity_delta,
            movement_type,
            note,
            created_by
          )
          VALUES ($1,$2,$3,'sale',$4,$5)
          `,
          [
            tenantId,
            item.productId,
            -item.quantity,
            `Sale ${input.billNumber}`,
            userId,
          ],
        );

        const itemResult = await client.query<{
          id: string;
        }>(
          `
          INSERT INTO sale_items (
            sale_id,
            tenant_id,
            product_id,
            product_name,
            sku,
            quantity,
            unit_price,
            subtotal
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
          RETURNING id
          `,
          [
            sale.id,
            tenantId,
            item.productId,
            item.productName,
            item.sku,
            item.quantity,
            item.unitPrice,
            item.subtotal,
          ],
        );

        const itemRow = itemResult.rows[0];

        if (!itemRow) {
          throw new Error("Failed to create sale item");
        }

        items.push({
          id: itemRow.id,
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
        });
      }

      await client.query("COMMIT");

      return {
        id: sale.id,
        tenantId: sale.tenant_id,
        billNumber: sale.bill_number,
        customerName: sale.customer_name,
        customerPhone: sale.customer_phone,
        subtotal: Number(sale.subtotal),
        discount: Number(sale.discount),
        totalAmount: Number(sale.total_amount),
        paidAmount: Number(sale.paid_amount),
        remainingAmount: Number(sale.total_amount) - Number(sale.paid_amount),
        paymentMethod: sale.payment_method,
        createdBy: sale.created_by,
        createdAt: sale.created_at,
        items,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async findById(tenantId: string, saleId: string): Promise<Sale | null> {
    const saleResult = await this.pool.query<{
      id: string;
      tenant_id: string;
      bill_number: string;
      customer_name: string | null;
      customer_phone: string | null;
      subtotal: string;
      discount: string;
      total_amount: string;
      paid_amount: string;
      payment_method: "cash" | "credit" | "partial";
      created_by: string;
      created_at: Date;
    }>(
      `
      SELECT *
      FROM sales
      WHERE tenant_id = $1
        AND id = $2
      `,
      [tenantId, saleId],
    );

    const row = saleResult.rows[0];

    if (!row) {
      return null;
    }

    const itemResult = await this.pool.query<{
      id: string;
      product_id: string;
      product_name: string;
      sku: string | null;
      quantity: number;
      unit_price: string;
      subtotal: string;
    }>(
      `
      SELECT
        id,
        product_id,
        product_name,
        sku,
        quantity,
        unit_price,
        subtotal
      FROM sale_items
      WHERE tenant_id = $1
        AND sale_id = $2
      ORDER BY created_at ASC
      `,
      [tenantId, saleId],
    );

    const items: SaleItem[] = itemResult.rows.map((item) => ({
      id: item.id,
      productId: item.product_id,
      productName: item.product_name,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
      subtotal: Number(item.subtotal),
    }));

    return {
      id: row.id,
      tenantId: row.tenant_id,
      billNumber: row.bill_number,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      subtotal: Number(row.subtotal),
      discount: Number(row.discount),
      totalAmount: Number(row.total_amount),
      paidAmount: Number(row.paid_amount),
      remainingAmount: Number(row.total_amount) - Number(row.paid_amount),
      paymentMethod: row.payment_method,
      createdBy: row.created_by,
      createdAt: row.created_at,
      items,
    };
  }

  async findAll(tenantId: string): Promise<SaleListItem[]> {
    const result = await this.pool.query<{
      id: string;
      bill_number: string;
      customer_name: string | null;
      total_amount: string;
      paid_amount: string;
      payment_method: "cash" | "credit" | "partial";
      created_at: Date;
    }>(
      `
      SELECT
        id,
        bill_number,
        customer_name,
        total_amount,
        paid_amount,
        payment_method,
        created_at
      FROM sales
      WHERE tenant_id = $1
      ORDER BY created_at DESC
      `,
      [tenantId],
    );

    return result.rows.map((row) => ({
      id: row.id,
      billNumber: row.bill_number,
      customerName: row.customer_name,
      totalAmount: Number(row.total_amount),
      paidAmount: Number(row.paid_amount),
      remainingAmount: Number(row.total_amount) - Number(row.paid_amount),
      paymentMethod: row.payment_method,
      createdAt: row.created_at,
    }));
  }
}
