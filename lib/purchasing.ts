// Purchasing: supplier, purchase request, purchase order.

export type Supplier = {
  id: string;
  name: string;
  phone?: string;
  active: boolean;
};

export type PurchaseRequest = {
  id: string;
  submissionId: string;
  itemName: string;
  qty: number;
  unit: string;
  outletId?: string;
  outletName?: string;
  areaUnit?: string;
  urgency: string;
  requestedBy: string;
  status: "pending" | "approved" | "in_purchasing" | "fulfilled" | "cancelled";
  createdAt: string;
};

export type PurchaseStatus =
  | "Draft"
  | "Waiting Approval"
  | "Approved"
  | "Purchased"
  | "Received"
  | "Paid"
  | "Debt"
  | "Cancelled";

export type PurchaseOrder = {
  id: string;
  supplierId: string;
  supplierName: string;
  purchaseRequestId?: string;
  requestedBy: string;
  outletId?: string;
  outletName?: string;
  areaUnit?: string;
  items: { itemName: string; qty: number; unit: string }[];
  totalEstimated: number;
  totalActual?: number;
  paymentMethod?: string;
  paymentStatus: "unpaid" | "paid" | "debt";
  status: PurchaseStatus;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export function seedSuppliers(): Supplier[] {
  return [
    { id: "sup-1", name: "CV Sumber Pangan", phone: "0811111111", active: true },
    { id: "sup-2", name: "Toko Kopi Nusantara", phone: "0822222222", active: true },
    { id: "sup-3", name: "Packaging Jaya", phone: "0833333333", active: true },
    { id: "sup-4", name: "NF Bahan Baku", phone: "0844444444", active: true }
  ];
}

export function estimatePrice(itemName: string, qty: number, unitPrice = 15000) {
  return qty * unitPrice;
}
