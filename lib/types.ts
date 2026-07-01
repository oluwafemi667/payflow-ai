export type InvoiceStatus = "pending" | "paid" | "failed";

export interface Invoice {
  id: string;
  business_name: string;
  customer_name: string;
  customer_email: string;
  description: string;
  amount: number;
  status: InvoiceStatus;
  nomba_order_reference: string | null;
  nomba_checkout_link: string | null;
  created_at: string;
  paid_at: string | null;
}
