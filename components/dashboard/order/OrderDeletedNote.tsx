import type { UserOrderRow } from "@/app/types/order";
import { SUPPORT_EMAIL } from "@/lib/dataDeletion";
import { PrivacyPolicyLink } from "@/components/shared/PrivacyPolicyLink";

export type OrderDeletion = "UNPAID_EXPIRED" | "PAID_AFTER_DELETION" | "BOOK_DELETED";

/**
 * What automatic data deletion did to this order, from the flags the list and detail responses carry (undefined
 * from an older backend reads as false). Null: nothing to say, the order shows as before.
 */
export function getOrderDeletion(
  order: Pick<UserOrderRow, "publicStatus" | "photoDeleted" | "filesDeleted" | "paidAfterDeletion">,
): OrderDeletion | null {
  if (order.paidAfterDeletion) return "PAID_AFTER_DELETION";
  if (order.publicStatus.code === "AWAITING_PAYMENT" && (order.photoDeleted || order.filesDeleted)) {
    return "UNPAID_EXPIRED";
  }
  if (order.filesDeleted) return "BOOK_DELETED";
  return null;
}

export function OrderDeletedNote({ kind }: { kind: OrderDeletion }) {
  if (kind === "UNPAID_EXPIRED") {
    return (
      <>
        This preview has expired and was deleted. Please start again from the comic page. Photos and previews are
        deleted after a few days, as described in our <PrivacyPolicyLink />.
      </>
    );
  }
  if (kind === "PAID_AFTER_DELETION") {
    return (
      <>
        Your order is paid. We could not make the book because your photo was removed. Please contact us at{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="underline hover:text-[#914A8C]">
          {SUPPORT_EMAIL}
        </a>
        .
      </>
    );
  }
  return (
    <>
      Your book was deleted for your privacy, as described in our <PrivacyPolicyLink />.
    </>
  );
}
