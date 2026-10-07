export interface SavedAddress {
  id: string;
  userId: string;
  label: string | null;
  name: string;
  line1: string;
  // Required for new and edited addresses; null only on addresses saved
  // before that rule existed.
  line2: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;      // ISO alpha-2
  phone: string;
  isDefault: boolean;   // read-only — server-controlled
  createdAt: string;
  updatedAt: string;
}

/**
 * Body for POST /api/user/addresses. The backend rejects null for optional
 * fields here: leave `label` out rather than sending null.
 */
export interface CreateAddressInput {
  label?: string;
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
}

/**
 * Body for PATCH /api/user/addresses/:id — any subset. `label: null` clears the
 * label; line2 can be changed but never cleared.
 */
export type UpdateAddressInput = Partial<Omit<CreateAddressInput, "label">> & {
  label?: string | null;
};
