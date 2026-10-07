// Admin customer list — GET /api/admin/customers (+ /export for CSV).
//
// A "customer" is an account with at least one PAID order (any status from
// payment captured to delivered; never unpaid or cancelled).

/** Amount paid in one currency. Totals are never summed across currencies. */
export interface CustomerCurrencyTotal {
  currency: string;
  /** Decimal as a string, e.g. "4800.00". */
  amount: string;
}

export interface AdminCustomerRow {
  /** Better Auth's own random id — not a uuid. */
  userId: string;
  name: string;
  /** Account (login) email. */
  email: string;
  /** Shipping phone from their most recent paid order. Null if none recorded. */
  phone: string | null;
  /** Number of paid orders. */
  ordersCount: number;
  /** One entry per currency they've paid in, largest first. */
  totals: CustomerCurrencyTotal[];
  /** Distinct comic titles bought, most recent purchase first. */
  comicsBought: string[];
  firstPurchaseAt: string;
  lastPurchaseAt: string;
}

/** Always most-recent-purchase first server-side — there is no sort to pass. */
export interface AdminCustomersFilters {
  page?: number;
  pageSize?: number;
  /** Matched against name, account email and any phone they've ordered with. */
  search?: string;
}

export interface AdminCustomersPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AdminCustomersResponse {
  customers: AdminCustomerRow[];
  pagination: AdminCustomersPagination;
}
