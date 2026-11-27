export type PaymentMethod = "cash" | "credit" | "partial";

export interface CreateSaleItemInput {
  productId: string;
  quantity: number;
  unitPrice?: number;
}

export interface CreateSaleInput {
  billNumber: string;
  customerName?: string;
  customerPhone?: string;
  discount?: number;
  paidAmount?: number;
  paymentMethod?: PaymentMethod;
  items: CreateSaleItemInput[];
}

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  sku: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  tenantId: string;
  billNumber: string;
  customerName: string | null;
  customerPhone: string | null;
  subtotal: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethod: PaymentMethod;
  createdBy: string;
  createdAt: Date;
  items: SaleItem[];
}

export interface SaleListItem {
  id: string;
  billNumber: string;
  customerName: string | null;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethod: PaymentMethod;
  createdAt: Date;
}

export interface SalesRepository {
  createSale(
    tenantId: string,
    userId: string,
    input: CreateSaleInput,
  ): Promise<Sale>;

  findById(tenantId: string, saleId: string): Promise<Sale | null>;

  findAll(tenantId: string): Promise<SaleListItem[]>;
}
