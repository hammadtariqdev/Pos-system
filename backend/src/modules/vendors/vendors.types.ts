export interface Vendor {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  createdAt: Date;
  updatedAt: Date;
}
