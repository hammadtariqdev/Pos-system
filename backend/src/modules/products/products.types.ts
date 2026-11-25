
export interface Product {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  description: string | null;

  // Pricing
  vendorCostPrice: string;
  salePrice: string;
  boxSalePrice: string | null;
  wholesalePiecePrice: string | null;
  wholesaleBoxPrice: string | null;
  wholesaleCartonPrice: string | null;
  oldSalePrice: string | null;

  // Packaging
  unit: string;
  piecesPerBox: number | null;
  boxesPerCarton: number | null;

  // QR identifiers
  pieceQrCode: string | null;
  boxQrCode: string | null;
  cartonQrCode: string | null;

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
