// The view-only share link of a customer's book (feature 14). Mirrors the backend's share.service.ts.

/** What the preview page needs to draw its Share button. */
export interface ShareState {
  available: boolean;
  active: boolean;
  token: string | null;
  showName: boolean;
}

export interface CreatedShare {
  token: string;
  showName: boolean;
}

/** The only data a shared page receives: no session, order, address, email or storage url. */
export interface SharedBook {
  comic: { id: string; title: string };
  /** Present only when the customer ticked "show my child's name". */
  childName?: string;
  pages: { pageNumber: number }[];
  /** Pages of the full book that are not part of the free preview (unpaid books only). */
  lockedCount: number;
  /** At least one page can be shown. */
  ready: boolean;
  /** Every page of the book is either shown or counted in lockedCount. */
  complete: boolean;
}
