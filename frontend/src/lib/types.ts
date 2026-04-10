export type ItemStatus = "ACQUIRED" | "PROCESSING" | "LISTED" | "SOLD" | "RETURNED";

export interface Vendor {
  id: string;
  name: string;
  contactEmail: string | null;
  contactPhone: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  contactEmail: string | null;
  contactPhone: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseDeal {
  id: string;
  vendorId: string;
  vendor?: Vendor;
  date: string;
  totalPrice: number;
  fees: number;
  taxes: number;
  notes: string | null;
  items?: Item[];
  _count?: { items: number };
  createdAt: string;
  updatedAt: string;
}

export interface Item {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  status: ItemStatus;
  categoryId: string | null;
  category?: Category;
  storageLocationId: string | null;
  purchaseDealId: string | null;
  purchaseDeal?: PurchaseDeal;
  allocatedPurchaseCost: number;
  allocatedFees: number;
  processingLogs?: ItemProcessingLog[];
  saleLineItem?: SaleLineItem | null;
  createdAt: string;
  updatedAt: string;
}

export interface ItemProcessingLog {
  id: string;
  itemId: string;
  description: string;
  cost: number;
  date: string;
  createdAt: string;
}

export interface Sale {
  id: string;
  customerId: string;
  customer?: Customer;
  date: string;
  notes: string | null;
  lineItems?: SaleLineItem[];
  _count?: { lineItems: number };
  createdAt: string;
  updatedAt: string;
}

export interface SaleLineItem {
  id: string;
  saleId: string;
  itemId: string;
  item?: Item;
  salePrice: number;
}
